import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';

interface MerchantAttributes {
  id: string;
  merchantBrandId?: string;
  outletId?: string;
  role?: 'admin' | 'manager' | 'cashier';
  name: string;
  email: string;
  password: string;
  phone?: string;
  locationId: string;
  locationName: string;
  posId: string;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MerchantCreationAttributes extends Optional<MerchantAttributes, 'id' | 'merchantBrandId' | 'outletId' | 'role' | 'phone' | 'isActive' | 'lastLoginAt' | 'createdAt' | 'updatedAt'> {}

class Merchant extends Model<MerchantAttributes, MerchantCreationAttributes> implements MerchantAttributes {
  public id!: string;
  public merchantBrandId?: string;
  public outletId?: string;
  public role?: 'admin' | 'manager' | 'cashier';
  public name!: string;
  public email!: string;
  public password!: string;
  public phone?: string;
  public locationId!: string;
  public locationName!: string;
  public posId!: string;
  public isActive!: boolean;
  public lastLoginAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }
}

Merchant.init(
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
    outletId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('admin', 'manager', 'cashier'),
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    locationId: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    locationName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    posId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'merchants',
    timestamps: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['posId'] },
      { fields: ['locationId'] },
    ],
    hooks: {
      beforeCreate: async (merchant: Merchant) => {
        if (merchant.password) {
          merchant.password = await bcrypt.hash(merchant.password, 10);
        }
      },
      beforeUpdate: async (merchant: Merchant) => {
        if (merchant.changed('password')) {
          merchant.password = await bcrypt.hash(merchant.password, 10);
        }
      },
    },
  }
);

export default Merchant;
