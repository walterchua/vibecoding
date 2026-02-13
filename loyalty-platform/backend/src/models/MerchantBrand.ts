import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface MerchantBrandAttributes {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MerchantBrandCreationAttributes extends Optional<MerchantBrandAttributes, 'id' | 'logo' | 'description' | 'contactEmail' | 'contactPhone' | 'address' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class MerchantBrand extends Model<MerchantBrandAttributes, MerchantBrandCreationAttributes> implements MerchantBrandAttributes {
  public id!: string;
  public name!: string;
  public slug!: string;
  public logo?: string;
  public description?: string;
  public contactEmail?: string;
  public contactPhone?: string;
  public address?: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

MerchantBrand.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    logo: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    contactEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    contactPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'merchant_brands',
    timestamps: true,
    indexes: [
      { fields: ['slug'] },
      { fields: ['isActive'] },
    ],
  }
);

export default MerchantBrand;
