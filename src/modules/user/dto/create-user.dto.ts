import { createZodDto } from 'nestjs-zod';

import { userCreateSchema } from '#services/db/index.js';

export class CreateUserDto extends createZodDto(userCreateSchema) {}
