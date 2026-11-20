import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface ErrorResponseBody {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  error: string;
  message: string;
  details?: unknown;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId =
      (request?.headers?.['x-request-id'] as string) ??
      (response?.getHeader?.('x-request-id') as string) ??
      `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    if (response?.setHeader && !response?.getHeader?.('x-request-id')) {
      response.setHeader('X-Request-Id', requestId);
    }

    let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let error = 'Internal Server Error';
    let message = 'An unexpected error occurred';
    let details: unknown = null;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
        error = exception.name;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        error = (resObj.error as string) ?? exception.name;

        if (Array.isArray(resObj.message)) {
          message = 'Validation failed';
          details = resObj.message;
        } else if (typeof resObj.message === 'string') {
          message = resObj.message;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    const errorBody: ErrorResponseBody = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: request?.url ?? '',
      method: request?.method ?? '',
      error,
      message,
      ...(details ? { details } : {}),
    };

    // Structured JSON log
    const logPayload = {
      type: 'EXCEPTION',
      timestamp: errorBody.timestamp,
      requestId,
      statusCode,
      method: request?.method,
      url: request?.url,
      error,
      message,
      stack: exception instanceof Error ? exception.stack : undefined,
    };

    if (statusCode >= 500) {
      this.logger.error(JSON.stringify(logPayload));
    } else {
      this.logger.warn(JSON.stringify(logPayload));
    }

    response.status(statusCode).json(errorBody);
  }
}
