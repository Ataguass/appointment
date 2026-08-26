import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT authentication guard.
 * Applies Passport JWT strategy to validate Bearer tokens on protected routes.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
