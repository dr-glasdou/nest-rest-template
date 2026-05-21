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

  async ping(): Promise<string> {
    return await this.client.ping();
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const raw = JSON.stringify(value);
    await this.set(key, raw, ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }
}
