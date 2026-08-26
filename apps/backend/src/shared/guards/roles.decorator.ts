import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator to specify which roles can access a route.
 * Used with RolesGuard for server-side RBAC enforcement (RBAC-007).
 *
 * Usage: @Roles('ADMIN', 'RECEPTIONIST')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
