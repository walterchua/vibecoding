import { Request, Response, NextFunction } from 'express';
import { MemberService } from '../services/MemberService';

export class MemberController {
  static async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = req.memberId!;
      const merchantBrandId = req.query.merchantBrandId as string | undefined;
      const profile = await MemberService.getProfile(memberId, merchantBrandId);
      res.json(profile);
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = req.memberId!;
      const { firstName, lastName, email, dateOfBirth, gender } = req.body;
      const member = await MemberService.updateProfile(memberId, {
        firstName,
        lastName,
        email,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
      });
      res.json({
        message: 'Profile updated successfully',
        member: {
          id: member.id,
          phone: member.phone,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          dateOfBirth: member.dateOfBirth,
          gender: member.gender,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPointsHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = req.memberId!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const type = req.query.type as string;
      const merchantBrandId = req.query.merchantBrandId as string | undefined;

      const result = await MemberService.getPointsHistory(memberId, { page, limit, type, merchantBrandId });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getTierProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = req.memberId!;
      const merchantBrandId = req.query.merchantBrandId as string | undefined;
      const progress = await MemberService.getTierProgress(memberId, merchantBrandId);
      res.json({
        currentTier: {
          id: progress.currentTier.id,
          name: progress.currentTier.name,
          code: progress.currentTier.code,
          color: progress.currentTier.color,
          benefits: progress.currentTier.benefits,
        },
        nextTier: progress.nextTier
          ? {
              id: progress.nextTier.id,
              name: progress.nextTier.name,
              code: progress.nextTier.code,
              color: progress.nextTier.color,
              minPoints: progress.nextTier.minPoints,
            }
          : null,
        progress: progress.progress,
        pointsToNextTier: progress.pointsToNextTier,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getVouchers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = req.memberId!;
      const status = req.query.status as 'active' | 'used' | 'expired' | undefined;
      const merchantBrandId = req.query.merchantBrandId as string | undefined;
      const vouchers = await MemberService.getMemberVouchers(memberId, status, merchantBrandId);
      res.json({ vouchers });
    } catch (error) {
      next(error);
    }
  }
}
