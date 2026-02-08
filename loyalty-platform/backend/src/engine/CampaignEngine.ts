import { Campaign, Member, Tier, MemberVoucher, Voucher } from '../models';
import { PointsService } from '../services/PointsService';
import { SettingsService } from '../services/SettingsService';
import { Op } from 'sequelize';

interface TransactionData {
  memberId: string;
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
  static async getActiveCampaigns(): Promise<Campaign[]> {
    const now = new Date();
    return Campaign.findAll({
      where: {
        isActive: true,
        startDate: { [Op.lte]: now },
        endDate: { [Op.gte]: now },
      },
      order: [['priority', 'DESC']],
    });
  }

  static async evaluateTransaction(
    transaction: TransactionData
  ): Promise<CampaignReward[]> {
    const campaigns = await this.getActiveCampaigns();
    const member = await Member.findByPk(transaction.memberId, {
      include: [{ model: Tier, as: 'tier' }],
    });

    if (!member) {
      throw new Error('Member not found');
    }

    const rewards: CampaignReward[] = [];
    const tier = await Tier.findByPk(member.tierId);

    // Load configurable points settings
    const pointsConfig = await SettingsService.getByCategory('points_config');
    const earningRate = Number(pointsConfig.baseEarningRate) || 1;
    const roundingRule = (pointsConfig.roundingRule as string) || 'floor';

    // Calculate base points using configurable earning rate
    const rawPoints = transaction.total * earningRate;
    const basePoints = roundingRule === 'round' ? Math.round(rawPoints) : Math.floor(rawPoints);
    const tierMultiplier = tier?.pointsMultiplier || 1;
    let totalPoints = Math.floor(basePoints * tierMultiplier);

    for (const campaign of campaigns) {
      if (this.matchesCriteria(campaign, transaction, member)) {
        const reward = await this.calculateReward(
          campaign,
          transaction,
          member,
          basePoints
        );

        if (reward) {
          rewards.push(reward);

          if (reward.type === 'points' && reward.points) {
            totalPoints += reward.points;
          }
        }
      }
    }

    // Award base + campaign points
    if (totalPoints > 0) {
      await PointsService.earnPoints({
        memberId: transaction.memberId,
        points: totalPoints,
        description: `Purchase reward (base: ${basePoints}, multiplier: ${tierMultiplier}x)`,
        referenceType: 'transaction',
      });
    }

    return rewards;
  }

  private static matchesCriteria(
    campaign: Campaign,
    transaction: TransactionData,
    member: Member
  ): boolean {
    const criteria = campaign.criteria;

    // Check day of week
    if (criteria.days && criteria.days.length > 0) {
      const dayOfWeek = transaction.transactionDate
        .toLocaleDateString('en-US', { weekday: 'long' })
        .toLowerCase();
      if (!criteria.days.includes(dayOfWeek)) {
        return false;
      }
    }

    // Check minimum amount
    if (criteria.minAmount && transaction.total < criteria.minAmount) {
      return false;
    }

    // Check maximum amount
    if (criteria.maxAmount && transaction.total > criteria.maxAmount) {
      return false;
    }

    // Check categories
    if (criteria.categories && criteria.categories.length > 0) {
      const transactionCategories = transaction.items
        .map((item) => item.category?.toLowerCase())
        .filter(Boolean);
      const hasMatchingCategory = criteria.categories.some((cat: string) =>
        transactionCategories.includes(cat.toLowerCase())
      );
      if (!hasMatchingCategory) {
        return false;
      }
    }

    // Check products
    if (criteria.products && criteria.products.length > 0) {
      const transactionSkus = transaction.items.map((item) => item.sku);
      const hasMatchingProduct = criteria.products.some((sku: string) =>
        transactionSkus.includes(sku)
      );
      if (!hasMatchingProduct) {
        return false;
      }
    }

    // Check locations
    if (criteria.locations && criteria.locations.length > 0) {
      if (
        !transaction.locationId ||
        !criteria.locations.includes(transaction.locationId)
      ) {
        return false;
      }
    }

    // Check tier eligibility
    if (criteria.tierIds && criteria.tierIds.length > 0) {
      if (!criteria.tierIds.includes(member.tierId)) {
        return false;
      }
    }

    // Check birthday
    if (criteria.isBirthday) {
      if (!member.dateOfBirth) {
        return false;
      }
      const today = new Date();
      const dob = new Date(member.dateOfBirth);
      if (
        today.getMonth() !== dob.getMonth() ||
        today.getDate() !== dob.getDate()
      ) {
        return false;
      }
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
        const points = reward.value || 0;
        return {
          campaignId: campaign.id,
          campaignName: campaign.name,
          type: 'points',
          points,
        };
      }

      case 'points_multiplier': {
        const multiplier = reward.multiplier || 1;
        const bonusPoints = Math.floor(basePoints * (multiplier - 1));
        if (bonusPoints > 0) {
          return {
            campaignId: campaign.id,
            campaignName: campaign.name,
            type: 'points',
            points: bonusPoints,
          };
        }
        return null;
      }

      case 'voucher_distribution': {
        if (reward.voucherId) {
          const voucher = await Voucher.findByPk(reward.voucherId);
          if (voucher && voucher.isActive) {
            // Award voucher to member
            await MemberVoucher.create({
              memberId: member.id,
              voucherId: reward.voucherId,
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
        const bonusPoints = reward.value || 0;
        return {
          campaignId: campaign.id,
          campaignName: campaign.name,
          type: 'points',
          points: bonusPoints,
        };
      }

      default:
        return null;
    }
  }

  // Admin functions
  static async createCampaign(data: {
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

  static async updateCampaign(
    campaignId: string,
    data: Partial<Campaign>
  ): Promise<Campaign> {
    const campaign = await Campaign.findByPk(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }
    await campaign.update(data);
    return campaign;
  }

  static async deleteCampaign(campaignId: string): Promise<void> {
    const campaign = await Campaign.findByPk(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }
    await campaign.update({ isActive: false });
  }
}
