import { Request, Response, NextFunction } from 'express';
import { CampaignEngine } from '../engine/CampaignEngine';
import { VoucherService } from '../services/VoucherService';
import { TransactionService } from '../services/TransactionService';
import { SettingsService } from '../services/SettingsService';
import { Member, Tier, Campaign, Voucher, Transaction, PointsTransaction } from '../models';
import { Op } from 'sequelize';
import sequelize from '../config/database';

export class AdminController {
  // Dashboard
  static async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        totalMembers,
        newMembersToday,
        activeVouchers,
        activeCampaigns,
        totalPointsIssued,
        todayTransactions,
      ] = await Promise.all([
        Member.count({ where: { isActive: true } }),
        Member.count({ where: { createdAt: { [Op.gte]: today } } }),
        Voucher.count({ where: { isActive: true } }),
        Campaign.count({ where: { isActive: true, endDate: { [Op.gte]: new Date() } } }),
        PointsTransaction.sum('points', { where: { type: 'earn' } }),
        Transaction.count({ where: { transactionDate: { [Op.gte]: today } } }),
      ]);

      res.json({
        totalMembers,
        newMembersToday,
        activeVouchers,
        activeCampaigns,
        totalPointsIssued: totalPointsIssued || 0,
        todayTransactions,
      });
    } catch (error) {
      next(error);
    }
  }

  // Campaigns
  static async getCampaigns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const campaigns = await CampaignEngine.getActiveCampaigns();
      res.json({ campaigns });
    } catch (error) {
      next(error);
    }
  }

  static async getAllCampaigns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const campaigns = await Campaign.findAll({ order: [['createdAt', 'DESC']] });
      res.json({ campaigns });
    } catch (error) {
      next(error);
    }
  }

  static async createCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const campaign = await CampaignEngine.createCampaign(req.body);
      res.status(201).json({ campaign });
    } catch (error) {
      next(error);
    }
  }

  static async updateCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const campaign = await CampaignEngine.updateCampaign(id, req.body);
      res.json({ campaign });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await CampaignEngine.deleteCampaign(id);
      res.json({ message: 'Campaign deleted' });
    } catch (error) {
      next(error);
    }
  }

  // Members
  static async getMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string;
      const tierId = req.query.tierId as string;

      const where: Record<string, unknown> = {};

      if (search) {
        where[Op.or] = [
          { phone: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (tierId) {
        where.tierId = tierId;
      }

      const { rows: members, count: total } = await Member.findAndCountAll({
        where,
        include: [{ model: Tier, as: 'tier' }],
        order: [['createdAt', 'DESC']],
        limit,
        offset: (page - 1) * limit,
      });

      res.json({
        members,
        pagination: {
          total,
          page,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMemberById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const member = await Member.findByPk(id, {
        include: [{ model: Tier, as: 'tier' }],
      });

      if (!member) {
        res.status(404).json({ error: 'Member not found' });
        return;
      }

      res.json({ member });
    } catch (error) {
      next(error);
    }
  }

  // Vouchers
  static async getVouchers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vouchers = await Voucher.findAll({ order: [['createdAt', 'DESC']] });
      res.json({ vouchers });
    } catch (error) {
      next(error);
    }
  }

  static async createVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const voucher = await VoucherService.createVoucher(req.body);
      res.status(201).json({ voucher });
    } catch (error) {
      next(error);
    }
  }

  static async updateVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const voucher = await VoucherService.updateVoucher(id, req.body);
      res.json({ voucher });
    } catch (error) {
      next(error);
    }
  }

  static async deleteVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await VoucherService.deleteVoucher(id);
      res.json({ message: 'Voucher deleted' });
    } catch (error) {
      next(error);
    }
  }

  // Tiers
  static async getTiers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tiers = await Tier.findAll({ order: [['sortOrder', 'ASC']] });
      res.json({ tiers });
    } catch (error) {
      next(error);
    }
  }

  static async createTier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tier = await Tier.create(req.body);
      res.status(201).json({ tier });
    } catch (error) {
      next(error);
    }
  }

  static async updateTier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const tier = await Tier.findByPk(id);
      if (!tier) {
        res.status(404).json({ error: 'Tier not found' });
        return;
      }
      await tier.update(req.body);
      res.json({ tier });
    } catch (error) {
      next(error);
    }
  }

  // Transactions
  static async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const status = req.query.status as string;
      const posId = req.query.posId as string;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const result = await TransactionService.getAllTransactions({
        page,
        limit,
        status,
        posId,
        startDate,
        endDate,
      });

      res.json({
        transactions: result.transactions,
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

  // Reports
  static async getRevenueReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const transactions = await Transaction.findAll({
        where: {
          transactionDate: { [Op.between]: [startDate, endDate] },
          status: 'processed',
        },
        attributes: [
          [sequelize.fn('DATE', sequelize.col('transactionDate')), 'date'],
          [sequelize.fn('SUM', sequelize.col('total')), 'totalRevenue'],
          [sequelize.fn('SUM', sequelize.col('pointsEarned')), 'totalPoints'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'transactionCount'],
        ],
        group: [sequelize.fn('DATE', sequelize.col('transactionDate'))],
        order: [[sequelize.fn('DATE', sequelize.col('transactionDate')), 'ASC']],
        raw: true,
      });

      res.json({ report: transactions });
    } catch (error) {
      next(error);
    }
  }

  static async getMemberReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tierDistribution = await Member.findAll({
        attributes: [
          'tierId',
          [sequelize.fn('COUNT', sequelize.col('Member.id')), 'count'],
        ],
        include: [{ model: Tier, as: 'tier', attributes: ['name', 'code'] }],
        group: ['tierId', 'tier.id'],
        raw: true,
      });

      const registrationTrend = await Member.findAll({
        where: {
          createdAt: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        attributes: [
          [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']],
        raw: true,
      });

      res.json({
        tierDistribution,
        registrationTrend,
      });
    } catch (error) {
      next(error);
    }
  }

  // Settings
  static async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category } = req.params;
      const settings = await SettingsService.getByCategory(category);
      res.json({ settings });
    } catch (error) {
      next(error);
    }
  }

  static async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category } = req.params;
      const settings = await SettingsService.updateCategory(category, req.body);
      res.json({ settings });
    } catch (error) {
      next(error);
    }
  }
}
