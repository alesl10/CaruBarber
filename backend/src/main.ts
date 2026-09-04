import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const frontendUrl = config.get<string>('FRONTEND_URL');
  app.enableCors({ origin: frontendUrl ? frontendUrl.split(',') : true });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  const port = config.get<number>('PORT', 3001);
  await app.listen(port);
  console.log(`Backend Nest corriendo en http://localhost:${port}`);
}

bootstrap();
