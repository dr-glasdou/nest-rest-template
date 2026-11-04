import { loadEnvFile } from 'node:process';

import { z } from 'zod';

loadEnvFile();

/** Matches `@nestjs/authentication` Duration strings: `15m`, `3d`, `1w`, … */
const duration = z.templateLiteral([z.number(), z.enum(['ms', 's', 'm', 'h', 'd', 'w'])]);

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  STAGE: z.enum(['dev', 'prod', 'staging']).default('dev'),
  API_PREFIX: z.string().default('api'),
  TRUSTED_ORIGINS: z
    .string()
    .transform((s) =>
      s
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string().min(1)).min(1)),
  DB_URL: z.url(),
  MAX_POOL: z.coerce.number().int().positive().default(10),
  DB_TIMEZONE: z.string().default('UTC'),
  AUTH_SESSION_ABSOLUTE_TTL: duration,
  AUTH_SESSION_IDLE_TTL: duration,
  API_KEY_PREFIX: z.string().min(2),
});

export type EnvVars = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  throw new Error(`Config validation error: ${details}`);
}

const envVars: EnvVars = parsed.data;

// Export environment variables with encoded values
export const envs = {
  app: {
    port: envVars.PORT,
    stage: envVars.STAGE,
    prefix: envVars.API_PREFIX,
    isProd: envVars.STAGE === 'prod',
    trustedOrigins: envVars.TRUSTED_ORIGINS,
  },
  db: {
    url: envVars.DB_URL,
    maxPool: envVars.MAX_POOL,
    timezone: envVars.DB_TIMEZONE,
  },
  auth: {
    session: {
      absoluteTtl: envVars.AUTH_SESSION_ABSOLUTE_TTL,
      idleTtl: envVars.AUTH_SESSION_IDLE_TTL,
    },
    apiKey: {
      prefix: envVars.API_KEY_PREFIX,
    },
  },
};
