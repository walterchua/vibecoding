import { Campaign, Member, Tier, MemberVoucher, Voucher, MerchantMember } from '../models';
import { PointsService } from '../services/PointsService';
import { SettingsService } from '../services/SettingsService';
import { Op } from 'sequelize';

interface TransactionData {
  memberId: string;
  merchantBrandId?: string;
  total: number;
  items: Array<{
    sku: string;
    name: string;
    category?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  locationId?: string;
  transactionDate: Date;
}

interface CampaignReward {
  campaignId: string;
  campaignName: string;
  type: 'points' | 'voucher';
  points?: number;
  voucherId?: string;
  voucherName?: string;
}

export class CampaignEngine {
  static async getActiveCampaigns(merchantBrandId?: string): Promise<Campaign[]> {
    const now = new Date();
    const where: Record<string, unknown> = {
      isActive: true,
      startDate: { [Op.lte]: now },
      endDate: { [Op.gte]: now },
    };
    if (merchantBrandId) where.merchantBrandId = merchantBrandId;

    return Campaign.findAll({ where, order: [['priority', 'DESC']] });
  }

  static async evaluateTransaction(
    transaction: TransactionData
  ): Promise<{ rewards: CampaignReward[]; totalPoints: number }> {
    const campaigns = await this.getActiveCampaigns(transaction.merchantBrandId);
    const member = await Member.findByPk(transaction.memberId, {
      include: [{ model: Tier, as: 'tier' }],
    });

    if (!member) throw new Error('Member not found');

    const rewards: CampaignReward[] = [];

    // Use merchant-specific tier and settings if available
    let tier: Tier | null = null;
    let tierId: string = member.tierId;

    if (transaction.merchantBrandId) {
      const mm = await MerchantMember.findOne({
        where: { memberId: transaction.memberId, merchantBrandId: transaction.merchantBrandId, isActive: true },
        include: [{ model: Tier, as: 'tier' }],
      });
      if (mm) {
        tier = mm.get('tier') as Tier;
        tierId = mm.tierId;
      }
    }

    if (!tier) {
      tier = await Tier.findByPk(tierId);
    }

    const pointsConfig = await SettingsService.getByCategory('points_config', transaction.merchantBrandId);
    const earningRate = Number(pointsConfig.baseEarningRate) || 1;
    const roundingRule = (pointsConfig.roundingRule as string) || 'floor';

    const rawPoints = transaction.total * earningRate;
    const basePoints = roundingRule === 'round' ? Math.round(rawPoints) : Math.floor(rawPoints);
    const tierMultiplier = tier?.pointsMultiplier || 1;
    let totalPoints = Math.floor(basePoints * tierMultiplier);

    for (const campaign of campaigns) {
      if (this.matchesCriteria(campaign, transaction, member, tierId)) {
        const reward = await this.calculateReward(campaign, transaction, member, basePoints);
        if (reward) {
          rewards.push(reward);
          if (reward.type === 'points' && reward.points) {
            totalPoints += reward.points;
          }
        }
      }
    }

    if (totalPoints > 0) {
      await PointsService.earnPoints({
        memberId: transaction.memberId,
        merchantBrandId: transaction.merchantBrandId,
        points: totalPoints,
        description: `Purchase reward (base: ${basePoints}, multiplier: ${tierMultiplier}x)`,
        referenceType: 'transaction',
      });
    }

    return { rewards, totalPoints };
  }

  private static matchesCriteria(
    campaign: Campaign,
    transaction: TransactionData,
    member: Member,
    tierId: string
  ): boolean {
    const criteria = campaign.criteria;

    if (criteria.days && criteria.days.length > 0) {
      const dayOfWeek = transaction.transactionDate
        .toLocaleDateString('en-US', { weekday: 'long' })
        .toLowerCase();
      if (!criteria.days.includes(dayOfWeek)) return false;
    }

    if (criteria.minAmount && transaction.total < criteria.minAmount) return false;
    if (criteria.maxAmount && transaction.total > criteria.maxAmount) return false;

    if (criteria.categories && criteria.categories.length > 0) {
      const transactionCategories = transaction.items
        .map((item) => item.category?.toLowerCase())
        .filter(Boolean);
      const hasMatchingCategory = criteria.categories.some((cat: string) =>
        transactionCategories.includes(cat.toLowerCase())
      );
      if (!hasMatchingCategory) return false;
    }

    if (criteria.products && criteria.products.length > 0) {
      const transactionSkus = transaction.items.map((item) => item.sku);
      const hasMatchingProduct = criteria.products.some((sku: string) =>
        transactionSkus.includes(sku)
      );
      if (!hasMatchingProduct) return false;
    }

    if (criteria.locations && criteria.locations.length > 0) {
      if (!transaction.locationId || !criteria.locations.includes(transaction.locationId)) return false;
    }

    if (criteria.tierIds && criteria.tierIds.length > 0) {
      if (!criteria.tierIds.includes(tierId)) return false;
    }

    if (criteria.isBirthday) {
      if (!member.dateOfBirth) return false;
      const today = new Date();
      const dob = new Date(member.dateOfBirth);
      if (today.getMonth() !== dob.getMonth() || today.getDate() !== dob.getDate()) return false;
    }

    return true;
  }

  private static async calculateReward(
    campaign: Campaign,
    transaction: TransactionData,
    member: Member,
    basePoints: number
  ): Promise<CampaignReward | null> {
    const reward = campaign.reward;

    switch (campaign.type) {
      case 'points_earn': {
        return {
          campaignId: campaign.id,
          campaignName: campaign.name,
          type: 'points',
          points: reward.value || 0,
        };
      }

      case 'points_multiplier': {
        const multiplier = reward.multiplier || 1;
        const bonusPoints = Math.floor(basePoints * (multiplier - 1));
        if (bonusPoints > 0) {
          return { campaignId: campaign.id, campaignName: campaign.name, type: 'points', points: bonusPoints };
        }
        return null;
      }

      case 'voucher_distribution': {
        if (reward.voucherId) {
          const voucher = await Voucher.findByPk(reward.voucherId);
          if (voucher && voucher.isActive) {
            await MemberVoucher.create({
              memberId: member.id,
              voucherId: reward.voucherId,
              merchantBrandId: campaign.merchantBrandId,
              expiresAt: voucher.validUntil,
            });
            return {
              campaignId: campaign.id,
              campaignName: campaign.name,
              type: 'voucher',
              voucherId: reward.voucherId,
              voucherName: voucher.name,
            };
          }
        }
        return null;
      }

      case 'tier_bonus': {
        return {
          campaignId: campaign.id,
          campaignName: campaign.name,
          type: 'points',
          points: reward.value || 0,
        };
      }

      default:
        return null;
    }
  }

  static async createCampaign(data: {
    merchantBrandId?: string;
    name: string;
    description?: string;
    type: 'points_earn' | 'points_multiplier' | 'voucher_distribution' | 'tier_bonus';
    criteria: Record<string, unknown>;
    reward: Record<string, unknown>;
    startDate: Date;
    endDate: Date;
    priority?: number;
    createdBy?: string;
  }): Promise<Campaign> {
    return Campaign.create(data as Campaign);
  }

  static async updateCampaign(campaignId: string, data: Partial<Campaign>): Promise<Campaign> {
    const campaign = await Campaign.findByPk(campaignId);
    if (!campaign) throw new Error('Campaign not found');
    await campaign.update(data);
    return campaign;
  }

  static async deleteCampaign(campaignId: string): Promise<void> {
    const campaign = await Campaign.findByPk(campaignId);
    if (!campaign) throw new Error('Campaign not found');
    await campaign.update({ isActive: false });
  }
}
