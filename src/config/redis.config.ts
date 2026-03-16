import { envs } from './envs.config';

export const redisConfig = {
  host: envs.redis.host,
  port: envs.redis.port,
  password: envs.redis.password,
  db: envs.redis.db,
  maxRetries: envs.redis.maxRetries,
  retryStrategy: (times: number) => {
    if (times > envs.redis.maxRetries) {
      return null;
    }
    return Math.min(times * 200, 2000);
  },
};
