import 'reflect-metadata';
// TypeORM carga el driver de Postgres con un require() dinámico, invisible para el tracer
// de Vercel (@vercel/nft) -> sin esto, `pg` queda fuera del bundle de la función serverless
// y arranca con DriverPackageNotInstalledError. Este import de lado-efecto lo fuerza dentro.
import 'pg';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from './app.module';
import { origenesPermitidos } from './common/frontend.util';

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

  app.enableCors({ origin: origenesPermitidos(process.env.FRONTEND_URL) });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  await app.init();
  return expressApp;
}
