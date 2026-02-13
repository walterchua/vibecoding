import { MerchantMember, Member, MerchantBrand, Tier } from '../models';
import { Op } from 'sequelize';

export class MerchantMemberService {
  static async joinMerchant(memberId: string, merchantBrandId: string): Promise<MerchantMember> {
    const member = await Member.findByPk(memberId);
    if (!member) throw new Error('Member not found');

    const brand = await MerchantBrand.findByPk(merchantBrandId);
    if (!brand || !brand.isActive) throw new Error('Merchant brand not found or inactive');

    const existing = await MerchantMember.findOne({
      where: { memberId, merchantBrandId },
    });
    if (existing) {
      if (!existing.isActive) {
        await existing.update({ isActive: true });
        return existing;
      }
      throw new Error('Already a member of this merchant');
    }

    // Find the default (lowest) tier for this merchant
    const defaultTier = await Tier.findOne({
      where: { merchantBrandId, isActive: true },
      order: [['minPoints', 'ASC']],
    });

    if (!defaultTier) {
      throw new Error('No tiers configured for this merchant');
    }

    return MerchantMember.create({
      memberId,
      merchantBrandId,
      tierId: defaultTier.id,
      joinedAt: new Date(),
    });
  }

  static async getMembership(memberId: string, merchantBrandId: string): Promise<MerchantMember | null> {
    return MerchantMember.findOne({
      where: { memberId, merchantBrandId, isActive: true },
      include: [
        { model: Tier, as: 'tier' },
        { model: MerchantBrand, as: 'merchantBrand', attributes: ['id', 'name', 'slug', 'logo'] },
      ],
    });
  }

  static async getMemberMerchants(memberId: string): Promise<MerchantMember[]> {
    return MerchantMember.findAll({
      where: { memberId, isActive: true },
      include: [
        { model: MerchantBrand, as: 'merchantBrand', attributes: ['id', 'name', 'slug', 'logo', 'description'] },
        { model: Tier, as: 'tier', attributes: ['id', 'name', 'code', 'color'] },
      ],
      order: [['joinedAt', 'DESC']],
    });
  }

  static async getMerchantMembers(
    merchantBrandId: string,
    options: { page?: number; limit?: number; search?: string; tierId?: string } = {}
  ): Promise<{
    members: MerchantMember[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = { merchantBrandId, isActive: true };
    if (options.tierId) {
      where.tierId = options.tierId;
    }

    const includeWhere: Record<string, unknown> = {};
    if (options.search) {
      includeWhere[Op.or] = [
        { phone: { [Op.iLike]: `%${options.search}%` } },
        { email: { [Op.iLike]: `%${options.search}%` } },
        { firstName: { [Op.iLike]: `%${options.search}%` } },
        { lastName: { [Op.iLike]: `%${options.search}%` } },
      ];
    }

    const { rows: members, count: total } = await MerchantMember.findAndCountAll({
      where,
      include: [
        {
          model: Member,
          as: 'member',
          attributes: ['id', 'phone', 'email', 'firstName', 'lastName'],
          where: Object.keys(includeWhere).length > 0 ? includeWhere : undefined,
        },
        { model: Tier, as: 'tier', attributes: ['id', 'name', 'code', 'color'] },
      ],
      order: [['joinedAt', 'DESC']],
      limit,
      offset,
    });

    return { members, total, page, totalPages: Math.ceil(total / limit) };
  }

  static async updateTier(merchantMemberId: string, tierId: string): Promise<MerchantMember> {
    const mm = await MerchantMember.findByPk(merchantMemberId);
    if (!mm) throw new Error('Merchant member not found');
    await mm.update({ tierId });
    return mm;
  }
}
