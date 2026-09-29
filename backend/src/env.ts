import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'Потрібен DATABASE_URL'),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const env = envSchema.parse(process.env);
export const isProduction = env.NODE_ENV === 'production';
