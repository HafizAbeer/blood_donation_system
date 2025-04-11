import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET', 'ADMIN_USERNAME', 'ADMIN_PASSWORD'] as const;
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const config = {
  port: process.env.PORT || '5000',
  mongoUri: process.env.MONGODB_URI as string, 
  jwtSecret: process.env.JWT_SECRET as string,
  adminUsername: process.env.ADMIN_USERNAME as string,
  adminPassword: process.env.ADMIN_PASSWORD as string,
}; 