import { Router } from 'express';
import { body } from 'express-validator';
import { MemberController } from '../controllers/MemberController';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/me', MemberController.getProfile);

router.put(
  '/me',
  validate([
    body('firstName').optional().isString().trim(),
    body('lastName').optional().isString().trim(),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('dateOfBirth').optional().isISO8601().withMessage('Invalid date format'),
    body('gender').optional().isIn(['male', 'female', 'other']),
  ]),
  MemberController.updateProfile
);

router.get('/me/points', MemberController.getPointsHistory);

router.get('/me/tier', MemberController.getTierProgress);

router.get('/me/vouchers', MemberController.getVouchers);

export default router;
