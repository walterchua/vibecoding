import crypto from 'crypto';
import QRCodeLib from 'qrcode';
import { QRCode, Member, MemberVoucher, Voucher } from '../models';
import { PointsService } from './PointsService';
import { VoucherService } from './VoucherService';
import { Op } from 'sequelize';

interface QRPayload {
  type: 'points' | 'voucher' | 'membership';
  memberId: string;
  points?: number;
  memberVoucherId?: string;
  exp: number;
}

interface GenerateQRResult {
  qrCode: QRCode;
  qrImage: string; // Base64 encoded image
  expiresAt: Date;
}

interface ValidateQRResult {
  valid: boolean;
  type: 'points' | 'voucher' | 'membership';
  memberId: string;
  memberName?: string;
  points?: number;
  voucher?: {
    id: string;
    name: string;
    type: string;
    value: number;
  };
  qrCodeId: string;
}

export class QRService {
  private static readonly QR_SECRET = process.env.QR_SECRET || 'qr-secret-key';
  private static readonly QR_EXPIRY_MINUTES = parseInt(process.env.QR_EXPIRY_MINUTES || '15');

  private static generateSignature(payload: QRPayload): string {
    const data = JSON.stringify(payload);
    return crypto.createHmac('sha256', this.QR_SECRET).update(data).digest('hex');
  }

  private static verifySignature(payload: QRPayload, signature: string): boolean {
    const expectedSignature = this.generateSignature(payload);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  static async generatePointsQR(
    memberId: string,
    points: number
  ): Promise<GenerateQRResult> {
    const member = await Member.findByPk(memberId);
    if (!member) {
      throw new Error('Member not found');
    }

    if (member.availablePoints < points) {
      throw new Error('Insufficient points');
    }

    const expiresAt = new Date(Date.now() + this.QR_EXPIRY_MINUTES * 60 * 1000);

    const payload: QRPayload = {
      type: 'points',
      memberId,
      points,
      exp: expiresAt.getTime(),
    };

    const signature = this.generateSignature(payload);
    const token = Buffer.from(JSON.stringify({ ...payload, sig: signature })).toString('base64');

    const qrCode = await QRCode.create({
      memberId,
      type: 'points',
      payload,
      token,
      signature,
      pointsAmount: points,
      expiresAt,
    });

    const qrImage = await QRCodeLib.toDataURL(token, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
    });

    return { qrCode, qrImage, expiresAt };
  }

  static async generateVoucherQR(
    memberId: string,
    memberVoucherId: string
  ): Promise<GenerateQRResult> {
    const memberVoucher = await MemberVoucher.findOne({
      where: { id: memberVoucherId, memberId, status: 'active' },
      include: [{ model: Voucher, as: 'voucher' }],
    });

    if (!memberVoucher) {
      throw new Error('Voucher not found or not active');
    }

    if (memberVoucher.expiresAt < new Date()) {
      throw new Error('Voucher has expired');
    }

    const expiresAt = new Date(Date.now() + this.QR_EXPIRY_MINUTES * 60 * 1000);

    const payload: QRPayload = {
      type: 'voucher',
      memberId,
      memberVoucherId,
      exp: expiresAt.getTime(),
    };

    const signature = this.generateSignature(payload);
    const token = Buffer.from(JSON.stringify({ ...payload, sig: signature })).toString('base64');

    const qrCode = await QRCode.create({
      memberId,
      type: 'voucher',
      payload,
      token,
      signature,
      memberVoucherId,
      expiresAt,
    });

    const qrImage = await QRCodeLib.toDataURL(token, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
    });

    return { qrCode, qrImage, expiresAt };
  }

  static async generateMembershipQR(memberId: string): Promise<GenerateQRResult> {
    const member = await Member.findByPk(memberId);
    if (!member) {
      throw new Error('Member not found');
    }

    const expiresAt = new Date(Date.now() + this.QR_EXPIRY_MINUTES * 60 * 1000);

    const payload: QRPayload = {
      type: 'membership',
      memberId,
      exp: expiresAt.getTime(),
    };

    const signature = this.generateSignature(payload);
    const token = Buffer.from(JSON.stringify({ ...payload, sig: signature })).toString('base64');

    const qrCode = await QRCode.create({
      memberId,
      type: 'membership',
      payload,
      token,
      signature,
      expiresAt,
    });

    const qrImage = await QRCodeLib.toDataURL(token, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
    });

    return { qrCode, qrImage, expiresAt };
  }

  static async validateQR(token: string): Promise<ValidateQRResult> {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      const { sig, ...payload } = decoded as QRPayload & { sig: string };

      if (!this.verifySignature(payload, sig)) {
        throw new Error('Invalid QR signature');
      }

      if (payload.exp < Date.now()) {
        throw new Error('QR code has expired');
      }

      const qrCode = await QRCode.findOne({
        where: { token, status: 'active' },
      });

      if (!qrCode) {
        throw new Error('QR code not found or already used');
      }

      const member = await Member.findByPk(payload.memberId);
      if (!member) {
        throw new Error('Member not found');
      }

      const result: ValidateQRResult = {
        valid: true,
        type: payload.type,
        memberId: payload.memberId,
        memberName: `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.phone,
        qrCodeId: qrCode.id,
      };

      if (payload.type === 'points' && payload.points) {
        result.points = payload.points;
      }

      if (payload.type === 'voucher' && payload.memberVoucherId) {
        const memberVoucher = await MemberVoucher.findByPk(payload.memberVoucherId, {
          include: [{ model: Voucher, as: 'voucher' }],
        });
        if (memberVoucher) {
          const voucher = memberVoucher.get('voucher') as Voucher;
          result.voucher = {
            id: memberVoucher.id,
            name: voucher.name,
            type: voucher.type,
            value: voucher.value,
          };
        }
      }

      return result;
    } catch (error) {
      throw new Error(`QR validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async consumeQR(
    token: string,
    posId: string,
    locationName?: string
  ): Promise<{ success: boolean; type: string; details: Record<string, unknown> }> {
    const validation = await this.validateQR(token);

    const qrCode = await QRCode.findByPk(validation.qrCodeId);
    if (!qrCode) {
      throw new Error('QR code not found');
    }

    await qrCode.update({
      status: 'used',
      usedAt: new Date(),
      usedByPosId: posId,
    });

    const details: Record<string, unknown> = {
      memberId: validation.memberId,
      memberName: validation.memberName,
    };

    if (validation.type === 'points' && validation.points) {
      await PointsService.redeemPoints({
        memberId: validation.memberId,
        points: validation.points,
        description: `Points redeemed at ${locationName || posId}`,
        referenceType: 'qr_redemption',
        referenceId: qrCode.id,
      });
      details.pointsRedeemed = validation.points;
    }

    if (validation.type === 'voucher' && validation.voucher) {
      await VoucherService.redeemVoucher(validation.voucher.id, locationName);
      details.voucher = validation.voucher;
    }

    return {
      success: true,
      type: validation.type,
      details,
    };
  }

  static async expireOldQRCodes(): Promise<number> {
    const [affectedCount] = await QRCode.update(
      { status: 'expired' },
      {
        where: {
          status: 'active',
          expiresAt: { [Op.lt]: new Date() },
        },
      }
    );
    return affectedCount;
  }
}
