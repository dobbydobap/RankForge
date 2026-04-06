import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WsAdapter } from '@nestjs/platform-ws';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('API_PORT', 4000);

  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: configService.get<string>('CORS_ORIGIN', 'http://localhost:3000'),
    credentials: true,
  });

  // WebSocket adapter (raw ws, not Socket.IO — faster)
  app.useWebSocketAdapter(new WsAdapter(app));

  await app.listen(port);
  console.log(`RankForge API running on http://localhost:${port}`);
  console.log(`WebSocket available at ws://localhost:${port}/ws`);
}
bootstrap();
