import { Outlet, Merchant } from '../models';

export class OutletService {
  static async create(data: {
    merchantBrandId: string;
    name: string;
    address?: string;
    locationId?: string;
    phone?: string;
  }): Promise<Outlet> {
    return Outlet.create(data);
  }

  static async getByMerchantBrand(merchantBrandId: string): Promise<Outlet[]> {
    return Outlet.findAll({
      where: { merchantBrandId },
      order: [['name', 'ASC']],
    });
  }

  static async getById(id: string): Promise<Outlet> {
    const outlet = await Outlet.findByPk(id);
    if (!outlet) throw new Error('Outlet not found');
    return outlet;
  }

  static async update(id: string, data: Partial<Outlet>): Promise<Outlet> {
    const outlet = await Outlet.findByPk(id);
    if (!outlet) throw new Error('Outlet not found');
    await outlet.update(data);
    return outlet;
  }

  static async deactivate(id: string): Promise<void> {
    const outlet = await Outlet.findByPk(id);
    if (!outlet) throw new Error('Outlet not found');
    await outlet.update({ isActive: false });
  }

  static async getStaffCount(outletId: string): Promise<number> {
    return Merchant.count({ where: { outletId, isActive: true } });
  }
}
