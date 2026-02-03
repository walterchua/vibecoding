import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Member } from '../models';

interface JwtPayload {
  memberId: string;
  phone: string;
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      member?: Member;
      memberId?: string;
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
