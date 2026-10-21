import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodSerializationException, ZodValidationException } from 'nestjs-zod';

import { envs } from '../config/envs.config.js';
import { buildErrorPayload } from './error-payload.js';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: unknown[] = [];
    let stack: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      stack = exception.stack;
      const isZodException = exception instanceof ZodValidationException || exception instanceof ZodSerializationException;

      if (isZodException) {
        message = exception.message;
        errors = ((exception.getZodError() as { issues?: unknown[] })?.issues ?? []) as unknown[];
      } else {
        const exceptionResponse = exception.getResponse();
        if (typeof exceptionResponse === 'string') {
          message = exceptionResponse;
        } else {
          const body = exceptionResponse as Record<string, unknown>;
          const rawMessage = body?.message;
          if (Array.isArray(rawMessage)) {
            message = rawMessage.map(String).join(', ');
            errors = Array.isArray(body?.errors) ? (body.errors as unknown[]) : rawMessage;
          } else {
            message = typeof rawMessage === 'string' ? rawMessage : exception.message;
            errors = Array.isArray(body?.errors) ? (body.errors as unknown[]) : [];
          }
        }
      }
    } else if (exception instanceof Error) {
      message = envs.app.isProd ? 'Internal server error' : exception.message;
      stack = exception.stack;
      this.logger.error(exception.message, exception.stack);
    } else {
      message = envs.app.isProd ? 'Internal server error' : String(exception);
      this.logger.error(exception);
    }

    const payload = buildErrorPayload(status, message, errors, stack);

    if (status < 500) {
      this.logger.warn(`HTTP error status=${status} traceId=${payload.traceId} message="${message}"`, {
        traceId: payload.traceId,
        path: request.originalUrl,
        method: request.method,
      });
    }

    response.status(status).json(payload);
  }
}
