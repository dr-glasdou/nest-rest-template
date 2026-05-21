import 'dotenv/config';
import joi from 'joi';

interface EnvVars {
  PORT: number;
  STAGE: 'dev' | 'prod' | 'staging';
  API_PREFIX: string;
  PG_USER: string;
  PG_PASSWORD: string;
  PG_DB: string;
  PG_HOST: string;
  PG_PORT: number;
  SESSION_SECRET: string;
  SESSION_COOKIE_NAME: string;
  SESSION_COOKIE_MAX_AGE: number;
  JWT_SECRET: string;
  JWT_EXPIRY: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string;
  REDIS_DB: number;
  REDIS_MAX_RETRIES: number;
  CACHE_TTL_SECONDS: number;
}

const envSchema = joi
  .object({
    PORT: joi.number().default(3000),
    STAGE: joi.string().valid('dev', 'prod', 'staging').default('dev'),
    API_PREFIX: joi.string().default('api'),
    PG_USER: joi.string().required(),
    PG_PASSWORD: joi.string().required(),
    PG_DB: joi.string().required(),
    PG_HOST: joi.string().required(),
    PG_PORT: joi.number().default(5432),
    SESSION_SECRET: joi.string().min(32).required(),
    SESSION_COOKIE_NAME: joi.string().default('todo_offline'),
    SESSION_COOKIE_MAX_AGE: joi.number().default(60 * 60 * 24 * 7),
    SESSION_COOKIE_SECURE: joi.boolean().default(false),
    JWT_SECRET: joi.string().min(32).required(),
    JWT_EXPIRY: joi.string().default('4h'),
    REDIS_HOST: joi.string().default('localhost'),
    REDIS_PORT: joi.number().default(6379),
    REDIS_PASSWORD: joi.string().default('admin'),
    REDIS_DB: joi.number().default(0),
    REDIS_MAX_RETRIES: joi.number().default(5),
    CACHE_TTL_SECONDS: joi.number().default(86400),
  })
  .unknown(true);

const { error, value } = envSchema.validate({
  ...Object.fromEntries(Object.entries(process.env).map(([k, v]) => [k, /^\d+$/.test(v ?? '') ? Number(v) : v])),
}) as { error: Error | undefined; value: EnvVars };

if (error) throw new Error(`Config validation error: ${error.message}`);

const envVars: EnvVars = value;

// Export environment variables with encoded values
export const envs = {
  port: envVars.PORT,
  stage: envVars.STAGE,
  apiPrefix: envVars.API_PREFIX,
  isProd: process.env.NODE_ENV === 'production',
  pg: {
    uri: `postgres://${envVars.PG_USER}:${envVars.PG_PASSWORD}@${envVars.PG_HOST}:${envVars.PG_PORT}/${envVars.PG_DB}`,
  },
  redis: {
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    password: envVars.REDIS_PASSWORD,
    db: envVars.REDIS_DB,
    maxRetries: envVars.REDIS_MAX_RETRIES,
    ttl: envVars.CACHE_TTL_SECONDS,
    url: `redis://${envVars.REDIS_HOST}:${envVars.REDIS_PORT}/${envVars.REDIS_DB}`,
  },
  session: {
    secret: envVars.SESSION_SECRET,
    cookieName: envVars.SESSION_COOKIE_NAME,
    cookieMaxAge: envVars.SESSION_COOKIE_MAX_AGE,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    expiry: envVars.JWT_EXPIRY,
  },
};
