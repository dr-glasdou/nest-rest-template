import { createZodDto } from 'nestjs-zod';

import { createApiKeySchema } from '#services/db/index.js';

export class CreateApiKeyDto extends createZodDto(createApiKeySchema) {}
