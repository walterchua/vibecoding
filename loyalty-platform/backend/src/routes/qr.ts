import { Router } from 'express';
import { body } from 'express-validator';
import { QRController } from '../controllers/QRController';
import { validate } from '../middleware/validation';
import { authenticate, authenticatePOS } from '../middleware/auth';

const router = Router();

// Member routes (generate QR)
router.post(
  '/generate/points',
  authenticate,
  validate([
    body('points').isInt({ min: 1 }).withMessage('Points must be a positive integer'),
  ]),
  QRController.generatePointsQR
);

router.post(
  '/generate/voucher',
  authenticate,
  validate([
    body('memberVoucherId').isUUID().withMessage('Valid member voucher ID required'),
  ]),
  QRController.generateVoucherQR
);

router.post('/generate/membership', authenticate, QRController.generateMembershipQR);

// POS routes (validate and consume QR)
router.post(
  '/validate',
  authenticatePOS,
  validate([
    body('token').notEmpty().withMessage('QR token is required'),
  ]),
  QRController.validateQR
);

router.post(
  '/consume',
  authenticatePOS,
  validate([
    body('token').notEmpty().withMessage('QR token is required'),
    body('posId').notEmpty().withMessage('POS ID is required'),
    body('locationName').optional().isString(),
  ]),
  QRController.consumeQR
);

export default router;
