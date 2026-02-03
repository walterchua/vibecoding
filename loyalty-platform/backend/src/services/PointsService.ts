import { Member, PointsTransaction, Tier } from '../models';
import sequelize from '../config/database';
import { Transaction as SequelizeTransaction } from 'sequelize';

interface EarnPointsParams {
  memberId: string;
  points: number;
  description?: string;
  referenceType?: string;
  referenceId?: string;
  campaignId?: string;
}

interface RedeemPointsParams {
  memberId: string;
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
      const member = await Member.findByPk(params.memberId, {
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!member) {
        throw new Error('Member not found');
      }

      const balanceBefore = member.availablePoints;
      const newAvailable = balanceBefore + params.points;
      const newTotal = member.totalPoints + params.points;
      const newLifetime = member.lifetimePoints + params.points;

      // Create transaction record
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

      // Update member balance
      await member.update(
        {
          availablePoints: newAvailable,
          totalPoints: newTotal,
          lifetimePoints: newLifetime,
        },
        { transaction: t }
      );

      // Check for tier upgrade
      const eligibleTier = await Tier.findOne({
        where: {
          isActive: true,
        },
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

      return {
        transaction: pointsTransaction,
        newBalance: newAvailable,
        tierUpgraded,
        newTier,
      };
    });

    return result;
  }

  static async redeemPoints(params: RedeemPointsParams): Promise<{
    transaction: PointsTransaction;
    newBalance: number;
  }> {
    const result = await sequelize.transaction(async (t: SequelizeTransaction) => {
      const member = await Member.findByPk(params.memberId, {
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!member) {
        throw new Error('Member not found');
      }

      if (member.availablePoints < params.points) {
        throw new Error('Insufficient points');
      }

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

      return {
        transaction: pointsTransaction,
        newBalance: newAvailable,
      };
    });

    return result;
  }

  static async adjustPoints(
    memberId: string,
    points: number,
    description: string
  ): Promise<PointsTransaction> {
    return sequelize.transaction(async (t: SequelizeTransaction) => {
      const member = await Member.findByPk(memberId, {
        lock: t.LOCK.UPDATE,
        transaction: t,
      });

      if (!member) {
        throw new Error('Member not found');
      }

      const balanceBefore = member.availablePoints;
      const newAvailable = Math.max(0, balanceBefore + points);

      const transaction = await PointsTransaction.create(
        {
          memberId,
          type: 'adjust',
          points,
          balanceBefore,
          balanceAfter: newAvailable,
          description,
        },
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

  static async getBalance(memberId: string): Promise<{
    available: number;
    total: number;
    lifetime: number;
  }> {
    const member = await Member.findByPk(memberId);

    if (!member) {
      throw new Error('Member not found');
    }

    return {
      available: member.availablePoints,
      total: member.totalPoints,
      lifetime: member.lifetimePoints,
    };
  }
}
