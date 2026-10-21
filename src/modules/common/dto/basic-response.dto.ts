import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const BasicResponseSchema = z.object({
  message: z.string().describe('Human-readable status message'),
  timestamp: z.iso.datetime().describe('UTC ISO-8601 timestamp'),
});

export class BasicResponseDto extends createZodDto(BasicResponseSchema) {}

export type BasicResponse = z.infer<typeof BasicResponseSchema>;
