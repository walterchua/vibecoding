import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface VoucherAttributes {
  id: string;
  merchantBrandId?: string;
  name: string;
  code: string;
  description?: string;
  type: 'percentage' | 'fixed' | 'freebie';
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  pointsCost: number;
  quantity?: number;
  usedCount: number;
  termsConditions?: string;
  imageUrl?: string;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface VoucherCreationAttributes extends Optional<VoucherAttributes, 'id' | 'merchantBrandId' | 'description' | 'minPurchase' | 'maxDiscount' | 'quantity' | 'usedCount' | 'termsConditions' | 'imageUrl' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class Voucher extends Model<VoucherAttributes, VoucherCreationAttributes> implements VoucherAttributes {
  public id!: string;
  public merchantBrandId?: string;
  public name!: string;
  public code!: string;
  public description?: string;
  public type!: 'percentage' | 'fixed' | 'freebie';
  public value!: number;
  public minPurchase?: number;
  public maxDiscount?: number;
  public pointsCost!: number;
  public quantity?: number;
  public usedCount!: number;
  public termsConditions?: string;
  public imageUrl?: string;
  public validFrom!: Date;
  public validUntil!: Date;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Voucher.init(
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
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM('percentage', 'fixed', 'freebie'),
      allowNull: false,
    },
    value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    minPurchase: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    maxDiscount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    pointsCost: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    usedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    termsConditions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    validFrom: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    validUntil: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'vouchers',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['code', 'merchantBrandId'] },
      { fields: ['merchantBrandId'] },
      { fields: ['isActive'] },
      { fields: ['validFrom', 'validUntil'] },
    ],
  }
);

export default Voucher;
