import { Setting } from '../models';
import { Op } from 'sequelize';

export class SettingsService {
  static async getByCategory(category: string, merchantBrandId?: string): Promise<Record<string, unknown>> {
    // Get platform-level defaults first
    const platformSettings = await Setting.findAll({
      where: { category, merchantBrandId: null },
    });

    const result: Record<string, unknown> = {};
    for (const setting of platformSettings) {
      result[setting.key] = setting.value;
    }

    // Override with merchant-specific settings if merchantBrandId provided
    if (merchantBrandId) {
      const merchantSettings = await Setting.findAll({
        where: { category, merchantBrandId },
      });
      for (const setting of merchantSettings) {
        result[setting.key] = setting.value;
      }
    }

    return result;
  }

  static async updateCategory(
    category: string,
    data: Record<string, unknown>,
    merchantBrandId?: string
  ): Promise<Record<string, unknown>> {
    for (const [key, value] of Object.entries(data)) {
      const where: Record<string, unknown> = { category, key };
      if (merchantBrandId) {
        where.merchantBrandId = merchantBrandId;
      } else {
        where.merchantBrandId = null;
      }

      const existing = await Setting.findOne({ where });
      if (existing) {
        await existing.update({ value });
      } else {
        await Setting.create({ category, key, value, merchantBrandId });
      }
    }
    return this.getByCategory(category, merchantBrandId);
  }

  static async seedDefaults(): Promise<void> {
    const count = await Setting.count({ where: { merchantBrandId: null } });
    if (count > 0) return;

    const defaults = [
      { category: 'points_config', key: 'baseEarningRate', value: 1 },
      { category: 'points_config', key: 'roundingRule', value: 'floor' },
      { category: 'points_config', key: 'enableExpiry', value: false },
      { category: 'points_config', key: 'expiryDays', value: 365 },
      { category: 'admin_branding', key: 'businessName', value: 'My Business' },
      { category: 'admin_branding', key: 'logoUrl', value: '' },
      { category: 'admin_branding', key: 'contactEmail', value: '' },
      { category: 'admin_branding', key: 'supportPhone', value: '' },
      { category: 'admin_system', key: 'maintenanceMode', value: false },
      { category: 'admin_system', key: 'registrationEnabled', value: true },
      { category: 'admin_system', key: 'otpRequired', value: true },
      { category: 'admin_display', key: 'currencySymbol', value: '$' },
      { category: 'admin_display', key: 'pointsLabel', value: 'Points' },
    ];

    await Setting.bulkCreate(defaults);
    console.log('Default settings seeded');
  }
}
