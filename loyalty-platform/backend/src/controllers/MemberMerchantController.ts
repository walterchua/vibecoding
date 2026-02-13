import { Request, Response, NextFunction } from 'express';
import { MerchantBrandService } from '../services/MerchantBrandService';
import { MerchantMemberService } from '../services/MerchantMemberService';
import { MemberService } from '../services/MemberService';
import { TransactionService } from '../services/TransactionService';
import { VoucherService } from '../services/VoucherService';

export class MemberMerchantController {
  // Browse available merchants
  static async browseMerchants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const brands = await MerchantBrandService.getPublicList();
      res.json({ merchants: brands });
    } catch (error) {
      next(error);
    }
  }

  // Get member's joined merchants
  static async getMyMerchants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = req.memberId!;
      const merchants = await MerchantMemberService.getMemberMerchants(memberId);
      res.json({ merchants });
    } catch (error) {
      next(error);
    }
  }

  // Join a merchant
  static async joinMerchant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = req.memberId!;
      const { merchantBrandId } = req.params;

      const membership = await MerchantMemberService.joinMerchant(memberId, merchantBrandId);
      res.status(201).json({
        message: 'Successfully joined merchant',
        membership: {
          id: membership.id,
          merchantBrandId: membership.merchantBrandId,
          tierId: membership.tierId,
          availablePoints: membership.availablePoints,
          joinedAt: membership.joinedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Get merchant-scoped profile
  static async getMerchantProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = req.memberId!;
      const { merchantBrandId } = req.params;

      const profile = await MemberService.getProfile(memberId, merchantBrandId);
      const brand = await MerchantBrandService.getById(merchantBrandId);

      res.json({
        merchant: brand ? { id: brand.id, name: brand.name, slug: brand.slug, logo: brand.logo } : null,
        profile,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get merchant-scoped points history
  static async getMerchantPoints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = req.memberId!;
      const { merchantBrandId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const type = req.query.type as string;

      const result = await MemberService.getPointsHistory(memberId, {
        page,
        limit,
        type,
        merchantBrandId,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Get merchant-scoped tier progress
  static async getMerchantTier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = req.memberId!;
      const { merchantBrandId } = req.params;

      const progress = await MemberService.getTierProgress(memberId, merchantBrandId);
      res.json({
        currentTier: {
          id: progress.currentTier.id,
          name: progress.currentTier.name,
          code: progress.currentTier.code,
          color: progress.currentTier.color,
          benefits: progress.currentTier.benefits,
        },
        nextTier: progress.nextTier
          ? {
              id: progress.nextTier.id,
              name: progress.nextTier.name,
              code: progress.nextTier.code,
              color: progress.nextTier.color,
              minPoints: progress.nextTier.minPoints,
            }
          : null,
        progress: progress.progress,
        pointsToNextTier: progress.pointsToNextTier,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get merchant-scoped vouchers
  static async getMerchantVouchers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = req.memberId!;
      const { merchantBrandId } = req.params;
      const status = req.query.status as 'active' | 'used' | 'expired' | undefined;

      const vouchers = await VoucherService.getMemberVouchers(memberId, status, merchantBrandId);
      res.json({
        vouchers: vouchers.map((mv) => ({
          id: mv.id,
          voucherId: mv.voucherId,
          voucher: mv.get('voucher'),
          status: mv.status,
          expiresAt: mv.expiresAt,
          usedAt: mv.usedAt,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  // Get merchant-scoped transactions
  static async getMerchantTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = req.memberId!;
      const { merchantBrandId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await TransactionService.getMemberTransactions(memberId, {
        page,
        limit,
        merchantBrandId,
      });

      res.json({
        transactions: result.transactions.map((t) => ({
          id: t.id,
          externalId: t.externalId,
          locationName: t.locationName,
          total: t.total,
          pointsEarned: t.pointsEarned,
          transactionDate: t.transactionDate,
        })),
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
}
