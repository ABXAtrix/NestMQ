import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const requestId =
      (request.headers['x-request-id'] as string) ??
      `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    response.setHeader('X-Request-Id', requestId);

    const startTime = Date.now();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') ?? 'unknown';

    this.logger.log(
      JSON.stringify({
        type: 'HTTP_REQUEST',
        timestamp: new Date().toISOString(),
        requestId,
        method,
        url,
        ip,
        userAgent,
      }),
    );

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - startTime;
        const statusCode = response.statusCode;

        this.logger.log(
          JSON.stringify({
            type: 'HTTP_RESPONSE',
            timestamp: new Date().toISOString(),
            requestId,
            method,
            url,
            statusCode,
            durationMs,
          }),
        );
      }),
    );
  }
}
