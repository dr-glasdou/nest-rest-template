import { createZodDto } from 'nestjs-zod';

import { permissionCreateSchema } from '#services/db/index.js';

export class CreatePermissionDto extends createZodDto(permissionCreateSchema) {}
