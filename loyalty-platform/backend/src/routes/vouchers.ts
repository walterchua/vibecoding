import { Router } from 'express';
import { VoucherController } from '../controllers/VoucherController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public route - list available vouchers
router.get('/', VoucherController.getAvailableVouchers);
router.get('/:id', VoucherController.getVoucherById);

// Protected routes
router.use(authenticate);

router.post('/:id/claim', VoucherController.claimVoucher);
router.get('/member/list', VoucherController.getMemberVouchers);
router.get('/member/:id', VoucherController.getMemberVoucherById);

export default router;
