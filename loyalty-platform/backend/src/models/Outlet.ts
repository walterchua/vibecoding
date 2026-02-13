import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface OutletAttributes {
  id: string;
  merchantBrandId: string;
  name: string;
  address?: string;
  locationId?: string;
  phone?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface OutletCreationAttributes extends Optional<OutletAttributes, 'id' | 'address' | 'locationId' | 'phone' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class Outlet extends Model<OutletAttributes, OutletCreationAttributes> implements OutletAttributes {
  public id!: string;
  public merchantBrandId!: string;
  public name!: string;
  public address?: string;
  public locationId?: string;
  public phone?: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Outlet.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    merchantBrandId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    locationId: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'outlets',
    timestamps: true,
    indexes: [
      { fields: ['merchantBrandId'] },
      { fields: ['locationId'] },
      { fields: ['isActive'] },
    ],
  }
);

export default Outlet;
