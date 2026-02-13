import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PointsTransactionAttributes {
  id: string;
  merchantBrandId?: string;
  memberId: string;
  type: 'earn' | 'redeem' | 'expire' | 'adjust';
  points: number;
  balanceBefore: number;
  balanceAfter: number;
  description?: string;
  referenceType?: string;
  referenceId?: string;
  campaignId?: string;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PointsTransactionCreationAttributes extends Optional<PointsTransactionAttributes, 'id' | 'merchantBrandId' | 'description' | 'referenceType' | 'referenceId' | 'campaignId' | 'expiresAt' | 'createdAt' | 'updatedAt'> {}

class PointsTransaction extends Model<PointsTransactionAttributes, PointsTransactionCreationAttributes> implements PointsTransactionAttributes {
  public id!: string;
  public merchantBrandId?: string;
  public memberId!: string;
  public type!: 'earn' | 'redeem' | 'expire' | 'adjust';
  public points!: number;
  public balanceBefore!: number;
  public balanceAfter!: number;
  public description?: string;
  public referenceType?: string;
  public referenceId?: string;
  public campaignId?: string;
  public expiresAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PointsTransaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    merchantBrandId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    memberId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('earn', 'redeem', 'expire', 'adjust'),
      allowNull: false,
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    balanceBefore: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    balanceAfter: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    referenceType: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    referenceId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    campaignId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'points_transactions',
    timestamps: true,
    indexes: [
      { fields: ['merchantBrandId'] },
      { fields: ['memberId'] },
      { fields: ['type'] },
      { fields: ['createdAt'] },
    ],
  }
);

export default PointsTransaction;
