import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import { pinoHttp } from 'pino-http';
import { corsOrigins } from './config/env.js';
import { logger } from './lib/http.js';
import { attachUser, csrfGuard, errorHandler, notFound } from './middleware/core.js';
import { api } from './routes/index.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // behind Nginx

  app.use(helmet());
  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(mongoSanitize({ replaceWith: '_' })); // strips $ and . operators → NoSQL injection guard
  if (process.env.NODE_ENV !== 'test') app.use(pinoHttp({ logger }));

  app.use(attachUser);
  app.use(csrfGuard);
  app.use('/api', api);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
