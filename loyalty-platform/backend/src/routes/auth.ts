import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/AuthController';
import { validate } from '../middleware/validation';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post(
  '/otp/send',
  validate([
    body('phone')
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Invalid phone number format'),
  ]),
  AuthController.sendOTP
);

router.post(
  '/otp/verify',
  validate([
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('code')
      .notEmpty()
      .withMessage('OTP code is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits'),
  ]),
  AuthController.verifyOTP
);

router.post(
  '/register',
  validate([
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('firstName').optional().isString().trim(),
    body('lastName').optional().isString().trim(),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('dateOfBirth').optional().isISO8601().withMessage('Invalid date format'),
    body('gender').optional().isIn(['male', 'female', 'other']),
  ]),
  AuthController.register
);

router.post(
  '/refresh',
  validate([
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  ]),
  AuthController.refreshToken
);

router.post('/logout', authenticate, AuthController.logout);

export default router;
