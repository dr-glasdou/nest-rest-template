import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { authzSchema, userPublicSchema } from '#services/db/index.js';

export const meSchema = userPublicSchema.extend(authzSchema.shape);
export type MePrincipal = z.infer<typeof meSchema>;
export class MeDto extends createZodDto(meSchema) {}
