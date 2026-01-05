import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || process.env.MONGODB_URI || '',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'access_secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refresh_secret',
  CLIENT_URL: process.env.CLIENT_URL || process.env.CORS_ORIGIN || 'http://localhost:5173',
};

if (!config.MONGO_URI) {
  console.warn('MONGO_URI is not defined in .env');
}
