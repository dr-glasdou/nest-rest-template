import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { constants } from '#config/index.js';

const paginationShape = {
  page: z.coerce.number().int().positive().default(constants.pagination.defaultPage).describe('Page number for pagination'),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(constants.pagination.maxLimit)
    .default(constants.pagination.defaultLimit)
    .describe('Number of items per page'),
};

type PaginationInput = { page: number; limit: number };

export const withPagination = <T extends z.ZodRawShape = Record<never, never>>(shape: T = {} as T) =>
  z
    .object({ ...paginationShape, ...shape })
    .transform((v) => {
      const { page, limit } = v as unknown as PaginationInput;
      return { ...v, offset: (page - 1) * limit };
    })
    .refine((v) => v.offset < constants.pagination.countCap, {
      path: ['page'],
      message: `Too many results to page through (max ${constants.pagination.countCap}), please refine your filters`,
    });

export const paginationSchema = withPagination();
export class PaginationDto extends createZodDto(paginationSchema) {}

export const paginationMetaSchema = z.object({
  total: z.number().describe('Total matching items, capped at countCap when isCapped is true'),
  isCapped: z.boolean().describe('True when the real total exceeds the cap (show "10,000+")'),
  page: z.number().describe('Current page number'),
  lastPage: z.number().describe('Last reachable page (Math.ceil(total / limit), minimum 1)'),
  hasNext: z.boolean().describe('Whether a next page is reachable'),
});
export class PaginationMetaDto extends createZodDto(paginationMetaSchema) {}

/** List response envelope `{ data, meta }`. Pass the row schema (and optional item description). */
export const withPaginatedResponse = <T extends z.ZodType>(itemSchema: T, itemDescription = 'Rows for the current page') =>
  z.object({
    data: z.array(itemSchema).describe(itemDescription),
    meta: paginationMetaSchema,
  });
