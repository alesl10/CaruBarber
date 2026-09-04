import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from './app.module';

/**
 * Arranca Nest sobre un Express "plano" y devuelve ese Express para que lo consuma
 * el handler serverless de Vercel (backend/api/index.ts). Se llama una sola vez por
 * instancia de función (cold start) y se cachea.
 */
export async function bootstrapServer() {
  const expressApp = express();

  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    logger: ['error', 'warn', 'log'],
  });

  const frontendUrl = process.env.FRONTEND_URL;
  app.enableCors({ origin: frontendUrl ? frontendUrl.split(',') : true });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  await app.init();
  return expressApp;
}
