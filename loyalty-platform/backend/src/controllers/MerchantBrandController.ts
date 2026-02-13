import { Request, Response, NextFunction } from 'express';
import { MerchantBrandService } from '../services/MerchantBrandService';

export class MerchantBrandController {
  // Super admin: CRUD for merchant brands
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const brand = await MerchantBrandService.create(req.body);
      res.status(201).json({ brand });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string;

      const result = await MerchantBrandService.getAll({ page, limit, search });
      res.json({
        brands: result.brands,
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const brand = await MerchantBrandService.getById(id);
      if (!brand) {
        res.status(404).json({ error: 'Merchant brand not found' });
        return;
      }
      const stats = await MerchantBrandService.getStats(id);
      res.json({ brand, stats });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const brand = await MerchantBrandService.update(id, req.body);
      res.json({ brand });
    } catch (error) {
      next(error);
    }
  }

  static async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await MerchantBrandService.deactivate(id);
      res.json({ message: 'Merchant brand deactivated' });
    } catch (error) {
      next(error);
    }
  }

  // Public: list for mobile app
  static async getPublicList(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const brands = await MerchantBrandService.getPublicList();
      res.json({ brands });
    } catch (error) {
      next(error);
    }
  }
}
