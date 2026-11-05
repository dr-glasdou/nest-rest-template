import { createZodDto } from 'nestjs-zod';

import { withPaginatedResponse } from '#modules/common/index.js';
import { permissionSelectSchema } from '#services/db/index.js';

export class PermissionDto extends createZodDto(permissionSelectSchema) {}
export class PaginatedPermissionsDto extends createZodDto(
  withPaginatedResponse(permissionSelectSchema, 'Permissions for the current page'),
) {}
