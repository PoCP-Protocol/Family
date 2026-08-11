import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

loadEnv({ path: resolve(__dirname, '../../../.env') });

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });
  app.enableCors({
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Actor-Id', 'X-Correlation-Id', 'X-Source', 'Idempotency-Key', 'Authorization'],
  });
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`[family-api] listening on :${port}`);
}

void bootstrap();
