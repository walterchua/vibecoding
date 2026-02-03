import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Member, OTP, RefreshToken, Tier } from '../models';
import { Op } from 'sequelize';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class AuthService {
  private static generateOTPCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async sendOTP(phone: string): Promise<{ otpId: string; expiresAt: Date }> {
    // Invalidate existing OTPs for this phone
    await OTP.update(
      { isVerified: true },
      { where: { phone, isVerified: false } }
    );

    const code = this.generateOTPCode();
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '5');
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    const existingMember = await Member.findOne({ where: { phone } });

    const otp = await OTP.create({
      phone,
      memberId: existingMember?.id,
      code,
      expiresAt,
    });

    // In production, send SMS via Twilio or other provider
    console.log(`[DEV] OTP for ${phone}: ${code}`);

    return {
      otpId: otp.id,
      expiresAt,
    };
  }

  static async verifyOTP(
    phone: string,
    code: string
  ): Promise<{ member: Member | null; isNewMember: boolean; tokens?: TokenPair }> {
    const otp = await OTP.findOne({
      where: {
        phone,
        code,
        isVerified: false,
        expiresAt: { [Op.gt]: new Date() },
      },
      order: [['createdAt', 'DESC']],
    });

    if (!otp) {
      throw new Error('Invalid or expired OTP');
    }

    if (otp.attempts >= 3) {
      throw new Error('Too many attempts. Please request a new OTP');
    }

    await otp.update({ isVerified: true });

    const existingMember = await Member.findOne({ where: { phone } });

    if (existingMember) {
      await existingMember.update({ lastLoginAt: new Date(), isVerified: true });
      const tokens = await this.generateTokens(existingMember);
      return { member: existingMember, isNewMember: false, tokens };
    }

    return { member: null, isNewMember: true };
  }

  static async register(
    phone: string,
    profileData: {
      firstName?: string;
      lastName?: string;
      email?: string;
      dateOfBirth?: Date;
      gender?: 'male' | 'female' | 'other';
    }
  ): Promise<{ member: Member; tokens: TokenPair }> {
    // Get default tier (Bronze)
    let defaultTier = await Tier.findOne({ where: { code: 'BRONZE' } });

    if (!defaultTier) {
      // Create default tiers if they don't exist
      defaultTier = await Tier.create({
        name: 'Bronze',
        code: 'BRONZE',
        minPoints: 0,
        maxPoints: 499,
        pointsMultiplier: 1.0,
        color: '#CD7F32',
        sortOrder: 1,
      });
    }

    const member = await Member.create({
      phone,
      ...profileData,
      tierId: defaultTier.id,
      isVerified: true,
    });

    const tokens = await this.generateTokens(member);

    return { member, tokens };
  }

  static async generateTokens(member: Member): Promise<TokenPair> {
    const accessSecret = process.env.JWT_SECRET || 'default-secret';
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'default-refresh-secret';

    const accessToken = jwt.sign(
      { memberId: member.id, phone: member.phone },
      accessSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    const refreshTokenValue = crypto.randomBytes(64).toString('hex');
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    const refreshExpiresMs = this.parseExpiresIn(refreshExpiresIn);

    await RefreshToken.create({
      memberId: member.id,
      token: refreshTokenValue,
      expiresAt: new Date(Date.now() + refreshExpiresMs),
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  static async refreshTokens(refreshToken: string): Promise<TokenPair> {
    const storedToken = await RefreshToken.findOne({
      where: {
        token: refreshToken,
        isRevoked: false,
        expiresAt: { [Op.gt]: new Date() },
      },
      include: [{ model: Member, as: 'member' }],
    });

    if (!storedToken) {
      throw new Error('Invalid or expired refresh token');
    }

    const member = await Member.findByPk(storedToken.memberId);
    if (!member || !member.isActive) {
      throw new Error('Member not found or inactive');
    }

    // Revoke old token
    await storedToken.update({ isRevoked: true });

    // Generate new tokens
    return this.generateTokens(member);
  }

  static async logout(memberId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await RefreshToken.update(
        { isRevoked: true },
        { where: { memberId, token: refreshToken } }
      );
    } else {
      await RefreshToken.update(
        { isRevoked: true },
        { where: { memberId } }
      );
    }
  }

  private static parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 7 * 24 * 60 * 60 * 1000;
    }
  }
}
