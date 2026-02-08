import { Setting } from '../models';

export class SettingsService {
  static async getByCategory(category: string): Promise<Record<string, unknown>> {
    const settings = await Setting.findAll({ where: { category } });
    const result: Record<string, unknown> = {};
    for (const setting of settings) {
      result[setting.key] = setting.value;
    }
    return result;
  }

  static async updateCategory(
    category: string,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    for (const [key, value] of Object.entries(data)) {
      await Setting.upsert({ category, key, value });
    }
    return this.getByCategory(category);
  }

  static async seedDefaults(): Promise<void> {
    const count = await Setting.count();
    if (count > 0) return;

    const defaults = [
      // Points configuration
      { category: 'points_config', key: 'baseEarningRate', value: 1 },
      { category: 'points_config', key: 'roundingRule', value: 'floor' },
      { category: 'points_config', key: 'enableExpiry', value: false },
      { category: 'points_config', key: 'expiryDays', value: 365 },

      // Admin branding
      { category: 'admin_branding', key: 'businessName', value: 'My Business' },
      { category: 'admin_branding', key: 'logoUrl', value: '' },
      { category: 'admin_branding', key: 'contactEmail', value: '' },
      { category: 'admin_branding', key: 'supportPhone', value: '' },

      // Admin system
      { category: 'admin_system', key: 'maintenanceMode', value: false },
      { category: 'admin_system', key: 'registrationEnabled', value: true },
      { category: 'admin_system', key: 'otpRequired', value: true },

      // Admin display
      { category: 'admin_display', key: 'currencySymbol', value: '$' },
      { category: 'admin_display', key: 'pointsLabel', value: 'Points' },
    ];

    await Setting.bulkCreate(defaults);
    console.log('Default settings seeded');
  }
}
