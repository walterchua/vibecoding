import { Member, PointsTransaction, Tier, MerchantMember } from '../models';
import sequelize from '../config/database';
import { Transaction as SequelizeTransaction, Op } from 'sequelize';

interface EarnPointsParams {
  memberId: string;
  merchantBrandId?: string;
  points: number;
  description?: string;
  referenceType?: string;
  referenceId?: string;
  campaignId?: string;
}

interface RedeemPointsParams {
  memberId: string;
  merchantBrandId?: string;
  points: number;
  description?: string;
  referenceType?: string;
  referenceId?: string;
}

export class PointsService {
  static async earnPoints(params: EarnPointsParams): Promise<{
    transaction: PointsTransaction;
    newBalance: number;
    tierUpgraded: boolean;
    newTier?: Tier;
  }> {
    const result = await sequelize.transaction(async (t: SequelizeTransaction) => {
      // If merchantBrandId is provided, operate on MerchantMember
      if (params.merchantBrandId) {
        const mm = await MerchantMember.findOne({
          where: { memberId: params.memberId, merchantBrandId: params.merchantBrandId, isActive: true },
          lock: t.LOCK.UPDATE,
          transaction: t,
        });

        if (!mm) throw new Error('Merchant member not found');

        const balanceBefore = mm.availablePoints;
        const newAvailable = balanceBefore + params.points;
        const newTotal = mm.totalPoints + params.points;
        const newLifetime = mm.lifetimePoints + params.points;

        const pointsTransaction = await PointsTransaction.create(
          {
            memberId: params.memberId,
            merchantBrandId: params.merchantBrandId,
            type: 'earn',
            points: params.points,
            balanceBefore,
            balanceAfter: newAvailable,
            description: params.description,
            referenceType: params.referenceType,
            referenceId: params.referenceId,
            campaignId: params.campaignId,
          },
          { transaction: t }
        );

        await mm.update(
          { availablePoints: newAvailable, totalPoints: newTotal, lifetimePoints: newLifetime },
          { transaction: t }
        );

        // Also update legacy Member points for backward compatibility
        const member = await Member.findByPk(params.memberId, { transaction: t });
        if (member) {
          await member.update(
            {
              availablePoints: member.availablePoints + params.points,
              totalPoints: member.totalPoints + params.points,
              lifetimePoints: member.lifetimePoints + params.points,
            },
            { transaction: t }
          );
        }

        // Check tier upgrade using merchant-specific tiers
        const eligibleTier = await Tier.findOne({
          where: { merchantBrandId: params.merchantBrandId, isActive: true, minPoints: { [Op.lte]: newLifetime } },
          order: [['minPoints', 'DESC']],
          transaction: t,
        });

        let tierUpgraded = false;
        let newTier: Tier | undefined;

        if (eligibleTier && eligibleTier.id !== mm.tierId) {
          await mm.update({ tierId: eligibleTier.id }, { transaction: t });
          tierUpgraded = true;
          newTier = eligibleTier;
        }

        return { transaction: pointsTransaction, newBalance: newAvailable, tierUpgraded, newTier };
      }

      // Legacy path: operate on Member directly
      const member = await Member.findByPk(params.memberId, {
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!member) throw new Error('Member not found');

      const balanceBefore = member.availablePoints;
      const newAvailable = balanceBefore + params.points;
      const newTotal = member.totalPoints + params.points;
      const newLifetime = member.lifetimePoints + params.points;

      const pointsTransaction = await PointsTransaction.create(
        {
          memberId: params.memberId,
          type: 'earn',
          points: params.points,
          balanceBefore,
          balanceAfter: newAvailable,
          description: params.description,
          referenceType: params.referenceType,
          referenceId: params.referenceId,
          campaignId: params.campaignId,
        },
        { transaction: t }
      );

      await member.update(
        { availablePoints: newAvailable, totalPoints: newTotal, lifetimePoints: newLifetime },
        { transaction: t }
      );

      const eligibleTier = await Tier.findOne({
        where: { isActive: true },
        order: [['minPoints', 'DESC']],
        transaction: t,
      });

      let tierUpgraded = false;
      let newTier: Tier | undefined;

      if (eligibleTier && newLifetime >= eligibleTier.minPoints && eligibleTier.id !== member.tierId) {
        await member.update({ tierId: eligibleTier.id }, { transaction: t });
        tierUpgraded = true;
        newTier = eligibleTier;
      }

      return { transaction: pointsTransaction, newBalance: newAvailable, tierUpgraded, newTier };
    });

    return result;
  }

  static async redeemPoints(params: RedeemPointsParams): Promise<{
    transaction: PointsTransaction;
    newBalance: number;
  }> {
    const result = await sequelize.transaction(async (t: SequelizeTransaction) => {
      if (params.merchantBrandId) {
        const mm = await MerchantMember.findOne({
          where: { memberId: params.memberId, merchantBrandId: params.merchantBrandId, isActive: true },
          lock: t.LOCK.UPDATE,
          transaction: t,
        });

        if (!mm) throw new Error('Merchant member not found');
        if (mm.availablePoints < params.points) throw new Error('Insufficient points');

        const balanceBefore = mm.availablePoints;
        const newAvailable = balanceBefore - params.points;

        const pointsTransaction = await PointsTransaction.create(
          {
            memberId: params.memberId,
            merchantBrandId: params.merchantBrandId,
            type: 'redeem',
            points: -params.points,
            balanceBefore,
            balanceAfter: newAvailable,
            description: params.description,
            referenceType: params.referenceType,
            referenceId: params.referenceId,
          },
          { transaction: t }
        );

        await mm.update({ availablePoints: newAvailable }, { transaction: t });

        // Update legacy Member points
        const member = await Member.findByPk(params.memberId, { transaction: t });
        if (member) {
          await member.update(
            { availablePoints: Math.max(0, member.availablePoints - params.points) },
            { transaction: t }
          );
        }

        return { transaction: pointsTransaction, newBalance: newAvailable };
      }

      // Legacy path
      const member = await Member.findByPk(params.memberId, {
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!member) throw new Error('Member not found');
      if (member.availablePoints < params.points) throw new Error('Insufficient points');

      const balanceBefore = member.availablePoints;
      const newAvailable = balanceBefore - params.points;

      const pointsTransaction = await PointsTransaction.create(
        {
          memberId: params.memberId,
          type: 'redeem',
          points: -params.points,
          balanceBefore,
          balanceAfter: newAvailable,
          description: params.description,
          referenceType: params.referenceType,
          referenceId: params.referenceId,
        },
        { transaction: t }
      );

      await member.update({ availablePoints: newAvailable }, { transaction: t });

      return { transaction: pointsTransaction, newBalance: newAvailable };
    });

    return result;
  }

  static async adjustPoints(
    memberId: string,
    points: number,
    description: string,
    merchantBrandId?: string
  ): Promise<PointsTransaction> {
    return sequelize.transaction(async (t: SequelizeTransaction) => {
      if (merchantBrandId) {
        const mm = await MerchantMember.findOne({
          where: { memberId, merchantBrandId, isActive: true },
          lock: t.LOCK.UPDATE,
          transaction: t,
        });
        if (!mm) throw new Error('Merchant member not found');

        const balanceBefore = mm.availablePoints;
        const newAvailable = Math.max(0, balanceBefore + points);

        const transaction = await PointsTransaction.create(
          { memberId, merchantBrandId, type: 'adjust', points, balanceBefore, balanceAfter: newAvailable, description },
          { transaction: t }
        );

        await mm.update(
          {
            availablePoints: newAvailable,
            totalPoints: points > 0 ? mm.totalPoints + points : mm.totalPoints,
            lifetimePoints: points > 0 ? mm.lifetimePoints + points : mm.lifetimePoints,
          },
          { transaction: t }
        );

        return transaction;
      }

      const member = await Member.findByPk(memberId, { lock: t.LOCK.UPDATE, transaction: t });
      if (!member) throw new Error('Member not found');

      const balanceBefore = member.availablePoints;
      const newAvailable = Math.max(0, balanceBefore + points);

      const transaction = await PointsTransaction.create(
        { memberId, type: 'adjust', points, balanceBefore, balanceAfter: newAvailable, description },
        { transaction: t }
      );

      await member.update(
        {
          availablePoints: newAvailable,
          totalPoints: points > 0 ? member.totalPoints + points : member.totalPoints,
          lifetimePoints: points > 0 ? member.lifetimePoints + points : member.lifetimePoints,
        },
        { transaction: t }
      );

      return transaction;
    });
  }

  static async getBalance(memberId: string, merchantBrandId?: string): Promise<{
    available: number;
    total: number;
    lifetime: number;
  }> {
    if (merchantBrandId) {
      const mm = await MerchantMember.findOne({
        where: { memberId, merchantBrandId, isActive: true },
      });
      if (!mm) throw new Error('Merchant member not found');
      return { available: mm.availablePoints, total: mm.totalPoints, lifetime: mm.lifetimePoints };
    }

    const member = await Member.findByPk(memberId);
    if (!member) throw new Error('Member not found');
    return { available: member.availablePoints, total: member.totalPoints, lifetime: member.lifetimePoints };
  }
}
