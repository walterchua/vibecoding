import jwt from 'jsonwebtoken';
import { AdminUser } from '../models';

interface AdminTokenResult {
  accessToken: string;
  expiresIn: number;
}

export class AdminAuthService {
  private static readonly JWT_SECRET = process.env.JWT_ADMIN_SECRET || 'admin-jwt-secret';
  private static readonly TOKEN_EXPIRY = '8h';

  static async login(email: string, password: string): Promise<{
    adminUser: AdminUser;
    tokens: AdminTokenResult;
  }> {
    const adminUser = await AdminUser.findOne({ where: { email } });

    if (!adminUser || !adminUser.isActive) {
      throw new Error('Invalid credentials');
    }

    const isValid = await adminUser.comparePassword(password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    await adminUser.update({ lastLoginAt: new Date() });

    const tokens = this.generateTokens(adminUser);

    return { adminUser, tokens };
  }

  static generateTokens(adminUser: AdminUser): AdminTokenResult {
    const accessToken = jwt.sign(
      {
        adminUserId: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        merchantBrandId: adminUser.merchantBrandId || null,
        type: 'admin',
      },
      this.JWT_SECRET,
      { expiresIn: this.TOKEN_EXPIRY }
    );

    return {
      accessToken,
      expiresIn: 28800, // 8 hours
    };
  }

  static async changePassword(adminUserId: string, currentPassword: string, newPassword: string): Promise<void> {
    const adminUser = await AdminUser.findByPk(adminUserId);
    if (!adminUser) {
      throw new Error('Admin user not found');
    }

    const isValid = await adminUser.comparePassword(currentPassword);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    await adminUser.update({ password: newPassword });
  }
}
