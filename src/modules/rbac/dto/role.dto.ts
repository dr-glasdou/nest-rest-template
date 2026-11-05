import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { withPaginatedResponse } from '#modules/common/index.js';
import { permissionSelectSchema, roleSelectSchema } from '#services/db/index.js';

export const roleWithPermissionsSchema = roleSelectSchema.extend({
  permissions: z.array(permissionSelectSchema),
});

export class RoleDto extends createZodDto(roleWithPermissionsSchema) {}
export class PaginatedRolesDto extends createZodDto(withPaginatedResponse(roleWithPermissionsSchema, 'Roles for the current page')) {}
