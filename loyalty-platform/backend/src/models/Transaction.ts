import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface TransactionItem {
  sku: string;
  name: string;
  category?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface TransactionAttributes {
  id: string;
  memberId: string;
  externalId: string;
  posId: string;
  locationId?: string;
  locationName?: string;
  items: TransactionItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod?: string;
  pointsEarned: number;
  pointsRedeemed: number;
  campaignId?: string;
  status: 'pending' | 'processed' | 'failed';
  processedAt?: Date;
  transactionDate: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TransactionCreationAttributes extends Optional<TransactionAttributes, 'id' | 'locationId' | 'locationName' | 'tax' | 'discount' | 'paymentMethod' | 'pointsEarned' | 'pointsRedeemed' | 'campaignId' | 'status' | 'processedAt' | 'createdAt' | 'updatedAt'> {}

class Transaction extends Model<TransactionAttributes, TransactionCreationAttributes> implements TransactionAttributes {
  public id!: string;
  public memberId!: string;
  public externalId!: string;
  public posId!: string;
  public locationId?: string;
  public locationName?: string;
  public items!: TransactionItem[];
  public subtotal!: number;
  public tax!: number;
  public discount!: number;
  public total!: number;
  public paymentMethod?: string;
  public pointsEarned!: number;
  public pointsRedeemed!: number;
  public campaignId?: string;
  public status!: 'pending' | 'processed' | 'failed';
  public processedAt?: Date;
  public transactionDate!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Transaction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    memberId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    externalId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    posId: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    locationId: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    locationName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    items: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    tax: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    pointsEarned: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    pointsRedeemed: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    campaignId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'processed', 'failed'),
      defaultValue: 'pending',
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    transactionDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'transactions',
    timestamps: true,
    indexes: [
      { fields: ['memberId'] },
      { fields: ['externalId'] },
      { fields: ['posId'] },
      { fields: ['status'] },
      { fields: ['transactionDate'] },
    ],
  }
);

export default Transaction;
