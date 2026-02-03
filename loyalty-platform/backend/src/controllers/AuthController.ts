import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';

export class AuthController {
  static async sendOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone } = req.body;
      const result = await AuthService.sendOTP(phone);
      res.json({
        message: 'OTP sent successfully',
        otpId: result.otpId,
        expiresAt: result.expiresAt,
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyOTP(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone, code } = req.body;
      const result = await AuthService.verifyOTP(phone, code);

      if (result.isNewMember) {
        res.json({
          isNewMember: true,
          message: 'OTP verified. Please complete registration.',
        });
      } else {
        res.json({
          isNewMember: false,
          member: {
            id: result.member!.id,
            phone: result.member!.phone,
            firstName: result.member!.firstName,
            lastName: result.member!.lastName,
          },
          tokens: result.tokens,
        });
      }
    } catch (error) {
      next(error);
    }
  }

  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { phone, firstName, lastName, email, dateOfBirth, gender } = req.body;
      const result = await AuthService.register(phone, {
        firstName,
        lastName,
        email,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
      });

      res.status(201).json({
        message: 'Registration successful',
        member: {
          id: result.member.id,
          phone: result.member.phone,
          firstName: result.member.firstName,
          lastName: result.member.lastName,
        },
        tokens: result.tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      const tokens = await AuthService.refreshTokens(refreshToken);
      res.json({ tokens });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = req.memberId!;
      const { refreshToken } = req.body;
      await AuthService.logout(memberId, refreshToken);
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }
}
