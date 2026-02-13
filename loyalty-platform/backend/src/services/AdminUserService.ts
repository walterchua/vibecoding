import { AdminUser, MerchantBrand } from '../models';
import { Op } from 'sequelize';

export class AdminUserService {
  static async create(data: {
    merchantBrandId?: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'super_admin' | 'merchant_admin' | 'merchant_staff';
    permissions?: object;
  }): Promise<AdminUser> {
    const existing = await AdminUser.findOne({ where: { email: data.email } });
    if (existing) {
      throw new Error('An admin user with this email already exists');
    }
    return AdminUser.create(data);
  }

  static async getById(id: string): Promise<AdminUser> {
    const user = await AdminUser.findByPk(id, {
      include: [{ model: MerchantBrand, as: 'merchantBrand', attributes: ['id', 'name', 'slug', 'logo'] }],
    });
    if (!user) throw new Error('Admin user not found');
    return user;
  }

  static async getByMerchantBrand(merchantBrandId: string): Promise<AdminUser[]> {
    return AdminUser.findAll({
      where: { merchantBrandId },
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });
  }

  static async getAll(options: { page?: number; limit?: number } = {}): Promise<{
    users: AdminUser[];
    total: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const offset = (page - 1) * limit;

    const { rows: users, count: total } = await AdminUser.findAndCountAll({
      attributes: { exclude: ['password'] },
      include: [{ model: MerchantBrand, as: 'merchantBrand', attributes: ['id', 'name', 'slug'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return { users, total };
  }

  static async update(id: string, data: Partial<AdminUser>): Promise<AdminUser> {
    const user = await AdminUser.findByPk(id);
    if (!user) throw new Error('Admin user not found');
    await user.update(data);
    return user;
  }

  static async deactivate(id: string): Promise<void> {
    const user = await AdminUser.findByPk(id);
    if (!user) throw new Error('Admin user not found');
    await user.update({ isActive: false });
  }
}
