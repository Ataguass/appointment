import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { randomUUID } from 'crypto';

/**
 * Logging interceptor that adds correlation IDs to every request
 * and logs request/response metadata (MON-001).
 * 
 * Sensitive patient data is never logged in plaintext.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const correlationId = (request.headers['x-correlation-id'] as string) || randomUUID();
    const { method, url } = request;
    const startTime = Date.now();

    // Attach correlation ID to request for downstream use
    request.headers['x-correlation-id'] = correlationId;

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          this.logger.log(
            `[${correlationId}] ${method} ${url} — ${duration}ms`,
          );
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            `[${correlationId}] ${method} ${url} — ${duration}ms — ${error.message}`,
          );
        },
      }),
    );
  }
}
