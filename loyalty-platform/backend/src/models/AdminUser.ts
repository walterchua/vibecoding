import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';

interface AdminUserAttributes {
  id: string;
  merchantBrandId?: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'merchant_admin' | 'merchant_staff';
  permissions: object;
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface AdminUserCreationAttributes extends Optional<AdminUserAttributes, 'id' | 'merchantBrandId' | 'permissions' | 'isActive' | 'lastLoginAt' | 'createdAt' | 'updatedAt'> {}

class AdminUser extends Model<AdminUserAttributes, AdminUserCreationAttributes> implements AdminUserAttributes {
  public id!: string;
  public merchantBrandId?: string;
  public email!: string;
  public password!: string;
  public firstName!: string;
  public lastName!: string;
  public role!: 'super_admin' | 'merchant_admin' | 'merchant_staff';
  public permissions!: object;
  public isActive!: boolean;
  public lastLoginAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }
}

AdminUser.init(
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
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('super_admin', 'merchant_admin', 'merchant_staff'),
      allowNull: false,
    },
    permissions: {
      type: DataTypes.JSONB,
      defaultValue: {},
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
    tableName: 'admin_users',
    timestamps: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['merchantBrandId'] },
      { fields: ['role'] },
    ],
    hooks: {
      beforeCreate: async (adminUser: AdminUser) => {
        if (adminUser.password) {
          adminUser.password = await bcrypt.hash(adminUser.password, 10);
        }
      },
      beforeUpdate: async (adminUser: AdminUser) => {
        if (adminUser.changed('password')) {
          adminUser.password = await bcrypt.hash(adminUser.password, 10);
        }
      },
    },
  }
);

export default AdminUser;
