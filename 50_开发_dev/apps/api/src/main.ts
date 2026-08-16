import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });
  const corsOrigin = process.env.CORS_ORIGIN;
  if (corsOrigin) {
    app.enableCors({
      origin: corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean),
      // Family Web 使用 HttpOnly cookie；跨源本地验证必须显式允许 credentials，JS 仍不读取任何 token。
      credentials: true,
    });
  }
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`[family-api] listening on :${port}`);
}

void bootstrap();
