import { Request, Response, NextFunction } from 'express';
import { OutletService } from '../services/OutletService';

export class OutletController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantBrandId = req.merchantBrandId!;
      const outlet = await OutletService.create({ ...req.body, merchantBrandId });
      res.status(201).json({ outlet });
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantBrandId = req.merchantBrandId!;
      const outlets = await OutletService.getByMerchantBrand(merchantBrandId);
      res.json({ outlets });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const outlet = await OutletService.getById(id);
      if (!outlet) {
        res.status(404).json({ error: 'Outlet not found' });
        return;
      }
      res.json({ outlet });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const outlet = await OutletService.update(id, req.body);
      res.json({ outlet });
    } catch (error) {
      next(error);
    }
  }

  static async deactivate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await OutletService.deactivate(id);
      res.json({ message: 'Outlet deactivated' });
    } catch (error) {
      next(error);
    }
  }
}
