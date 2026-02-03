import { Router } from 'express';
import { body } from 'express-validator';
import { TransactionController } from '../controllers/TransactionController';
import { validate } from '../middleware/validation';
import { authenticate, authenticatePOS } from '../middleware/auth';

const router = Router();

// POS route - submit transaction
router.post(
  '/',
  authenticatePOS,
  validate([
    body('externalId').notEmpty().withMessage('External ID is required'),
    body('posId').notEmpty().withMessage('POS ID is required'),
    body('items').isArray({ min: 1 }).withMessage('Items array is required'),
    body('items.*.sku').notEmpty().withMessage('Item SKU is required'),
    body('items.*.name').notEmpty().withMessage('Item name is required'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Item quantity must be positive'),
    body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Item unit price must be non-negative'),
    body('items.*.totalPrice').isFloat({ min: 0 }).withMessage('Item total price must be non-negative'),
    body('subtotal').isFloat({ min: 0 }).withMessage('Subtotal must be non-negative'),
    body('total').isFloat({ min: 0 }).withMessage('Total must be non-negative'),
  ]),
  TransactionController.submitTransaction
);

// POS route - get transaction status
router.get('/:id', authenticatePOS, TransactionController.getTransactionStatus);

// Member route - get own transactions
router.get('/member/history', authenticate, TransactionController.getMemberTransactions);

export default router;
