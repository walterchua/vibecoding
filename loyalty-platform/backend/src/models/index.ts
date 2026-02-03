import sequelize from '../config/database';
import Member from './Member';
import Tier from './Tier';
import PointsTransaction from './PointsTransaction';
import Voucher from './Voucher';
import MemberVoucher from './MemberVoucher';
import Campaign from './Campaign';
import Transaction from './Transaction';
import QRCode from './QRCode';
import OTP from './OTP';
import RefreshToken from './RefreshToken';

// Member <-> Tier
Member.belongsTo(Tier, { foreignKey: 'tierId', as: 'tier' });
Tier.hasMany(Member, { foreignKey: 'tierId', as: 'members' });

// Member <-> PointsTransaction
Member.hasMany(PointsTransaction, { foreignKey: 'memberId', as: 'pointsTransactions' });
PointsTransaction.belongsTo(Member, { foreignKey: 'memberId', as: 'member' });

// Member <-> MemberVoucher <-> Voucher
Member.hasMany(MemberVoucher, { foreignKey: 'memberId', as: 'memberVouchers' });
MemberVoucher.belongsTo(Member, { foreignKey: 'memberId', as: 'member' });
Voucher.hasMany(MemberVoucher, { foreignKey: 'voucherId', as: 'memberVouchers' });
MemberVoucher.belongsTo(Voucher, { foreignKey: 'voucherId', as: 'voucher' });

// Member <-> Transaction
Member.hasMany(Transaction, { foreignKey: 'memberId', as: 'transactions' });
Transaction.belongsTo(Member, { foreignKey: 'memberId', as: 'member' });

// Member <-> QRCode
Member.hasMany(QRCode, { foreignKey: 'memberId', as: 'qrCodes' });
QRCode.belongsTo(Member, { foreignKey: 'memberId', as: 'member' });

// Campaign <-> PointsTransaction
Campaign.hasMany(PointsTransaction, { foreignKey: 'campaignId', as: 'pointsTransactions' });
PointsTransaction.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });

// Transaction <-> Campaign
Transaction.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });

// MemberVoucher <-> QRCode
MemberVoucher.hasOne(QRCode, { foreignKey: 'memberVoucherId', as: 'qrCode' });
QRCode.belongsTo(MemberVoucher, { foreignKey: 'memberVoucherId', as: 'memberVoucher' });

// Member <-> OTP
Member.hasMany(OTP, { foreignKey: 'memberId', as: 'otps' });
OTP.belongsTo(Member, { foreignKey: 'memberId', as: 'member' });

// Member <-> RefreshToken
Member.hasMany(RefreshToken, { foreignKey: 'memberId', as: 'refreshTokens' });
RefreshToken.belongsTo(Member, { foreignKey: 'memberId', as: 'member' });

export const syncDatabase = async (force = false): Promise<void> => {
  await sequelize.sync({ force });
  console.log('Database synced successfully.');
};

export {
  sequelize,
  Member,
  Tier,
  PointsTransaction,
  Voucher,
  MemberVoucher,
  Campaign,
  Transaction,
  QRCode,
  OTP,
  RefreshToken,
};
