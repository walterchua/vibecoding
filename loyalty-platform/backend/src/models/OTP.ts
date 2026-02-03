import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface OTPAttributes {
  id: string;
  phone: string;
  memberId?: string;
  code: string;
  attempts: number;
  isVerified: boolean;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface OTPCreationAttributes extends Optional<OTPAttributes, 'id' | 'memberId' | 'attempts' | 'isVerified' | 'createdAt' | 'updatedAt'> {}

class OTP extends Model<OTPAttributes, OTPCreationAttributes> implements OTPAttributes {
  public id!: string;
  public phone!: string;
  public memberId?: string;
  public code!: string;
  public attempts!: number;
  public isVerified!: boolean;
  public expiresAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

OTP.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    memberId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    code: {
      type: DataTypes.STRING(6),
      allowNull: false,
    },
    attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'otps',
    timestamps: true,
    indexes: [
      { fields: ['phone'] },
      { fields: ['expiresAt'] },
    ],
  }
);

export default OTP;
