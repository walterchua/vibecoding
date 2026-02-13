import { Router } from 'express';
import authRoutes from './auth';
import memberRoutes from './members';
import voucherRoutes from './vouchers';
import qrRoutes from './qr';
import transactionRoutes from './transactions';
import adminRoutes from './admin';
import merchantRoutes from './merchant';
import memberMerchantRoutes from './memberMerchants';

const router = Router();

router.use('/auth', authRoutes);
router.use('/members', memberRoutes);
router.use('/vouchers', voucherRoutes);
router.use('/qr', qrRoutes);
router.use('/transactions', transactionRoutes);
router.use('/admin', adminRoutes);
router.use('/merchant', merchantRoutes);
router.use('/member-merchants', memberMerchantRoutes);

// Public: browse merchants (no auth required)
router.get('/merchants/public', async (req, res, next) => {
  try {
    const { MerchantBrandController } = await import('../controllers/MerchantBrandController');
    MerchantBrandController.getPublicList(req, res, next);
  } catch (error) {
    next(error);
  }
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
