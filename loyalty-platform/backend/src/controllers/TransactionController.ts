import { Request, Response, NextFunction } from 'express';
import { TransactionService } from '../services/TransactionService';
import { Merchant } from '../models';

export class TransactionController {
  // POS endpoint - submit transaction
  static async submitTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        memberId,
        memberPhone,
        externalId,
        posId,
        locationId,
        locationName,
        merchantBrandId,
        outletId,
        items,
        subtotal,
        tax,
        discount,
        total,
        paymentMethod,
        transactionDate,
      } = req.body;

      if (!externalId || !posId || !items || !total) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      if (!memberId && !memberPhone) {
        res.status(400).json({ error: 'Member ID or phone required' });
        return;
      }

      // If merchantBrandId not in body, try to derive from POS
      let effectiveBrandId = merchantBrandId;
      let effectiveOutletId = outletId;
      if (!effectiveBrandId && posId) {
        const merchant = await Merchant.findOne({ where: { posId } });
        if (merchant) {
          effectiveBrandId = merchant.merchantBrandId;
          effectiveOutletId = effectiveOutletId || merchant.outletId;
        }
      }

      const result = await TransactionService.submitTransaction({
        memberId,
        memberPhone,
        externalId,
        posId,
        locationId,
        locationName,
        merchantBrandId: effectiveBrandId,
        outletId: effectiveOutletId,
        items,
        subtotal,
        tax,
        discount,
        total,
        paymentMethod,
        transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      });

      res.status(201).json({
        message: 'Transaction processed successfully',
        transaction: {
          id: result.transaction.id,
          externalId: result.transaction.externalId,
          status: result.transaction.status,
          total: result.transaction.total,
        },
        rewards: result.rewards,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTransactionStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const transaction = await TransactionService.getTransactionById(id);

      if (!transaction) {
        // Try by external ID
        const txByExternal = await TransactionService.getTransactionByExternalId(id);
        if (!txByExternal) {
          res.status(404).json({ error: 'Transaction not found' });
          return;
        }
        res.json({
          transaction: {
            id: txByExternal.id,
            externalId: txByExternal.externalId,
            status: txByExternal.status,
            total: txByExternal.total,
            pointsEarned: txByExternal.pointsEarned,
            processedAt: txByExternal.processedAt,
          },
        });
        return;
      }

      res.json({
        transaction: {
          id: transaction.id,
          externalId: transaction.externalId,
          status: transaction.status,
          total: transaction.total,
          pointsEarned: transaction.pointsEarned,
          processedAt: transaction.processedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Member endpoint - get own transactions
  static async getMemberTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = req.memberId!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const merchantBrandId = req.query.merchantBrandId as string | undefined;

      const result = await TransactionService.getMemberTransactions(memberId, {
        page,
        limit,
        startDate,
        endDate,
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
