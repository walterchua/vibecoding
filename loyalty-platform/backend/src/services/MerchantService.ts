import jwt from 'jsonwebtoken';
import { Merchant, Transaction, Member, MerchantBrand, Outlet, MerchantMember } from '../models';
import { Op } from 'sequelize';

interface MerchantTokenPair {
  accessToken: string;
  expiresIn: number;
}

export class MerchantService {
  static async login(
    email: string,
    password: string
  ): Promise<{ merchant: Merchant; tokens: MerchantTokenPair; brand?: MerchantBrand; outlet?: Outlet }> {
    const merchant = await Merchant.findOne({
      where: { email },
      include: [
        { model: MerchantBrand, as: 'merchantBrand' },
        { model: Outlet, as: 'outlet' },
      ],
    });

    if (!merchant || !merchant.isActive) {
      throw new Error('Invalid credentials');
    }

    const isValid = await merchant.comparePassword(password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    await merchant.update({ lastLoginAt: new Date() });

    const tokens = this.generateTokens(merchant);

    const brand = merchant.get('merchantBrand') as MerchantBrand | undefined;
    const outlet = merchant.get('outlet') as Outlet | undefined;

    return { merchant, tokens, brand, outlet };
  }

  static generateTokens(merchant: Merchant): MerchantTokenPair {
    const secret = process.env.JWT_SECRET || 'default-secret';

    const accessToken = jwt.sign(
      {
        merchantId: merchant.id,
        email: merchant.email,
        posId: merchant.posId,
        locationId: merchant.locationId,
        merchantBrandId: merchant.merchantBrandId,
        outletId: merchant.outletId,
        type: 'merchant',
      },
      secret,
      { expiresIn: '24h' }
    );

    return { accessToken, expiresIn: 86400 };
  }

  static async getProfile(merchantId: string): Promise<Merchant> {
    const merchant = await Merchant.findByPk(merchantId, {
      include: [
        { model: MerchantBrand, as: 'merchantBrand', attributes: ['id', 'name', 'slug', 'logo'] },
        { model: Outlet, as: 'outlet', attributes: ['id', 'name', 'address'] },
      ],
    });
    if (!merchant) throw new Error('Merchant not found');
    return merchant;
  }

  static async getTransactions(
    merchantId: string,
    options: { page?: number; limit?: number; startDate?: Date; endDate?: Date } = {}
  ): Promise<{ transactions: Transaction[]; total: number; page: number; totalPages: number }> {
    const merchant = await Merchant.findByPk(merchantId);
    if (!merchant) throw new Error('Merchant not found');

    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    // Filter by merchantBrandId if available, otherwise by posId
    if (merchant.merchantBrandId) {
      where.merchantBrandId = merchant.merchantBrandId;
      where.posId = merchant.posId;
    } else {
      where.posId = merchant.posId;
    }

    if (options.startDate || options.endDate) {
      where.transactionDate = {};
      if (options.startDate) (where.transactionDate as Record<string, unknown>)[Op.gte] = options.startDate;
      if (options.endDate) (where.transactionDate as Record<string, unknown>)[Op.lte] = options.endDate;
    }

    const { rows: transactions, count: total } = await Transaction.findAndCountAll({
      where,
      include: [{ model: Member, as: 'member', attributes: ['id', 'phone', 'firstName', 'lastName'] }],
      order: [['transactionDate', 'DESC']],
      limit,
      offset,
    });

    return { transactions, total, page, totalPages: Math.ceil(total / limit) };
  }

  static async getTodayStats(merchantId: string): Promise<{
    transactionCount: number;
    totalRevenue: number;
    totalPointsIssued: number;
  }> {
    const merchant = await Merchant.findByPk(merchantId);
    if (!merchant) throw new Error('Merchant not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: Record<string, unknown> = {
      posId: merchant.posId,
      transactionDate: { [Op.gte]: today },
      status: 'processed',
    };
    if (merchant.merchantBrandId) where.merchantBrandId = merchant.merchantBrandId;

    const transactions = await Transaction.findAll({ where });

    return {
      transactionCount: transactions.length,
      totalRevenue: transactions.reduce((sum, t) => sum + Number(t.total), 0),
      totalPointsIssued: transactions.reduce((sum, t) => sum + t.pointsEarned, 0),
    };
  }

  static async createMerchant(data: {
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
  }): Promise<Merchant> {
    const existing = await Merchant.findOne({
      where: { [Op.or]: [{ email: data.email }, { posId: data.posId }] },
    });
    if (existing) throw new Error('Merchant with this email or POS ID already exists');
    return Merchant.create(data);
  }

  static async getAllMerchants(merchantBrandId?: string): Promise<Merchant[]> {
    const where: Record<string, unknown> = {};
    if (merchantBrandId) where.merchantBrandId = merchantBrandId;
    return Merchant.findAll({ where, order: [['createdAt', 'DESC']] });
  }

  static async updateMerchant(merchantId: string, data: Partial<Merchant>): Promise<Merchant> {
    const merchant = await Merchant.findByPk(merchantId);
    if (!merchant) throw new Error('Merchant not found');
    await merchant.update(data);
    return merchant;
  }

  static async deleteMerchant(merchantId: string): Promise<void> {
    const merchant = await Merchant.findByPk(merchantId);
    if (!merchant) throw new Error('Merchant not found');
    await merchant.update({ isActive: false });
  }

  static async lookupMember(phone: string, merchantBrandId?: string): Promise<{
    id: string;
    phone: string;
    firstName?: string;
    lastName?: string;
    availablePoints: number;
  }> {
    const member = await Member.findOne({
      where: { phone },
      attributes: ['id', 'phone', 'firstName', 'lastName', 'availablePoints'],
    });

    if (!member) throw new Error('Member not found');

    let availablePoints = member.availablePoints;
    if (merchantBrandId) {
      const mm = await MerchantMember.findOne({
        where: { memberId: member.id, merchantBrandId, isActive: true },
      });
      if (mm) availablePoints = mm.availablePoints;
    }

    return {
      id: member.id,
      phone: member.phone,
      firstName: member.firstName,
      lastName: member.lastName,
      availablePoints,
    };
  }
}
