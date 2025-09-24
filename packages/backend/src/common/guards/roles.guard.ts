import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

export enum UserRole {
  BROKER = 'Broker',
  CONTENT_DEVELOPER = 'Content Developer',
  TRAINER = 'Trainer',
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true; // Allow access to public routes
    }

    // Get required roles from decorator
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No roles required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Extract user's role name in a robust way (supports multiple shapes)
    const userRoleName: string | undefined =
      user?.role?.name || // Full entity relation loaded
      user?.roleName || // JWT payload may carry roleName
      (typeof user?.role === 'string' ? user.role : undefined); // Sometimes role may be a plain string

    // Check if user has any of the required roles
    const hasRole = !!userRoleName && requiredRoles.some((role) => userRoleName === role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}. User role: ${userRoleName ?? 'unknown'}`
      );
    }

    return true;
  }
}
