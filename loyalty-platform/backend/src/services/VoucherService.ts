import { Voucher, MemberVoucher, Member } from '../models';
import { PointsService } from './PointsService';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import { Transaction as SequelizeTransaction } from 'sequelize';

export class VoucherService {
  static async getAvailableVouchers(): Promise<Voucher[]> {
    const now = new Date();
    return Voucher.findAll({
      where: {
        isActive: true,
        validFrom: { [Op.lte]: now },
        validUntil: { [Op.gte]: now },
        [Op.or]: [
          { quantity: null },
          sequelize.where(
            sequelize.col('quantity'),
            '>',
            sequelize.col('usedCount')
          ),
        ],
      },
      order: [['pointsCost', 'ASC']],
    });
  }

  static async getVoucherById(voucherId: string): Promise<Voucher | null> {
    return Voucher.findByPk(voucherId);
  }

  static async claimVoucher(
    memberId: string,
    voucherId: string
  ): Promise<MemberVoucher> {
    return sequelize.transaction(async (t: SequelizeTransaction) => {
      const member = await Member.findByPk(memberId, {
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!member) {
        throw new Error('Member not found');
      }

      const voucher = await Voucher.findByPk(voucherId, {
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!voucher) {
        throw new Error('Voucher not found');
      }

      const now = new Date();
      if (!voucher.isActive || voucher.validFrom > now || voucher.validUntil < now) {
        throw new Error('Voucher is not available');
      }

      if (voucher.quantity !== null && voucher.usedCount >= voucher.quantity) {
        throw new Error('Voucher is sold out');
      }

      if (member.availablePoints < voucher.pointsCost) {
        throw new Error('Insufficient points');
      }

      // Deduct points
      if (voucher.pointsCost > 0) {
        await PointsService.redeemPoints({
          memberId,
          points: voucher.pointsCost,
          description: `Claimed voucher: ${voucher.name}`,
          referenceType: 'voucher_claim',
          referenceId: voucherId,
        });
      }

      // Update voucher usage count
      await voucher.increment('usedCount', { transaction: t });

      // Create member voucher
      const memberVoucher = await MemberVoucher.create(
        {
          memberId,
          voucherId,
          expiresAt: voucher.validUntil,
        },
        { transaction: t }
      );

      return memberVoucher;
    });
  }

  static async redeemVoucher(
    memberVoucherId: string,
    location?: string
  ): Promise<MemberVoucher> {
    const memberVoucher = await MemberVoucher.findByPk(memberVoucherId, {
      include: [{ model: Voucher, as: 'voucher' }],
    });

    if (!memberVoucher) {
      throw new Error('Voucher not found');
    }

    if (memberVoucher.status !== 'active') {
      throw new Error('Voucher has already been used or expired');
    }

    if (memberVoucher.expiresAt < new Date()) {
      await memberVoucher.update({ status: 'expired' });
      throw new Error('Voucher has expired');
    }

    await memberVoucher.update({
      status: 'used',
      usedAt: new Date(),
      usedAtLocation: location,
    });

    return memberVoucher;
  }

  static async getMemberVouchers(
    memberId: string,
    status?: 'active' | 'used' | 'expired'
  ): Promise<MemberVoucher[]> {
    const where: Record<string, unknown> = { memberId };
    if (status) {
      where.status = status;
    }

    // Update expired vouchers
    await MemberVoucher.update(
      { status: 'expired' },
      {
        where: {
          memberId,
          status: 'active',
          expiresAt: { [Op.lt]: new Date() },
        },
      }
    );

    return MemberVoucher.findAll({
      where,
      include: [{ model: Voucher, as: 'voucher' }],
      order: [['createdAt', 'DESC']],
    });
  }

  static async getMemberVoucherById(
    memberId: string,
    memberVoucherId: string
  ): Promise<MemberVoucher | null> {
    return MemberVoucher.findOne({
      where: { id: memberVoucherId, memberId },
      include: [{ model: Voucher, as: 'voucher' }],
    });
  }

  // Admin functions
  static async createVoucher(data: {
    name: string;
    code: string;
    description?: string;
    type: 'percentage' | 'fixed' | 'freebie';
    value: number;
    minPurchase?: number;
    maxDiscount?: number;
    pointsCost: number;
    quantity?: number;
    termsConditions?: string;
    imageUrl?: string;
    validFrom: Date;
    validUntil: Date;
  }): Promise<Voucher> {
    return Voucher.create(data);
  }

  static async updateVoucher(
    voucherId: string,
    data: Partial<Voucher>
  ): Promise<Voucher> {
    const voucher = await Voucher.findByPk(voucherId);
    if (!voucher) {
      throw new Error('Voucher not found');
    }
    await voucher.update(data);
    return voucher;
  }

  static async deleteVoucher(voucherId: string): Promise<void> {
    const voucher = await Voucher.findByPk(voucherId);
    if (!voucher) {
      throw new Error('Voucher not found');
    }
    await voucher.update({ isActive: false });
  }
}
