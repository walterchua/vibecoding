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
import Setting from './Setting';
import Merchant from './Merchant';
import MerchantBrand from './MerchantBrand';
import Outlet from './Outlet';
import AdminUser from './AdminUser';
import MerchantMember from './MerchantMember';

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

// === Multi-Tenant Associations ===

// MerchantBrand <-> Outlet
MerchantBrand.hasMany(Outlet, { foreignKey: 'merchantBrandId', as: 'outlets' });
Outlet.belongsTo(MerchantBrand, { foreignKey: 'merchantBrandId', as: 'merchantBrand' });

// MerchantBrand <-> Merchant (POS operators)
MerchantBrand.hasMany(Merchant, { foreignKey: 'merchantBrandId', as: 'merchants' });
Merchant.belongsTo(MerchantBrand, { foreignKey: 'merchantBrandId', as: 'merchantBrand' });

// Outlet <-> Merchant
Outlet.hasMany(Merchant, { foreignKey: 'outletId', as: 'merchants' });
Merchant.belongsTo(Outlet, { foreignKey: 'outletId', as: 'outlet' });

// MerchantBrand <-> AdminUser
MerchantBrand.hasMany(AdminUser, { foreignKey: 'merchantBrandId', as: 'adminUsers' });
AdminUser.belongsTo(MerchantBrand, { foreignKey: 'merchantBrandId', as: 'merchantBrand' });

// Member <-> MerchantMember <-> MerchantBrand
Member.hasMany(MerchantMember, { foreignKey: 'memberId', as: 'merchantMemberships' });
MerchantMember.belongsTo(Member, { foreignKey: 'memberId', as: 'member' });
MerchantBrand.hasMany(MerchantMember, { foreignKey: 'merchantBrandId', as: 'merchantMembers' });
MerchantMember.belongsTo(MerchantBrand, { foreignKey: 'merchantBrandId', as: 'merchantBrand' });

// MerchantMember <-> Tier
MerchantMember.belongsTo(Tier, { foreignKey: 'tierId', as: 'tier' });
Tier.hasMany(MerchantMember, { foreignKey: 'tierId', as: 'merchantMembers' });

// MerchantBrand <-> Tier
MerchantBrand.hasMany(Tier, { foreignKey: 'merchantBrandId', as: 'tiers' });
Tier.belongsTo(MerchantBrand, { foreignKey: 'merchantBrandId', as: 'merchantBrand' });

// MerchantBrand <-> Voucher
MerchantBrand.hasMany(Voucher, { foreignKey: 'merchantBrandId', as: 'vouchers' });
Voucher.belongsTo(MerchantBrand, { foreignKey: 'merchantBrandId', as: 'merchantBrand' });

// MerchantBrand <-> Campaign
MerchantBrand.hasMany(Campaign, { foreignKey: 'merchantBrandId', as: 'campaigns' });
Campaign.belongsTo(MerchantBrand, { foreignKey: 'merchantBrandId', as: 'merchantBrand' });

// MerchantBrand <-> Transaction
MerchantBrand.hasMany(Transaction, { foreignKey: 'merchantBrandId', as: 'transactions' });
Transaction.belongsTo(MerchantBrand, { foreignKey: 'merchantBrandId', as: 'merchantBrand' });

// Outlet <-> Transaction
Outlet.hasMany(Transaction, { foreignKey: 'outletId', as: 'transactions' });
Transaction.belongsTo(Outlet, { foreignKey: 'outletId', as: 'outlet' });

// MerchantBrand <-> PointsTransaction
MerchantBrand.hasMany(PointsTransaction, { foreignKey: 'merchantBrandId', as: 'pointsTransactions' });
PointsTransaction.belongsTo(MerchantBrand, { foreignKey: 'merchantBrandId', as: 'merchantBrand' });

// MerchantBrand <-> Setting
MerchantBrand.hasMany(Setting, { foreignKey: 'merchantBrandId', as: 'settings' });
Setting.belongsTo(MerchantBrand, { foreignKey: 'merchantBrandId', as: 'merchantBrand' });

// MerchantBrand <-> MemberVoucher
MerchantBrand.hasMany(MemberVoucher, { foreignKey: 'merchantBrandId', as: 'memberVouchers' });
MemberVoucher.belongsTo(MerchantBrand, { foreignKey: 'merchantBrandId', as: 'merchantBrand' });

// MerchantBrand <-> QRCode
MerchantBrand.hasMany(QRCode, { foreignKey: 'merchantBrandId', as: 'qrCodes' });
QRCode.belongsTo(MerchantBrand, { foreignKey: 'merchantBrandId', as: 'merchantBrand' });

export const syncDatabase = async (force = false): Promise<void> => {
  await sequelize.sync({ force, alter: true });
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
  Setting,
  Merchant,
  MerchantBrand,
  Outlet,
  AdminUser,
  MerchantMember,
};
