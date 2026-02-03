import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface TierAttributes {
  id: string;
  name: string;
  code: string;
  minPoints: number;
  maxPoints: number;
  pointsMultiplier: number;
  benefits: object;
  color: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TierCreationAttributes extends Optional<TierAttributes, 'id' | 'pointsMultiplier' | 'benefits' | 'color' | 'icon' | 'sortOrder' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class Tier extends Model<TierAttributes, TierCreationAttributes> implements TierAttributes {
  public id!: string;
  public name!: string;
  public code!: string;
  public minPoints!: number;
  public maxPoints!: number;
  public pointsMultiplier!: number;
  public benefits!: object;
  public color!: string;
  public icon?: string;
  public sortOrder!: number;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Tier.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    minPoints: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    maxPoints: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pointsMultiplier: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 1.0,
    },
    benefits: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    color: {
      type: DataTypes.STRING(7),
      defaultValue: '#CD7F32',
    },
    icon: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'tiers',
    timestamps: true,
  }
);

export default Tier;
