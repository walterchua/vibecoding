import { Router } from 'express';
import { body } from 'express-validator';
import { AdminController } from '../controllers/AdminController';
import { AdminAuthController } from '../controllers/AdminAuthController';
import { MerchantBrandController } from '../controllers/MerchantBrandController';
import { OutletController } from '../controllers/OutletController';
import { AdminUserController } from '../controllers/AdminUserController';
import { validate } from '../middleware/validation';
import {
  authenticateAdmin,
  requireSuperAdmin,
  requireMerchantAdmin,
  scopeToMerchantBrand,
} from '../middleware/auth';

const router = Router();

// ── Public routes ──
router.post(
  '/auth/login',
  validate([
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ]),
  AdminAuthController.login
);

// ── All routes below require admin authentication ──
router.use(authenticateAdmin);

// Admin profile
router.get('/auth/profile', AdminAuthController.getProfile);
router.put(
  '/auth/change-password',
  validate([
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ]),
  AdminAuthController.changePassword
);

// ── Super admin only routes ──

// Merchant Brands CRUD
router.get('/merchant-brands', requireSuperAdmin, MerchantBrandController.getAll);
router.get('/merchant-brands/:id', requireSuperAdmin, MerchantBrandController.getById);
router.post(
  '/merchant-brands',
  requireSuperAdmin,
  validate([
    body('name').notEmpty().withMessage('Brand name is required'),
    body('slug').notEmpty().withMessage('Brand slug is required'),
  ]),
  MerchantBrandController.create
);
router.put('/merchant-brands/:id', requireSuperAdmin, MerchantBrandController.update);
router.delete('/merchant-brands/:id', requireSuperAdmin, MerchantBrandController.deactivate);

// Platform-level settings (super admin)
router.get('/platform/settings/:category', requireSuperAdmin, async (req, res, next) => {
  // Explicitly don't scope to merchant — read platform defaults
  const { SettingsService } = await import('../services/SettingsService');
  try {
    const settings = await SettingsService.getByCategory(req.params.category);
    res.json({ settings });
  } catch (error) {
    next(error);
  }
});
router.put('/platform/settings/:category', requireSuperAdmin, async (req, res, next) => {
  const { SettingsService } = await import('../services/SettingsService');
  try {
    const settings = await SettingsService.updateCategory(req.params.category, req.body);
    res.json({ settings });
  } catch (error) {
    next(error);
  }
});

// ── Merchant admin+ routes ──

// Outlets CRUD (requires merchant admin role)
router.get('/outlets', requireMerchantAdmin, scopeToMerchantBrand, OutletController.getAll);
router.get('/outlets/:id', requireMerchantAdmin, scopeToMerchantBrand, OutletController.getById);
router.post(
  '/outlets',
  requireMerchantAdmin,
  scopeToMerchantBrand,
  validate([
    body('name').notEmpty().withMessage('Outlet name is required'),
    body('locationId').notEmpty().withMessage('Location ID is required'),
  ]),
  OutletController.create
);
router.put('/outlets/:id', requireMerchantAdmin, scopeToMerchantBrand, OutletController.update);
router.delete('/outlets/:id', requireMerchantAdmin, scopeToMerchantBrand, OutletController.deactivate);

// Admin Users CRUD (requires merchant admin role)
router.get('/admin-users', requireMerchantAdmin, scopeToMerchantBrand, AdminUserController.getAll);
router.get('/admin-users/:id', requireMerchantAdmin, scopeToMerchantBrand, AdminUserController.getById);
router.post(
  '/admin-users',
  requireMerchantAdmin,
  scopeToMerchantBrand,
  validate([
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').notEmpty().withMessage('First name required'),
    body('lastName').notEmpty().withMessage('Last name required'),
    body('role')
      .isIn(['merchant_admin', 'merchant_staff'])
      .withMessage('Invalid role'),
  ]),
  AdminUserController.create
);
router.put('/admin-users/:id', requireMerchantAdmin, scopeToMerchantBrand, AdminUserController.update);
router.delete('/admin-users/:id', requireMerchantAdmin, scopeToMerchantBrand, AdminUserController.deactivate);

// Merchant operators CRUD
router.get('/merchants', requireMerchantAdmin, scopeToMerchantBrand, AdminController.getMerchants);
router.post(
  '/merchants',
  requireMerchantAdmin,
  scopeToMerchantBrand,
  validate([
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('posId').notEmpty().withMessage('POS ID is required'),
    body('locationId').notEmpty().withMessage('Location ID is required'),
    body('locationName').notEmpty().withMessage('Location name is required'),
  ]),
  AdminController.createMerchant
);
router.put('/merchants/:id', requireMerchantAdmin, scopeToMerchantBrand, AdminController.updateMerchant);
router.delete('/merchants/:id', requireMerchantAdmin, scopeToMerchantBrand, AdminController.deleteMerchant);

// ── Data routes (all admin roles, scoped to merchant brand) ──
router.use(scopeToMerchantBrand);

// Dashboard
router.get('/dashboard', AdminController.getDashboardStats);

// Campaigns
router.get('/campaigns', AdminController.getAllCampaigns);
router.get('/campaigns/active', AdminController.getCampaigns);
router.post(
  '/campaigns',
  validate([
    body('name').notEmpty().withMessage('Campaign name is required'),
    body('type')
      .isIn(['points_earn', 'points_multiplier', 'voucher_distribution', 'tier_bonus'])
      .withMessage('Invalid campaign type'),
    body('criteria').isObject().withMessage('Criteria must be an object'),
    body('reward').isObject().withMessage('Reward must be an object'),
    body('startDate').isISO8601().withMessage('Valid start date required'),
    body('endDate').isISO8601().withMessage('Valid end date required'),
  ]),
  AdminController.createCampaign
);
router.put('/campaigns/:id', AdminController.updateCampaign);
router.delete('/campaigns/:id', AdminController.deleteCampaign);

// Members
router.get('/members', AdminController.getMembers);
router.get('/members/:id', AdminController.getMemberById);

// Vouchers
router.get('/vouchers', AdminController.getVouchers);
router.post(
  '/vouchers',
  validate([
    body('name').notEmpty().withMessage('Voucher name is required'),
    body('code').notEmpty().withMessage('Voucher code is required'),
    body('type').isIn(['percentage', 'fixed', 'freebie']).withMessage('Invalid voucher type'),
    body('value').isFloat({ min: 0 }).withMessage('Value must be non-negative'),
    body('pointsCost').isInt({ min: 0 }).withMessage('Points cost must be non-negative'),
    body('validFrom').isISO8601().withMessage('Valid start date required'),
    body('validUntil').isISO8601().withMessage('Valid end date required'),
  ]),
  AdminController.createVoucher
);
router.put('/vouchers/:id', AdminController.updateVoucher);
router.delete('/vouchers/:id', AdminController.deleteVoucher);

// Tiers
router.get('/tiers', AdminController.getTiers);
router.post(
  '/tiers',
  validate([
    body('name').notEmpty().withMessage('Tier name is required'),
    body('code').notEmpty().withMessage('Tier code is required'),
    body('minPoints').isInt({ min: 0 }).withMessage('Min points must be non-negative'),
    body('maxPoints').isInt({ min: 0 }).withMessage('Max points must be non-negative'),
  ]),
  AdminController.createTier
);
router.put('/tiers/:id', AdminController.updateTier);

// Settings
router.get('/settings/:category', AdminController.getSettings);
router.put('/settings/:category', AdminController.updateSettings);

// Transactions
router.get('/transactions', AdminController.getTransactions);

// Reports
router.get('/reports/revenue', AdminController.getRevenueReport);
router.get('/reports/members', AdminController.getMemberReport);

export default router;
