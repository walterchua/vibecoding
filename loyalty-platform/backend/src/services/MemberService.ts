import { Member, Tier, PointsTransaction, MemberVoucher, Voucher, MerchantMember } from '../models';
import { Op } from 'sequelize';

interface MemberProfile {
  id: string;
  phone: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: string;
  tier: {
    id: string;
    name: string;
    code: string;
    color: string;
  };
  points: {
    available: number;
    total: number;
    lifetime: number;
  };
  nextTier?: {
    name: string;
    pointsRequired: number;
    pointsToGo: number;
  };
}

export class MemberService {
  static async getProfile(memberId: string, merchantBrandId?: string): Promise<MemberProfile> {
    const member = await Member.findByPk(memberId, {
      include: [{ model: Tier, as: 'tier' }],
    });

    if (!member) {
      throw new Error('Member not found');
    }

    let tierId = member.tierId;
    let availablePoints = member.availablePoints;
    let totalPoints = member.totalPoints;
    let lifetimePoints = member.lifetimePoints;

    // Use merchant-specific data if merchantBrandId provided
    if (merchantBrandId) {
      const mm = await MerchantMember.findOne({
        where: { memberId, merchantBrandId, isActive: true },
        include: [{ model: Tier, as: 'tier' }],
      });
      if (mm) {
        tierId = mm.tierId;
        availablePoints = mm.availablePoints;
        totalPoints = mm.totalPoints;
        lifetimePoints = mm.lifetimePoints;
      }
    }

    const tier = await Tier.findByPk(tierId);

    // Find next tier — scoped to merchant if applicable
    const nextTierWhere: Record<string, unknown> = {
      minPoints: { [Op.gt]: tier?.maxPoints || 0 },
      isActive: true,
    };
    if (merchantBrandId) {
      nextTierWhere.merchantBrandId = merchantBrandId;
    } else {
      nextTierWhere.merchantBrandId = null;
    }
    const nextTier = await Tier.findOne({
      where: nextTierWhere,
      order: [['minPoints', 'ASC']],
    });

    const profile: MemberProfile = {
      id: member.id,
      phone: member.phone,
      email: member.email,
      firstName: member.firstName,
      lastName: member.lastName,
      dateOfBirth: member.dateOfBirth,
      gender: member.gender,
      tier: {
        id: tier!.id,
        name: tier!.name,
        code: tier!.code,
        color: tier!.color,
      },
      points: {
        available: availablePoints,
        total: totalPoints,
        lifetime: lifetimePoints,
      },
    };

    if (nextTier) {
      profile.nextTier = {
        name: nextTier.name,
        pointsRequired: nextTier.minPoints,
        pointsToGo: nextTier.minPoints - lifetimePoints,
      };
    }

    return profile;
  }

  static async updateProfile(
    memberId: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      dateOfBirth?: Date;
      gender?: 'male' | 'female' | 'other';
    }
  ): Promise<Member> {
    const member = await Member.findByPk(memberId);

    if (!member) {
      throw new Error('Member not found');
    }

    if (data.email) {
      const existingEmail = await Member.findOne({
        where: { email: data.email, id: { [Op.ne]: memberId } },
      });
      if (existingEmail) {
        throw new Error('Email already in use');
      }
    }

    await member.update(data);
    return member;
  }

  static async getPointsHistory(
    memberId: string,
    options: { page?: number; limit?: number; type?: string; merchantBrandId?: string } = {}
  ): Promise<{ transactions: PointsTransaction[]; total: number; page: number; totalPages: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = { memberId };
    if (options.type) {
      where.type = options.type;
    }
    if (options.merchantBrandId) {
      where.merchantBrandId = options.merchantBrandId;
    }

    const { rows: transactions, count: total } = await PointsTransaction.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
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

  static async getTierProgress(memberId: string, merchantBrandId?: string): Promise<{
    currentTier: Tier;
    nextTier: Tier | null;
    progress: number;
    pointsToNextTier: number;
  }> {
    const member = await Member.findByPk(memberId);
    if (!member) {
      throw new Error('Member not found');
    }

    let tierId = member.tierId;
    let lifetimePoints = member.lifetimePoints;

    // Use merchant-specific data if merchantBrandId provided
    if (merchantBrandId) {
      const mm = await MerchantMember.findOne({
        where: { memberId, merchantBrandId, isActive: true },
      });
      if (mm) {
        tierId = mm.tierId;
        lifetimePoints = mm.lifetimePoints;
      }
    }

    const currentTier = await Tier.findByPk(tierId);
    if (!currentTier) {
      throw new Error('Tier not found');
    }

    // Find next tier — scoped to merchant if applicable
    const nextTierWhere: Record<string, unknown> = {
      minPoints: { [Op.gt]: currentTier.maxPoints },
      isActive: true,
    };
    if (merchantBrandId) {
      nextTierWhere.merchantBrandId = merchantBrandId;
    } else {
      nextTierWhere.merchantBrandId = null;
    }
    const nextTier = await Tier.findOne({
      where: nextTierWhere,
      order: [['minPoints', 'ASC']],
    });

    let progress = 100;
    let pointsToNextTier = 0;

    if (nextTier) {
      const tierRange = currentTier.maxPoints - currentTier.minPoints;
      const memberProgress = lifetimePoints - currentTier.minPoints;
      progress = Math.min(100, Math.floor((memberProgress / tierRange) * 100));
      pointsToNextTier = nextTier.minPoints - lifetimePoints;
    }

    return {
      currentTier,
      nextTier,
      progress,
      pointsToNextTier: Math.max(0, pointsToNextTier),
    };
  }

  static async checkAndUpgradeTier(memberId: string, merchantBrandId?: string): Promise<{ upgraded: boolean; newTier?: Tier }> {
    const member = await Member.findByPk(memberId);
    if (!member) {
      throw new Error('Member not found');
    }

    if (merchantBrandId) {
      const mm = await MerchantMember.findOne({
        where: { memberId, merchantBrandId, isActive: true },
      });
      if (!mm) {
        return { upgraded: false };
      }

      const eligibleTier = await Tier.findOne({
        where: {
          merchantBrandId,
          minPoints: { [Op.lte]: mm.lifetimePoints },
          maxPoints: { [Op.gte]: mm.lifetimePoints },
          isActive: true,
        },
      });

      if (eligibleTier && eligibleTier.id !== mm.tierId) {
        await mm.update({ tierId: eligibleTier.id });
        return { upgraded: true, newTier: eligibleTier };
      }

      return { upgraded: false };
    }

    // Legacy: operate on global Member
    const eligibleTier = await Tier.findOne({
      where: {
        minPoints: { [Op.lte]: member.lifetimePoints },
        maxPoints: { [Op.gte]: member.lifetimePoints },
        isActive: true,
        merchantBrandId: null,
      },
    });

    if (eligibleTier && eligibleTier.id !== member.tierId) {
      await member.update({ tierId: eligibleTier.id });
      return { upgraded: true, newTier: eligibleTier };
    }

    return { upgraded: false };
  }

  static async getMemberVouchers(
    memberId: string,
    status?: 'active' | 'used' | 'expired',
    merchantBrandId?: string
  ): Promise<MemberVoucher[]> {
    const where: Record<string, unknown> = { memberId };
    if (status) {
      where.status = status;
    }
    if (merchantBrandId) {
      where.merchantBrandId = merchantBrandId;
    }

    return MemberVoucher.findAll({
      where,
      include: [{ model: Voucher, as: 'voucher' }],
      order: [['createdAt', 'DESC']],
    });
  }
}
