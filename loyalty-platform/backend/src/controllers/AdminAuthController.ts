import { Request, Response, NextFunction } from 'express';
import { AdminAuthService } from '../services/AdminAuthService';
import { AdminUser } from '../models';

export class AdminAuthController {
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await AdminAuthService.login(email, password);

      res.json({
        admin: {
          id: result.admin.id,
          email: result.admin.email,
          firstName: result.admin.firstName,
          lastName: result.admin.lastName,
          role: result.admin.role,
          merchantBrandId: result.admin.merchantBrandId,
        },
        token: result.token,
        expiresIn: result.expiresIn,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminUserId!;
      const admin = await AdminUser.findByPk(adminId, {
        attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'merchantBrandId', 'lastLoginAt'],
      });

      if (!admin) {
        res.status(404).json({ error: 'Admin not found' });
        return;
      }

      res.json({ admin });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.adminUserId!;
      const { currentPassword, newPassword } = req.body;

      await AdminAuthService.changePassword(adminId, currentPassword, newPassword);
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }
}
