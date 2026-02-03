import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface MemberAttributes {
  id: string;
  phone: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  tierId: string;
  totalPoints: number;
  availablePoints: number;
  lifetimePoints: number;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MemberCreationAttributes extends Optional<MemberAttributes, 'id' | 'email' | 'firstName' | 'lastName' | 'dateOfBirth' | 'gender' | 'totalPoints' | 'availablePoints' | 'lifetimePoints' | 'isActive' | 'isVerified' | 'lastLoginAt' | 'createdAt' | 'updatedAt'> {}

class Member extends Model<MemberAttributes, MemberCreationAttributes> implements MemberAttributes {
  public id!: string;
  public phone!: string;
  public email?: string;
  public firstName?: string;
  public lastName?: string;
  public dateOfBirth?: Date;
  public gender?: 'male' | 'female' | 'other';
  public tierId!: string;
  public totalPoints!: number;
  public availablePoints!: number;
  public lifetimePoints!: number;
  public isActive!: boolean;
  public isVerified!: boolean;
  public lastLoginAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Member.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: true,
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
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'members',
    timestamps: true,
    indexes: [
      { fields: ['phone'] },
      { fields: ['email'] },
      { fields: ['tierId'] },
    ],
  }
);

export default Member;
