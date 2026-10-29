import http from 'node:http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import { env, corsOrigins } from './config/env.js';
import { logger } from './lib/http.js';
import { createApp } from './app.js';
import { simulateSnapshot } from './services/index.js';

async function main() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  logger.info('MongoDB connected');

  const server = http.createServer(createApp());

  // Real-time EMS channel. Emits labelled demo data until IoT ingestion publishes real readings.
  const io = new Server(server, { cors: { origin: corsOrigins, credentials: true } });
  const ems = io.of('/ems');
  setInterval(() => ems.emit('snapshot', simulateSnapshot()), 5000).unref();

  server.listen(env.API_PORT, () => logger.info(`API listening on :${env.API_PORT}`));

  const shutdown = async () => {
    logger.info('Shutting down');
    io.close();
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  logger.fatal({ err }, 'Failed to start');
  process.exit(1);
});
