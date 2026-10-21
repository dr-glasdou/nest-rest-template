import { loadEnvFile } from 'node:process';

import { z } from 'zod';

loadEnvFile();

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
};
