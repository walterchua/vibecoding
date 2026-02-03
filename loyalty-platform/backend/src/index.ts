import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { syncDatabase, Tier } from './models';
import routes from './routes';
import { errorHandler, notFound } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api', limiter);

// Routes
app.use('/api', routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    await connectDatabase();

    // Sync database (in production, use migrations instead)
    if (process.env.NODE_ENV === 'development') {
      await syncDatabase(false);

      // Seed default tiers if they don't exist
      const tierCount = await Tier.count();
      if (tierCount === 0) {
        await Tier.bulkCreate([
          {
            name: 'Bronze',
            code: 'BRONZE',
            minPoints: 0,
            maxPoints: 499,
            pointsMultiplier: 1.0,
            color: '#CD7F32',
            benefits: { freeDelivery: false, birthdayBonus: 50 },
            sortOrder: 1,
          },
          {
            name: 'Silver',
            code: 'SILVER',
            minPoints: 500,
            maxPoints: 1999,
            pointsMultiplier: 1.25,
            color: '#C0C0C0',
            benefits: { freeDelivery: false, birthdayBonus: 100, prioritySupport: true },
            sortOrder: 2,
          },
          {
            name: 'Gold',
            code: 'GOLD',
            minPoints: 2000,
            maxPoints: 4999,
            pointsMultiplier: 1.5,
            color: '#FFD700',
            benefits: { freeDelivery: true, birthdayBonus: 200, prioritySupport: true, exclusiveOffers: true },
            sortOrder: 3,
          },
          {
            name: 'Platinum',
            code: 'PLATINUM',
            minPoints: 5000,
            maxPoints: 999999,
            pointsMultiplier: 2.0,
            color: '#E5E4E2',
            benefits: { freeDelivery: true, birthdayBonus: 500, prioritySupport: true, exclusiveOffers: true, vipAccess: true },
            sortOrder: 4,
          },
        ]);
        console.log('Default tiers created');
      }
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
