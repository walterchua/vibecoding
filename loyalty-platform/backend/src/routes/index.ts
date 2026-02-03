import { Router } from 'express';
import authRoutes from './auth';
import memberRoutes from './members';
import voucherRoutes from './vouchers';
import qrRoutes from './qr';
import transactionRoutes from './transactions';
import adminRoutes from './admin';

const router = Router();

router.use('/auth', authRoutes);
router.use('/members', memberRoutes);
router.use('/vouchers', voucherRoutes);
router.use('/qr', qrRoutes);
router.use('/transactions', transactionRoutes);
router.use('/admin', adminRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
