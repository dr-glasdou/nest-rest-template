import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { userCreateBaseSchema } from '#services/db/index.js';

export const userSignInSchema = userCreateBaseSchema.pick({ username: true, password: true });
export class SignInDto extends createZodDto(userSignInSchema) {}

export const signInResponseSchema = z.object({
  mfaRequired: z.boolean().describe('True when an MFA challenge is pending'),
});
export class SignInResponseDto extends createZodDto(signInResponseSchema) {}
