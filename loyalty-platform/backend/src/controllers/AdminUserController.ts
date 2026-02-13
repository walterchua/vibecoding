import { Request, Response, NextFunction } from 'express';
import { AdminUserService } from '../services/AdminUserService';

export class AdminUserController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const callerRole = req.adminRole!;
      const callerMerchantBrandId = req.adminMerchantBrandId;

      // Merchant admins can only create users for their own brand
      if (callerRole !== 'super_admin') {
        req.body.merchantBrandId = callerMerchantBrandId;
        // Merchant admins cannot create super_admins
        if (req.body.role === 'super_admin') {
          res.status(403).json({ error: 'Cannot create super admin users' });
          return;
        }
      }

      const admin = await AdminUserService.create(req.body);
      res.status(201).json({
        admin: {
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role,
          merchantBrandId: admin.merchantBrandId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const callerRole = req.adminRole!;
      const merchantBrandId = req.merchantBrandId;

      let admins;
      if (callerRole === 'super_admin' && !merchantBrandId) {
        admins = await AdminUserService.getAll();
      } else {
        admins = await AdminUserService.getByMerchantBrand(merchantBrandId!);
      }

      res.json({
        admins: admins.map((a) => ({
          id: a.id,
          email: a.email,
          firstName: a.firstName,
          lastName: a.lastName,
          role: a.role,
          merchantBrandId: a.merchantBrandId,
          isActive: a.isActive,
          lastLoginAt: a.lastLoginAt,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const admin = await AdminUserService.getById(id);
      if (!admin) {
        res.status(404).json({ error: 'Admin user not found' });
        return;
      }
      res.json({
        admin: {
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role,
          merchantBrandId: admin.merchantBrandId,
          isActive: admin.isActive,
          lastLoginAt: admin.lastLoginAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const callerRole = req.adminRole!;

      // Non-super admins cannot promote to super_admin
      if (callerRole !== 'super_admin' && req.body.role === 'super_admin') {
        res.status(403).json({ error: 'Cannot assign super admin role' });
        return;
      }

      const admin = await AdminUserService.update(id, req.body);
      res.json({
        admin: {
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role,
          merchantBrandId: admin.merchantBrandId,
          isActive: admin.isActive,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await AdminUserService.deactivate(id);
      res.json({ message: 'Admin user deactivated' });
    } catch (error) {
      next(error);
    }
  }
}
