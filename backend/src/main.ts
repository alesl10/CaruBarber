import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { origenesPermitidos } from './common/frontend.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const frontendUrl = config.get<string>('FRONTEND_URL');
  // En dev (sin FRONTEND_URL) se permite cualquier origen; con la variable seteada,
  // sólo el default de prod + lo que liste (sin barras finales).
  app.enableCors({ origin: frontendUrl ? origenesPermitidos(frontendUrl) : true });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  const port = config.get<number>('PORT', 3001);
  await app.listen(port);
  console.log(`Backend Nest corriendo en http://localhost:${port}`);
}

bootstrap();
