import { createZodDto } from 'nestjs-zod';

import { roleCreateSchema } from '#services/db/index.js';

export class CreateRoleDto extends createZodDto(roleCreateSchema) {}
