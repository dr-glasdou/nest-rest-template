import { createId } from '@paralleldrive/cuid2';

import { envs } from '../config/envs.config.js';

export interface ErrorPayload {
  status: number;
  message: string;
  errors: unknown[];
  stack?: string;
  traceId: string;
}

export function buildErrorPayload(status: number, message: string, errors: unknown[] = [], stack?: string): ErrorPayload {
  return {
    traceId: createId(),
    status,
    message,
    errors,
    ...(envs.app.isProd ? {} : { stack: stack ?? '' }),
  };
}
