import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { envs } from 'src/config';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor() {
    this.client = new Redis(envs.redis.url, {
      retryStrategy: (times) => {
        if (times > envs.redis.maxRetries) {
          this.logger.error(`Failed to connect to Redis after ${envs.redis.maxRetries} retries`);
          return null;
        }
        this.logger.warn(`Retrying Redis connection (attempt ${times}/${envs.redis.maxRetries})...`);
        return Math.min(times * 200, 2000);
      },
      maxRetriesPerRequest: envs.redis.maxRetries,
    });

    this.client.on('connect', () => this.logger.log('Connected to Redis'));

    this.client.on('error', (err) => this.logger.error(`Redis error: ${err.message}`));
  }

  async onModuleDestroy() {
    await this.client.quit();
    this.logger.log('Disconnected from Redis');
  }

  async blacklistToken(jti: string, ttlSeconds: number): Promise<void> {
    const key = `jwt:blacklist:${jti}`;
    await this.client.setex(key, ttlSeconds, 'revoked');
    this.logger.debug(`Token ${jti} blacklisted for ${ttlSeconds}s`);
  }

  async isTokenBlacklisted(jti: string): Promise<boolean> {
    const key = `jwt:blacklist:${jti}`;
    const result = await this.client.exists(key);
    return result === 1;
  }
}
