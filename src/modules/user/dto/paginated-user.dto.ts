import { createZodDto } from 'nestjs-zod';

import { withPaginatedResponse } from '#modules/common/index.js';
import { userPublicSchema } from '#services/db/index.js';

export class PaginatedUsersDto extends createZodDto(withPaginatedResponse(userPublicSchema, 'Users for the current page')) {}
