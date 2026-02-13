import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Member, Merchant, AdminUser } from '../models';

interface JwtPayload {
  memberId: string;
  phone: string;
  iat: number;
  exp: number;
}

interface MerchantJwtPayload {
  merchantId: string;
  email: string;
  posId: string;
  locationId: string;
  merchantBrandId?: string;
  outletId?: string;
  type: string;
  iat: number;
  exp: number;
}

interface AdminJwtPayload {
  adminUserId: string;
  email: string;
  role: 'super_admin' | 'merchant_admin' | 'merchant_staff';
  merchantBrandId: string | null;
  type: 'admin';
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      member?: Member;
      memberId?: string;
      merchant?: Merchant;
      merchantId?: string;
      posId?: string;
      locationId?: string;
      // Admin fields
      adminUser?: AdminUser;
      adminUserId?: string;
      adminRole?: 'super_admin' | 'merchant_admin' | 'merchant_staff';
      adminMerchantBrandId?: string;
      // Common multi-tenant field
      merchantBrandId?: string;
      outletId?: string;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'default-secret';

    const decoded = jwt.verify(token, secret) as JwtPayload;

    const member = await Member.findByPk(decoded.memberId);

    if (!member || !member.isActive) {
      res.status(401).json({ error: 'Invalid or inactive member' });
      return;
    }

    req.member = member;
    req.memberId = decoded.memberId;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    res.status(500).json({ error: 'Authentication failed' });
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'default-secret';

    const decoded = jwt.verify(token, secret) as JwtPayload;
    const member = await Member.findByPk(decoded.memberId);

    if (member && member.isActive) {
      req.member = member;
      req.memberId = decoded.memberId;
    }

    next();
  } catch {
    next();
  }
};

// Admin authentication - using API key for POS systems
export const authenticatePOS = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      res.status(401).json({ error: 'API key required' });
      return;
    }

    // In production, validate against stored API keys
    const validApiKeys = (process.env.POS_API_KEYS || '').split(',');

    if (!validApiKeys.includes(apiKey)) {
      res.status(401).json({ error: 'Invalid API key' });
      return;
    }

    next();
  } catch {
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Merchant authentication
export const authenticateMerchant = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'default-secret';

    const decoded = jwt.verify(token, secret) as MerchantJwtPayload;

    if (decoded.type !== 'merchant') {
      res.status(401).json({ error: 'Invalid merchant token' });
      return;
    }

    const merchant = await Merchant.findByPk(decoded.merchantId);

    if (!merchant || !merchant.isActive) {
      res.status(401).json({ error: 'Invalid or inactive merchant' });
      return;
    }

    req.merchant = merchant;
    req.merchantId = decoded.merchantId;
    req.posId = decoded.posId;
    req.locationId = decoded.locationId;
    req.merchantBrandId = decoded.merchantBrandId || merchant.merchantBrandId;
    req.outletId = decoded.outletId || merchant.outletId;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Admin portal JWT authentication
export const authenticateAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_ADMIN_SECRET || 'admin-jwt-secret';

    const decoded = jwt.verify(token, secret) as AdminJwtPayload;

    if (decoded.type !== 'admin') {
      res.status(401).json({ error: 'Invalid admin token' });
      return;
    }

    const adminUser = await AdminUser.findByPk(decoded.adminUserId);

    if (!adminUser || !adminUser.isActive) {
      res.status(401).json({ error: 'Invalid or inactive admin user' });
      return;
    }

    req.adminUser = adminUser;
    req.adminUserId = decoded.adminUserId;
    req.adminRole = decoded.role;
    req.adminMerchantBrandId = decoded.merchantBrandId || undefined;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Require super admin role
export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.adminRole !== 'super_admin') {
    res.status(403).json({ error: 'Super admin access required' });
    return;
  }
  next();
};

// Require merchant admin or super admin
export const requireMerchantAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.adminRole !== 'super_admin' && req.adminRole !== 'merchant_admin') {
    res.status(403).json({ error: 'Merchant admin access required' });
    return;
  }
  next();
};

// Scope to merchant brand - ensures merchantBrandId is set on request
// Super admins can specify via X-Merchant-Brand-Id header; merchant users use their own
export const scopeToMerchantBrand = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.adminRole === 'super_admin') {
    const headerBrandId = req.headers['x-merchant-brand-id'] as string;
    if (headerBrandId) {
      req.merchantBrandId = headerBrandId;
    }
    // Super admins can proceed without a specific brand (sees all data)
    next();
    return;
  }

  if (req.adminMerchantBrandId) {
    req.merchantBrandId = req.adminMerchantBrandId;
    next();
    return;
  }

  res.status(403).json({ error: 'No merchant brand context available' });
};
