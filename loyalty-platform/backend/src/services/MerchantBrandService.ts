import { MerchantBrand, Outlet, MerchantMember, Merchant } from '../models';
import { Op } from 'sequelize';

export class MerchantBrandService {
  static async create(data: {
    name: string;
    slug: string;
    logo?: string;
    description?: string;
    contactEmail?: string;
    contactPhone?: string;
    address?: string;
  }): Promise<MerchantBrand> {
    const existing = await MerchantBrand.findOne({ where: { slug: data.slug } });
    if (existing) {
      throw new Error('A merchant brand with this slug already exists');
    }
    return MerchantBrand.create(data);
  }

  static async getById(id: string): Promise<MerchantBrand> {
    const brand = await MerchantBrand.findByPk(id);
    if (!brand) throw new Error('Merchant brand not found');
    return brand;
  }

  static async getBySlug(slug: string): Promise<MerchantBrand> {
    const brand = await MerchantBrand.findOne({ where: { slug } });
    if (!brand) throw new Error('Merchant brand not found');
    return brand;
  }

  static async getAll(options: { page?: number; limit?: number; search?: string } = {}): Promise<{
    brands: MerchantBrand[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const offset = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (options.search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${options.search}%` } },
        { slug: { [Op.iLike]: `%${options.search}%` } },
      ];
    }

    const { rows: brands, count: total } = await MerchantBrand.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    return { brands, total, page, totalPages: Math.ceil(total / limit) };
  }

  static async update(id: string, data: Partial<MerchantBrand>): Promise<MerchantBrand> {
    const brand = await MerchantBrand.findByPk(id);
    if (!brand) throw new Error('Merchant brand not found');
    await brand.update(data);
    return brand;
  }

  static async deactivate(id: string): Promise<void> {
    const brand = await MerchantBrand.findByPk(id);
    if (!brand) throw new Error('Merchant brand not found');
    await brand.update({ isActive: false });
  }

  static async getPublicList(): Promise<MerchantBrand[]> {
    return MerchantBrand.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'slug', 'logo', 'description'],
      order: [['name', 'ASC']],
    });
  }

  static async getStats(brandId: string): Promise<{
    outletCount: number;
    memberCount: number;
    operatorCount: number;
  }> {
    const [outletCount, memberCount, operatorCount] = await Promise.all([
      Outlet.count({ where: { merchantBrandId: brandId, isActive: true } }),
      MerchantMember.count({ where: { merchantBrandId: brandId, isActive: true } }),
      Merchant.count({ where: { merchantBrandId: brandId, isActive: true } }),
    ]);
    return { outletCount, memberCount, operatorCount };
  }
}
