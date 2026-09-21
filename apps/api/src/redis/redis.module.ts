import { Global, Logger, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const JUDGE_QUEUE = 'judge';
export const LEADERBOARD_QUEUE = 'leaderboard';

const logger = new Logger('RedisModule');

// Upstash (and most managed Redis) only accept TLS connections; a non-TLS
// attempt is reset immediately, which shows up as an ECONNRESET retry storm.
const needsTls = (host: string, protocol?: string) =>
  protocol === 'rediss:' || host.endsWith('.upstash.io');

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');

        let host: string;
        let port: number;
        let password: string | undefined;
        let tls: boolean;

        if (redisUrl) {
          const url = new URL(redisUrl);
          if (url.protocol === 'http:' || url.protocol === 'https:') {
            // Almost certainly the Upstash REST endpoint; ioredis can't use it.
            logger.error(
              `REDIS_URL uses ${url.protocol}// — that is the REST endpoint. ` +
                `Use the "rediss://default:<password>@<host>:<port>" URL from the Upstash console.`,
            );
          }
          host = url.hostname;
          port = parseInt(url.port, 10) || 6379;
          password = url.password || undefined;
          tls = needsTls(host, url.protocol);
        } else {
          host = configService.get<string>('REDIS_HOST', 'localhost');
          port = configService.get<number>('REDIS_PORT', 6379);
          password = configService.get<string>('REDIS_PASSWORD') || undefined;
          tls = needsTls(host);
        }

        // No password in this line — it exists so a failed deploy log answers
        // "what was it connecting to?" without guesswork.
        logger.log(`Redis target: ${host}:${port} tls=${tls}`);

        return {
          connection: {
            host,
            port,
            password,
            tls: tls ? {} : undefined,
            maxRetriesPerRequest: null,
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: JUDGE_QUEUE },
      { name: LEADERBOARD_QUEUE },
    ),
  ],
  exports: [BullModule],
})
export class RedisModule {}
