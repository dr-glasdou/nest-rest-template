import { createZodDto } from 'nestjs-zod';

import { userUpdateSchema } from '#services/db/index.js';

export class UpdateUserDto extends createZodDto(userUpdateSchema) {}
