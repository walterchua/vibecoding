import { Request, Response, NextFunction } from 'express';
import { MerchantService } from '../services/MerchantService';
import { QRService } from '../services/QRService';
import { TransactionService } from '../services/TransactionService';

export class MerchantController {
  // Auth
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await MerchantService.login(email, password);

      res.json({
        merchant: {
          id: result.merchant.id,
          name: result.merchant.name,
          email: result.merchant.email,
          locationId: result.merchant.locationId,
          locationName: result.merchant.locationName,
          posId: result.merchant.posId,
          role: result.merchant.role,
          merchantBrandId: result.merchant.merchantBrandId,
        },
        brand: result.brand
          ? { id: result.brand.id, name: result.brand.name, slug: result.brand.slug, logo: result.brand.logo }
          : null,
        outlet: result.outlet
          ? { id: result.outlet.id, name: result.outlet.name, address: result.outlet.address }
          : null,
        tokens: result.tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantId = req.merchantId!;
      const merchant = await MerchantService.getProfile(merchantId);

      const brand = merchant.get('merchantBrand') as Record<string, unknown> | undefined;
      const outlet = merchant.get('outlet') as Record<string, unknown> | undefined;

      res.json({
        merchant: {
          id: merchant.id,
          name: merchant.name,
          email: merchant.email,
          locationId: merchant.locationId,
          locationName: merchant.locationName,
          posId: merchant.posId,
          role: merchant.role,
          merchantBrandId: merchant.merchantBrandId,
        },
        brand: brand || null,
        outlet: outlet || null,
      });
    } catch (error) {
      next(error);
    }
  }

  // Dashboard
  static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantId = req.merchantId!;
      const stats = await MerchantService.getTodayStats(merchantId);

      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  // Transactions
  static async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantId = req.merchantId!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const result = await MerchantService.getTransactions(merchantId, {
        page,
        limit,
        startDate,
        endDate,
      });

      res.json({
        transactions: result.transactions.map((t) => ({
          id: t.id,
          externalId: t.externalId,
          total: t.total,
          pointsEarned: t.pointsEarned,
          status: t.status,
          transactionDate: t.transactionDate,
          member: t.get('member'),
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

  // Scan QR - Validate member/voucher/points
  static async scanQR(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({ error: 'QR token required' });
        return;
      }

      const result = await QRService.validateQR(token);

      res.json({
        valid: result.valid,
        type: result.type,
        memberId: result.memberId,
        merchantBrandId: result.merchantBrandId,
        memberName: result.memberName,
        points: result.points,
        voucher: result.voucher,
        qrCodeId: result.qrCodeId,
      });
    } catch (error) {
      next(error);
    }
  }

  // Create transaction for member
  static async createTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantId = req.merchantId!;
      const posId = req.posId!;
      const locationId = req.locationId!;
      const merchantBrandId = req.merchantBrandId;
      const outletId = req.outletId;
      const merchant = await MerchantService.getProfile(merchantId);

      const { memberId, memberPhone, amount, items, paymentMethod } = req.body;

      if (!amount || amount <= 0) {
        res.status(400).json({ error: 'Valid amount required' });
        return;
      }

      if (!memberId && !memberPhone) {
        res.status(400).json({ error: 'Member ID or phone required' });
        return;
      }

      const externalId = `TXN-${posId}-${Date.now()}`;

      const result = await TransactionService.submitTransaction({
        memberId,
        memberPhone,
        externalId,
        posId,
        locationId,
        locationName: merchant.locationName,
        merchantBrandId,
        outletId,
        items: items || [
          {
            sku: 'GENERAL',
            name: 'Purchase',
            quantity: 1,
            unitPrice: amount,
            totalPrice: amount,
          },
        ],
        subtotal: amount,
        total: amount,
        paymentMethod,
        transactionDate: new Date(),
      });

      res.status(201).json({
        success: true,
        transaction: {
          id: result.transaction.id,
          externalId: result.transaction.externalId,
          total: result.transaction.total,
          status: result.transaction.status,
        },
        rewards: result.rewards,
      });
    } catch (error) {
      next(error);
    }
  }

  // Consume QR (redeem points or voucher)
  static async consumeQR(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const posId = req.posId!;
      const merchant = await MerchantService.getProfile(req.merchantId!);
      const { token } = req.body;

      if (!token) {
        res.status(400).json({ error: 'QR token required' });
        return;
      }

      const result = await QRService.consumeQR(token, posId, merchant.locationName);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  // Lookup member by phone
  static async lookupMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone } = req.query;
      const merchantBrandId = req.merchantBrandId;

      if (!phone) {
        res.status(400).json({ error: 'Phone number required' });
        return;
      }

      const member = await MerchantService.lookupMember(phone as string, merchantBrandId);
      res.json({ member });
    } catch (error) {
      next(error);
    }
  }
}
