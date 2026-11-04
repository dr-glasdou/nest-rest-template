import { createZodDto } from 'nestjs-zod';

import { userCreateSchema } from '#services/db/index.js';

export const userSignUpSchema = userCreateSchema;

export class SignUpDto extends createZodDto(userSignUpSchema) {}
