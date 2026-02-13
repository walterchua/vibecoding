import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface MerchantMemberAttributes {
  id: string;
  memberId: string;
  merchantBrandId: string;
  tierId: string;
  totalPoints: number;
  availablePoints: number;
  lifetimePoints: number;
  isActive: boolean;
  joinedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MerchantMemberCreationAttributes extends Optional<MerchantMemberAttributes, 'id' | 'totalPoints' | 'availablePoints' | 'lifetimePoints' | 'isActive' | 'joinedAt' | 'createdAt' | 'updatedAt'> {}

class MerchantMember extends Model<MerchantMemberAttributes, MerchantMemberCreationAttributes> implements MerchantMemberAttributes {
  public id!: string;
  public memberId!: string;
  public merchantBrandId!: string;
  public tierId!: string;
  public totalPoints!: number;
  public availablePoints!: number;
  public lifetimePoints!: number;
  public isActive!: boolean;
  public joinedAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

MerchantMember.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    memberId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    merchantBrandId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    tierId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    totalPoints: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    availablePoints: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    lifetimePoints: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'merchant_members',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['memberId', 'merchantBrandId'] },
      { fields: ['memberId'] },
      { fields: ['merchantBrandId'] },
      { fields: ['tierId'] },
    ],
  }
);

export default MerchantMember;
