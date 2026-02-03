import { Router } from 'express';
import { body } from 'express-validator';
import { AdminController } from '../controllers/AdminController';
import { validate } from '../middleware/validation';

const router = Router();

// Note: In production, add admin authentication middleware
// For now, using API key authentication similar to POS

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

// Transactions
router.get('/transactions', AdminController.getTransactions);

// Reports
router.get('/reports/revenue', AdminController.getRevenueReport);
router.get('/reports/members', AdminController.getMemberReport);

export default router;
