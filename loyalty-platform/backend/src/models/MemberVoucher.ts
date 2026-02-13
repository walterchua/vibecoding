import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface MemberVoucherAttributes {
  id: string;
  merchantBrandId?: string;
  memberId: string;
  voucherId: string;
  status: 'active' | 'used' | 'expired';
  usedAt?: Date;
  usedAtLocation?: string;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MemberVoucherCreationAttributes extends Optional<MemberVoucherAttributes, 'id' | 'merchantBrandId' | 'status' | 'usedAt' | 'usedAtLocation' | 'createdAt' | 'updatedAt'> {}

class MemberVoucher extends Model<MemberVoucherAttributes, MemberVoucherCreationAttributes> implements MemberVoucherAttributes {
  public id!: string;
  public merchantBrandId?: string;
  public memberId!: string;
  public voucherId!: string;
  public status!: 'active' | 'used' | 'expired';
  public usedAt?: Date;
  public usedAtLocation?: string;
  public expiresAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

MemberVoucher.init(
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
    voucherId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'used', 'expired'),
      defaultValue: 'active',
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    usedAtLocation: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'member_vouchers',
    timestamps: true,
    indexes: [
      { fields: ['merchantBrandId'] },
      { fields: ['memberId'] },
      { fields: ['voucherId'] },
      { fields: ['status'] },
      { fields: ['expiresAt'] },
    ],
  }
);

export default MemberVoucher;
