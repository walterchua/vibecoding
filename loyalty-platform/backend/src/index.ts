import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { syncDatabase, Tier, MerchantBrand, Outlet, AdminUser, Merchant, Member, MerchantMember } from './models';
import { SettingsService } from './services/SettingsService';
import routes from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api', limiter);

// Routes
app.use('/api', routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    await connectDatabase();

    // Sync database (in production, use migrations instead)
    if (process.env.NODE_ENV === 'development') {
      await syncDatabase(false);

      // Drop legacy unique constraints that conflict with new composite ones
      const { sequelize: sq } = require('./models');
      const legacyConstraints = [
        { table: 'settings', constraint: 'settings_category_key' },
        { table: 'tiers', constraint: 'tiers_code' },
        { table: 'vouchers', constraint: 'vouchers_code' },
      ];
      for (const { table, constraint } of legacyConstraints) {
        try {
          await sq.query(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${constraint}"`);
        } catch (e) {
          // Constraint may not exist
        }
        // Also drop legacy unique indexes
        try {
          await sq.query(`DROP INDEX IF EXISTS "${constraint}"`);
        } catch (e) {
          // Index may not exist
        }
      }

      // Seed default merchant brand if none exist
      const brandCount = await MerchantBrand.count();
      let defaultBrand: MerchantBrand;

      if (brandCount === 0) {
        defaultBrand = await MerchantBrand.create({
          name: 'Default Brand',
          slug: 'default',
          description: 'Default merchant brand for existing data',
          contactEmail: 'admin@loyalty.com',
        });
        console.log('Default merchant brand created');

        // Create a second sample brand for dev testing
        const sampleBrand = await MerchantBrand.create({
          name: 'Coffee House',
          slug: 'coffee-house',
          description: 'Premium coffee chain',
          contactEmail: 'admin@coffeehouse.com',
        });
        console.log('Sample merchant brand created');

        // Create outlets for default brand
        const defaultOutlet = await Outlet.create({
          merchantBrandId: defaultBrand.id,
          name: 'Main Store',
          locationId: 'LOC-001',
          address: '123 Main Street',
        });

        // Create outlets for sample brand
        const sampleOutlet1 = await Outlet.create({
          merchantBrandId: sampleBrand.id,
          name: 'Downtown Branch',
          locationId: 'CH-001',
          address: '456 Coffee Ave',
        });

        const sampleOutlet2 = await Outlet.create({
          merchantBrandId: sampleBrand.id,
          name: 'Mall Branch',
          locationId: 'CH-002',
          address: '789 Mall Road',
        });

        console.log('Outlets created');

        // Create super admin
        await AdminUser.create({
          email: 'admin@loyalty.com',
          password: 'admin123',
          firstName: 'Super',
          lastName: 'Admin',
          role: 'super_admin',
        });
        console.log('Super admin created (admin@loyalty.com / admin123)');

        // Create merchant admin for default brand
        await AdminUser.create({
          merchantBrandId: defaultBrand.id,
          email: 'merchant@default.com',
          password: 'merchant123',
          firstName: 'Default',
          lastName: 'Admin',
          role: 'merchant_admin',
        });

        // Create merchant admin for coffee house
        await AdminUser.create({
          merchantBrandId: sampleBrand.id,
          email: 'admin@coffeehouse.com',
          password: 'merchant123',
          firstName: 'Coffee',
          lastName: 'Admin',
          role: 'merchant_admin',
        });
        console.log('Merchant admins created');

        // Backfill existing merchants with default brand
        await Merchant.update(
          { merchantBrandId: defaultBrand.id, outletId: defaultOutlet.id },
          { where: { merchantBrandId: null } }
        );

        // Backfill existing data with default brand
        const modelsToBackfill = [
          'tiers', 'vouchers', 'campaigns', 'transactions',
          'points_transactions', 'member_vouchers', 'settings', 'qr_codes',
        ];
        const { sequelize } = require('./models');
        for (const table of modelsToBackfill) {
          try {
            await sequelize.query(
              `UPDATE "${table}" SET "merchantBrandId" = :brandId WHERE "merchantBrandId" IS NULL`,
              { replacements: { brandId: defaultBrand.id } }
            );
          } catch (e) {
            // Table might not have data yet
          }
        }
        console.log('Existing data backfilled with default brand');

        // Create MerchantMember records from existing members
        const members = await Member.findAll();
        for (const member of members) {
          await MerchantMember.findOrCreate({
            where: { memberId: member.id, merchantBrandId: defaultBrand.id },
            defaults: {
              memberId: member.id,
              merchantBrandId: defaultBrand.id,
              tierId: member.tierId,
              totalPoints: member.totalPoints,
              availablePoints: member.availablePoints,
              lifetimePoints: member.lifetimePoints,
              joinedAt: member.createdAt,
            },
          });
        }
        if (members.length > 0) {
          console.log(`Created MerchantMember records for ${members.length} existing members`);
        }
      } else {
        defaultBrand = (await MerchantBrand.findOne({ where: { slug: 'default' } }))!;
      }

      // Seed default tiers if they don't exist
      const tierCount = await Tier.count();
      if (tierCount === 0) {
        await Tier.bulkCreate([
          {
            name: 'Bronze',
            code: 'BRONZE',
            minPoints: 0,
            maxPoints: 499,
            pointsMultiplier: 1.0,
            color: '#CD7F32',
            benefits: { freeDelivery: false, birthdayBonus: 50 },
            sortOrder: 1,
            merchantBrandId: defaultBrand.id,
          },
          {
            name: 'Silver',
            code: 'SILVER',
            minPoints: 500,
            maxPoints: 1999,
            pointsMultiplier: 1.25,
            color: '#C0C0C0',
            benefits: { freeDelivery: false, birthdayBonus: 100, prioritySupport: true },
            sortOrder: 2,
            merchantBrandId: defaultBrand.id,
          },
          {
            name: 'Gold',
            code: 'GOLD',
            minPoints: 2000,
            maxPoints: 4999,
            pointsMultiplier: 1.5,
            color: '#FFD700',
            benefits: { freeDelivery: true, birthdayBonus: 200, prioritySupport: true, exclusiveOffers: true },
            sortOrder: 3,
            merchantBrandId: defaultBrand.id,
          },
          {
            name: 'Platinum',
            code: 'PLATINUM',
            minPoints: 5000,
            maxPoints: 999999,
            pointsMultiplier: 2.0,
            color: '#E5E4E2',
            benefits: { freeDelivery: true, birthdayBonus: 500, prioritySupport: true, exclusiveOffers: true, vipAccess: true },
            sortOrder: 4,
            merchantBrandId: defaultBrand.id,
          },
        ]);
        console.log('Default tiers created');
      }

      // Seed default settings if they don't exist
      await SettingsService.seedDefaults();
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
