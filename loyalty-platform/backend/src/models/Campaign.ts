import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface CampaignCriteria {
  days?: string[];
  minAmount?: number;
  maxAmount?: number;
  categories?: string[];
  products?: string[];
  locations?: string[];
  tierIds?: string[];
  isFirstPurchase?: boolean;
  isBirthday?: boolean;
}

interface CampaignReward {
  type: 'points' | 'points_multiplier' | 'voucher';
  value?: number;
  multiplier?: number;
  voucherId?: string;
}

interface CampaignAttributes {
  id: string;
  merchantBrandId?: string;
  name: string;
  description?: string;
  type: 'points_earn' | 'points_multiplier' | 'voucher_distribution' | 'tier_bonus';
  criteria: CampaignCriteria;
  reward: CampaignReward;
  startDate: Date;
  endDate: Date;
  priority: number;
  isActive: boolean;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CampaignCreationAttributes extends Optional<CampaignAttributes, 'id' | 'merchantBrandId' | 'description' | 'priority' | 'isActive' | 'createdBy' | 'createdAt' | 'updatedAt'> {}

class Campaign extends Model<CampaignAttributes, CampaignCreationAttributes> implements CampaignAttributes {
  public id!: string;
  public merchantBrandId?: string;
  public name!: string;
  public description?: string;
  public type!: 'points_earn' | 'points_multiplier' | 'voucher_distribution' | 'tier_bonus';
  public criteria!: CampaignCriteria;
  public reward!: CampaignReward;
  public startDate!: Date;
  public endDate!: Date;
  public priority!: number;
  public isActive!: boolean;
  public createdBy?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Campaign.init(
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('points_earn', 'points_multiplier', 'voucher_distribution', 'tier_bonus'),
      allowNull: false,
    },
    criteria: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    reward: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'campaigns',
    timestamps: true,
    indexes: [
      { fields: ['merchantBrandId'] },
      { fields: ['isActive'] },
      { fields: ['startDate', 'endDate'] },
      { fields: ['type'] },
    ],
  }
);

export default Campaign;
