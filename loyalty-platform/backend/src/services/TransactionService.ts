import { Transaction, Member } from '../models';
import { CampaignEngine } from '../engine/CampaignEngine';
import { Op } from 'sequelize';

interface TransactionItem {
  sku: string;
  name: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface SubmitTransactionParams {
  memberId?: string;
  memberPhone?: string;
  externalId: string;
  posId: string;
  locationId?: string;
  locationName?: string;
  items: TransactionItem[];
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  paymentMethod?: string;
  transactionDate: Date;
}

interface TransactionResult {
  transaction: Transaction;
  rewards: {
    pointsEarned: number;
    vouchersAwarded: string[];
  };
}

export class TransactionService {
  static async submitTransaction(
    params: SubmitTransactionParams
  ): Promise<TransactionResult> {
    // Find member by ID or phone
    let member: Member | null = null;

    if (params.memberId) {
      member = await Member.findByPk(params.memberId);
    } else if (params.memberPhone) {
      member = await Member.findOne({ where: { phone: params.memberPhone } });
    }

    if (!member) {
      throw new Error('Member not found');
    }

    // Check for duplicate transaction
    const existingTransaction = await Transaction.findOne({
      where: { externalId: params.externalId },
    });

    if (existingTransaction) {
      throw new Error('Transaction already processed');
    }

    // Create transaction record
    const transaction = await Transaction.create({
      memberId: member.id,
      externalId: params.externalId,
      posId: params.posId,
      locationId: params.locationId,
      locationName: params.locationName,
      items: params.items,
      subtotal: params.subtotal,
      tax: params.tax || 0,
      discount: params.discount || 0,
      total: params.total,
      paymentMethod: params.paymentMethod,
      transactionDate: params.transactionDate,
      status: 'pending',
    });

    try {
      // Process rewards using campaign engine
      const { rewards, totalPoints } = await CampaignEngine.evaluateTransaction({
        memberId: member.id,
        total: params.total,
        items: params.items,
        locationId: params.locationId,
        transactionDate: params.transactionDate,
      });

      // Use totalPoints from engine (includes base + tier multiplier + campaign bonuses)
      const pointsEarned = totalPoints;

      // Get vouchers awarded
      const vouchersAwarded = rewards
        .filter((r) => r.type === 'voucher')
        .map((r) => r.voucherName || '')
        .filter(Boolean);

      // Update transaction with rewards
      await transaction.update({
        status: 'processed',
        pointsEarned,
        processedAt: new Date(),
      });

      return {
        transaction,
        rewards: {
          pointsEarned,
          vouchersAwarded,
        },
      };
    } catch (error) {
      await transaction.update({ status: 'failed' });
      throw error;
    }
  }

  static async getTransactionById(transactionId: string): Promise<Transaction | null> {
    return Transaction.findByPk(transactionId, {
      include: [{ model: Member, as: 'member' }],
    });
  }

  static async getTransactionByExternalId(externalId: string): Promise<Transaction | null> {
    return Transaction.findOne({
      where: { externalId },
      include: [{ model: Member, as: 'member' }],
    });
  }

  static async getMemberTransactions(
    memberId: string,
    options: { page?: number; limit?: number; startDate?: Date; endDate?: Date } = {}
  ): Promise<{
    transactions: Transaction[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = { memberId };

    if (options.startDate || options.endDate) {
      where.transactionDate = {};
      if (options.startDate) {
        (where.transactionDate as Record<string, unknown>)[Op.gte] = options.startDate;
      }
      if (options.endDate) {
        (where.transactionDate as Record<string, unknown>)[Op.lte] = options.endDate;
      }
    }

    const { rows: transactions, count: total } = await Transaction.findAndCountAll({
      where,
      order: [['transactionDate', 'DESC']],
      limit,
      offset,
    });

    return {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Admin functions
  static async getAllTransactions(
    options: {
      page?: number;
      limit?: number;
      status?: string;
      posId?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{
    transactions: Transaction[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (options.status) {
      where.status = options.status;
    }

    if (options.posId) {
      where.posId = options.posId;
    }

    if (options.startDate || options.endDate) {
      where.transactionDate = {};
      if (options.startDate) {
        (where.transactionDate as Record<string, unknown>)[Op.gte] = options.startDate;
      }
      if (options.endDate) {
        (where.transactionDate as Record<string, unknown>)[Op.lte] = options.endDate;
      }
    }

    const { rows: transactions, count: total } = await Transaction.findAndCountAll({
      where,
      include: [{ model: Member, as: 'member', attributes: ['id', 'phone', 'firstName', 'lastName'] }],
      order: [['transactionDate', 'DESC']],
      limit,
      offset,
    });

    return {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
