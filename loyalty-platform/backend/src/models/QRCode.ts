import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface QRCodePayload {
  type: 'points' | 'voucher' | 'membership';
  memberId: string;
  points?: number;
  voucherId?: string;
  memberVoucherId?: string;
}

interface QRCodeAttributes {
  id: string;
  merchantBrandId?: string;
  memberId: string;
  type: 'points' | 'voucher' | 'membership';
  payload: QRCodePayload;
  token: string;
  signature: string;
  memberVoucherId?: string;
  pointsAmount?: number;
  status: 'active' | 'used' | 'expired';
  usedAt?: Date;
  usedByPosId?: string;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface QRCodeCreationAttributes extends Optional<QRCodeAttributes, 'id' | 'merchantBrandId' | 'memberVoucherId' | 'pointsAmount' | 'status' | 'usedAt' | 'usedByPosId' | 'createdAt' | 'updatedAt'> {}

class QRCode extends Model<QRCodeAttributes, QRCodeCreationAttributes> implements QRCodeAttributes {
  public id!: string;
  public merchantBrandId?: string;
  public memberId!: string;
  public type!: 'points' | 'voucher' | 'membership';
  public payload!: QRCodePayload;
  public token!: string;
  public signature!: string;
  public memberVoucherId?: string;
  public pointsAmount?: number;
  public status!: 'active' | 'used' | 'expired';
  public usedAt?: Date;
  public usedByPosId?: string;
  public expiresAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

QRCode.init(
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
      type: DataTypes.ENUM('points', 'voucher', 'membership'),
      allowNull: false,
    },
    payload: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING(500),
      allowNull: false,
      unique: true,
    },
    signature: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    memberVoucherId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    pointsAmount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'used', 'expired'),
      defaultValue: 'active',
    },
    usedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    usedByPosId: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'qr_codes',
    timestamps: true,
    indexes: [
      { fields: ['memberId'] },
      { fields: ['token'] },
      { fields: ['status'] },
      { fields: ['expiresAt'] },
    ],
  }
);

export default QRCode;
