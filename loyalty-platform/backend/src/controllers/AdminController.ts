import { Request, Response, NextFunction } from 'express';
import { CampaignEngine } from '../engine/CampaignEngine';
import { VoucherService } from '../services/VoucherService';
import { TransactionService } from '../services/TransactionService';
import { SettingsService } from '../services/SettingsService';
import { MerchantService } from '../services/MerchantService';
import { Member, Tier, Campaign, Voucher, Transaction, PointsTransaction, MerchantMember } from '../models';
import { Op } from 'sequelize';
import sequelize from '../config/database';

export class AdminController {
  // Dashboard
  static async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantBrandId = req.merchantBrandId;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const memberWhere: Record<string, unknown> = { isActive: true };
      const memberNewWhere: Record<string, unknown> = { createdAt: { [Op.gte]: today } };
      const voucherWhere: Record<string, unknown> = { isActive: true };
      const campaignWhere: Record<string, unknown> = { isActive: true, endDate: { [Op.gte]: new Date() } };
      const ptWhere: Record<string, unknown> = { type: 'earn' };
      const txWhere: Record<string, unknown> = { transactionDate: { [Op.gte]: today } };

      if (merchantBrandId) {
        voucherWhere.merchantBrandId = merchantBrandId;
        campaignWhere.merchantBrandId = merchantBrandId;
        ptWhere.merchantBrandId = merchantBrandId;
        txWhere.merchantBrandId = merchantBrandId;
      }

      const [
        totalMembers,
        newMembersToday,
        activeVouchers,
        activeCampaigns,
        totalPointsIssued,
        todayTransactions,
      ] = await Promise.all([
        merchantBrandId
          ? MerchantMember.count({ where: { merchantBrandId, isActive: true } })
          : Member.count({ where: memberWhere }),
        merchantBrandId
          ? MerchantMember.count({ where: { merchantBrandId, joinedAt: { [Op.gte]: today } } })
          : Member.count({ where: memberNewWhere }),
        Voucher.count({ where: voucherWhere }),
        Campaign.count({ where: campaignWhere }),
        PointsTransaction.sum('points', { where: ptWhere }),
        Transaction.count({ where: txWhere }),
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
      const merchantBrandId = req.merchantBrandId;
      const campaigns = await CampaignEngine.getActiveCampaigns(merchantBrandId);
      res.json({ campaigns });
    } catch (error) {
      next(error);
    }
  }

  static async getAllCampaigns(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantBrandId = req.merchantBrandId;
      const where: Record<string, unknown> = {};
      if (merchantBrandId) where.merchantBrandId = merchantBrandId;

      const campaigns = await Campaign.findAll({ where, order: [['createdAt', 'DESC']] });
      res.json({ campaigns });
    } catch (error) {
      next(error);
    }
  }

  static async createCampaign(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantBrandId = req.merchantBrandId;
      const campaign = await CampaignEngine.createCampaign({
        ...req.body,
        merchantBrandId,
      });
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
      const merchantBrandId = req.merchantBrandId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string;
      const tierId = req.query.tierId as string;

      if (merchantBrandId) {
        // Return merchant-scoped members via MerchantMember
        const mmWhere: Record<string, unknown> = { merchantBrandId, isActive: true };
        if (tierId) mmWhere.tierId = tierId;

        const memberInclude: Record<string, unknown>[] = [
          { model: Member, as: 'member' },
          { model: Tier, as: 'tier' },
        ];

        const { rows, count: total } = await MerchantMember.findAndCountAll({
          where: mmWhere,
          include: memberInclude,
          order: [['joinedAt', 'DESC']],
          limit,
          offset: (page - 1) * limit,
        });

        // Filter by search on the member level if needed
        let members = rows;
        let filteredTotal = total;
        if (search) {
          // For search, we need a different approach — use a subquery
          const searchLower = `%${search.toLowerCase()}%`;
          const memberIds = await Member.findAll({
            where: {
              [Op.or]: [
                { phone: { [Op.iLike]: searchLower } },
                { email: { [Op.iLike]: searchLower } },
                { firstName: { [Op.iLike]: searchLower } },
                { lastName: { [Op.iLike]: searchLower } },
              ],
            },
            attributes: ['id'],
          });
          const ids = memberIds.map((m) => m.id);
          mmWhere.memberId = { [Op.in]: ids };

          const searchResult = await MerchantMember.findAndCountAll({
            where: mmWhere,
            include: memberInclude,
            order: [['joinedAt', 'DESC']],
            limit,
            offset: (page - 1) * limit,
          });
          members = searchResult.rows;
          filteredTotal = searchResult.count;
        }

        res.json({
          members: members.map((mm) => {
            const member = mm.get('member') as Member;
            return {
              id: member.id,
              phone: member.phone,
              email: member.email,
              firstName: member.firstName,
              lastName: member.lastName,
              tier: mm.get('tier'),
              availablePoints: mm.availablePoints,
              totalPoints: mm.totalPoints,
              lifetimePoints: mm.lifetimePoints,
              joinedAt: mm.joinedAt,
            };
          }),
          pagination: {
            total: filteredTotal,
            page,
            totalPages: Math.ceil(filteredTotal / limit),
          },
        });
      } else {
        // Global member list (super admin without merchant context)
        const where: Record<string, unknown> = {};
        if (search) {
          where[Op.or] = [
            { phone: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } },
            { firstName: { [Op.iLike]: `%${search}%` } },
            { lastName: { [Op.iLike]: `%${search}%` } },
          ];
        }
        if (tierId) where.tierId = tierId;

        const { rows: members, count: total } = await Member.findAndCountAll({
          where,
          include: [{ model: Tier, as: 'tier' }],
          order: [['createdAt', 'DESC']],
          limit,
          offset: (page - 1) * limit,
        });

        res.json({
          members,
          pagination: { total, page, totalPages: Math.ceil(total / limit) },
        });
      }
    } catch (error) {
      next(error);
    }
  }

  static async getMemberById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const merchantBrandId = req.merchantBrandId;

      const member = await Member.findByPk(id, {
        include: [{ model: Tier, as: 'tier' }],
      });

      if (!member) {
        res.status(404).json({ error: 'Member not found' });
        return;
      }

      let merchantData = null;
      if (merchantBrandId) {
        const mm = await MerchantMember.findOne({
          where: { memberId: id, merchantBrandId, isActive: true },
          include: [{ model: Tier, as: 'tier' }],
        });
        if (mm) {
          merchantData = {
            tier: mm.get('tier'),
            availablePoints: mm.availablePoints,
            totalPoints: mm.totalPoints,
            lifetimePoints: mm.lifetimePoints,
            joinedAt: mm.joinedAt,
          };
        }
      }

      res.json({ member, merchantData });
    } catch (error) {
      next(error);
    }
  }

  // Vouchers
  static async getVouchers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantBrandId = req.merchantBrandId;
      const where: Record<string, unknown> = {};
      if (merchantBrandId) where.merchantBrandId = merchantBrandId;

      const vouchers = await Voucher.findAll({ where, order: [['createdAt', 'DESC']] });
      res.json({ vouchers });
    } catch (error) {
      next(error);
    }
  }

  static async createVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantBrandId = req.merchantBrandId;
      const voucher = await VoucherService.createVoucher({
        ...req.body,
        merchantBrandId,
      });
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
      const merchantBrandId = req.merchantBrandId;
      const where: Record<string, unknown> = {};
      if (merchantBrandId) {
        where.merchantBrandId = merchantBrandId;
      } else {
        where.merchantBrandId = null;
      }

      const tiers = await Tier.findAll({ where, order: [['sortOrder', 'ASC']] });
      res.json({ tiers });
    } catch (error) {
      next(error);
    }
  }

  static async createTier(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantBrandId = req.merchantBrandId;
      const tier = await Tier.create({ ...req.body, merchantBrandId });
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
      const merchantBrandId = req.merchantBrandId;
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
        merchantBrandId,
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

  // Merchants (staff management)
  static async getMerchants(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantBrandId = req.merchantBrandId;
      const merchants = await MerchantService.getAllMerchants(merchantBrandId);
      res.json({ merchants });
    } catch (error) {
      next(error);
    }
  }

  static async createMerchant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantBrandId = req.merchantBrandId;
      const merchant = await MerchantService.createMerchant({
        ...req.body,
        merchantBrandId,
      });
      res.status(201).json({ merchant });
    } catch (error) {
      next(error);
    }
  }

  static async updateMerchant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const merchant = await MerchantService.updateMerchant(id, req.body);
      res.json({ merchant });
    } catch (error) {
      next(error);
    }
  }

  static async deleteMerchant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await MerchantService.deleteMerchant(id);
      res.json({ message: 'Merchant deactivated' });
    } catch (error) {
      next(error);
    }
  }

  // Reports
  static async getRevenueReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantBrandId = req.merchantBrandId;
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const where: Record<string, unknown> = {
        transactionDate: { [Op.between]: [startDate, endDate] },
        status: 'processed',
      };
      if (merchantBrandId) where.merchantBrandId = merchantBrandId;

      const transactions = await Transaction.findAll({
        where,
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
      const merchantBrandId = req.merchantBrandId;

      if (merchantBrandId) {
        const tierDistribution = await MerchantMember.findAll({
          where: { merchantBrandId, isActive: true },
          attributes: [
            'tierId',
            [sequelize.fn('COUNT', sequelize.col('MerchantMember.id')), 'count'],
          ],
          include: [{ model: Tier, as: 'tier', attributes: ['name', 'code'] }],
          group: ['tierId', 'tier.id'],
          raw: true,
        });

        const registrationTrend = await MerchantMember.findAll({
          where: {
            merchantBrandId,
            joinedAt: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
          attributes: [
            [sequelize.fn('DATE', sequelize.col('joinedAt')), 'date'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          ],
          group: [sequelize.fn('DATE', sequelize.col('joinedAt'))],
          order: [[sequelize.fn('DATE', sequelize.col('joinedAt')), 'ASC']],
          raw: true,
        });

        res.json({ tierDistribution, registrationTrend });
      } else {
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

        res.json({ tierDistribution, registrationTrend });
      }
    } catch (error) {
      next(error);
    }
  }

  // Settings
  static async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantBrandId = req.merchantBrandId;
      const { category } = req.params;
      const settings = await SettingsService.getByCategory(category, merchantBrandId);
      res.json({ settings });
    } catch (error) {
      next(error);
    }
  }

  static async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantBrandId = req.merchantBrandId;
      const { category } = req.params;
      const settings = await SettingsService.updateCategory(category, req.body, merchantBrandId);
      res.json({ settings });
    } catch (error) {
      next(error);
    }
  }
}
