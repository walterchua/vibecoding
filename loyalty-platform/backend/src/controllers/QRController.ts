import { Request, Response, NextFunction } from 'express';
import { QRService } from '../services/QRService';

export class QRController {
  static async generatePointsQR(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = req.memberId!;
      const { points } = req.body;

      if (!points || points <= 0) {
        res.status(400).json({ error: 'Invalid points amount' });
        return;
      }

      const result = await QRService.generatePointsQR(memberId, points);
      res.json({
        qrCode: {
          id: result.qrCode.id,
          type: 'points',
          points,
          token: result.qrCode.token,
          expiresAt: result.expiresAt,
        },
        qrImage: result.qrImage,
      });
    } catch (error) {
      next(error);
    }
  }

  static async generateVoucherQR(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = req.memberId!;
      const { memberVoucherId } = req.body;

      if (!memberVoucherId) {
        res.status(400).json({ error: 'Member voucher ID required' });
        return;
      }

      const result = await QRService.generateVoucherQR(memberId, memberVoucherId);
      res.json({
        qrCode: {
          id: result.qrCode.id,
          type: 'voucher',
          memberVoucherId,
          token: result.qrCode.token,
          expiresAt: result.expiresAt,
        },
        qrImage: result.qrImage,
      });
    } catch (error) {
      next(error);
    }
  }

  static async generateMembershipQR(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = req.memberId!;
      const result = await QRService.generateMembershipQR(memberId);
      res.json({
        qrCode: {
          id: result.qrCode.id,
          type: 'membership',
          token: result.qrCode.token,
          expiresAt: result.expiresAt,
        },
        qrImage: result.qrImage,
      });
    } catch (error) {
      next(error);
    }
  }

  // POS endpoints
  static async validateQR(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({ error: 'QR token required' });
        return;
      }

      const result = await QRService.validateQR(token);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async consumeQR(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, posId, locationName } = req.body;

      if (!token || !posId) {
        res.status(400).json({ error: 'QR token and POS ID required' });
        return;
      }

      const result = await QRService.consumeQR(token, posId, locationName);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
