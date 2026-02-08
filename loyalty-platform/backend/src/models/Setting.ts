import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface SettingAttributes {
  id: string;
  category: string;
  key: string;
  value: unknown;
  createdAt?: Date;
  updatedAt?: Date;
}

interface SettingCreationAttributes extends Optional<SettingAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

class Setting extends Model<SettingAttributes, SettingCreationAttributes> implements SettingAttributes {
  public id!: string;
  public category!: string;
  public key!: string;
  public value!: unknown;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Setting.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    key: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    value: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'settings',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['category', 'key'],
      },
    ],
  }
);

export default Setting;
