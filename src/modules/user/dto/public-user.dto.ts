import { createZodDto } from 'nestjs-zod';

import { userPublicSchema } from '#services/db/index.js';

export class PublicUserDto extends createZodDto(userPublicSchema) {}
