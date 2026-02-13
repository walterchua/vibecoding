import { Router } from 'express';
import { MemberMerchantController } from '../controllers/MemberMerchantController';
import { authenticateMember } from '../middleware/auth';

const router = Router();

// All routes require member authentication
router.use(authenticateMember);

// Browse available merchants
router.get('/browse', MemberMerchantController.browseMerchants);

// My joined merchants
router.get('/', MemberMerchantController.getMyMerchants);

// Join a merchant
router.post('/:merchantBrandId/join', MemberMerchantController.joinMerchant);

// Merchant-scoped data
router.get('/:merchantBrandId', MemberMerchantController.getMerchantProfile);
router.get('/:merchantBrandId/points', MemberMerchantController.getMerchantPoints);
router.get('/:merchantBrandId/tier', MemberMerchantController.getMerchantTier);
router.get('/:merchantBrandId/vouchers', MemberMerchantController.getMerchantVouchers);
router.get('/:merchantBrandId/transactions', MemberMerchantController.getMerchantTransactions);

export default router;
