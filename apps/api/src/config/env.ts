import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().default(4000),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/techexpert_energy'),
  REDIS_URL: z.string().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars').default('dev-only-secret-change-me-0123456789abcdef'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  COOKIE_DOMAIN: z.string().optional(),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default('TechExpert Energy <no-reply@techexpertenergy.com>'),
  SALES_NOTIFY_EMAIL: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}
export const env = parsed.data;

if (env.NODE_ENV === 'production' && env.JWT_SECRET.startsWith('dev-only')) {
  console.error('Refusing to start: set a real JWT_SECRET in production.');
  process.exit(1);
}

export const isProd = env.NODE_ENV === 'production';
export const corsOrigins = env.CORS_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean);
