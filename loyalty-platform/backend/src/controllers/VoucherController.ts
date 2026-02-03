import { Request, Response, NextFunction } from 'express';
import { VoucherService } from '../services/VoucherService';

export class VoucherController {
  static async getAvailableVouchers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vouchers = await VoucherService.getAvailableVouchers();
      res.json({ vouchers });
    } catch (error) {
      next(error);
    }
  }

  static async getVoucherById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const voucher = await VoucherService.getVoucherById(id);
      if (!voucher) {
        res.status(404).json({ error: 'Voucher not found' });
        return;
      }
      res.json({ voucher });
    } catch (error) {
      next(error);
    }
  }

  static async claimVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = req.memberId!;
      const { id } = req.params;
      const memberVoucher = await VoucherService.claimVoucher(memberId, id);
      res.status(201).json({
        message: 'Voucher claimed successfully',
        memberVoucher: {
          id: memberVoucher.id,
          voucherId: memberVoucher.voucherId,
          status: memberVoucher.status,
          expiresAt: memberVoucher.expiresAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMemberVouchers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = req.memberId!;
      const status = req.query.status as 'active' | 'used' | 'expired' | undefined;
      const vouchers = await VoucherService.getMemberVouchers(memberId, status);
      res.json({
        vouchers: vouchers.map((mv) => ({
          id: mv.id,
          voucherId: mv.voucherId,
          voucher: mv.get('voucher'),
          status: mv.status,
          expiresAt: mv.expiresAt,
          usedAt: mv.usedAt,
          usedAtLocation: mv.usedAtLocation,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMemberVoucherById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = req.memberId!;
      const { id } = req.params;
      const memberVoucher = await VoucherService.getMemberVoucherById(memberId, id);
      if (!memberVoucher) {
        res.status(404).json({ error: 'Voucher not found' });
        return;
      }
      res.json({
        memberVoucher: {
          id: memberVoucher.id,
          voucherId: memberVoucher.voucherId,
          voucher: memberVoucher.get('voucher'),
          status: memberVoucher.status,
          expiresAt: memberVoucher.expiresAt,
          usedAt: memberVoucher.usedAt,
          usedAtLocation: memberVoucher.usedAtLocation,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
