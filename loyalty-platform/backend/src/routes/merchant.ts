import { Router } from 'express';
import { body } from 'express-validator';
import { MerchantController } from '../controllers/MerchantController';
import { validate } from '../middleware/validation';
import { authenticateMerchant } from '../middleware/auth';

const router = Router();

// Public routes
router.post(
  '/login',
  validate([
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ]),
  MerchantController.login
);

// Protected routes
router.use(authenticateMerchant);

router.get('/profile', MerchantController.getProfile);
router.get('/dashboard', MerchantController.getDashboard);
router.get('/transactions', MerchantController.getTransactions);

// QR operations
router.post(
  '/scan',
  validate([
    body('token').notEmpty().withMessage('QR token required'),
  ]),
  MerchantController.scanQR
);

router.post(
  '/consume',
  validate([
    body('token').notEmpty().withMessage('QR token required'),
  ]),
  MerchantController.consumeQR
);

// Transaction creation
router.post(
  '/transaction',
  validate([
    body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount required'),
  ]),
  MerchantController.createTransaction
);

// Member lookup
router.get('/lookup-member', MerchantController.lookupMember);

export default router;
