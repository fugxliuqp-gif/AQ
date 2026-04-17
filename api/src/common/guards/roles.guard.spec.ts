import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard, ROLES_KEY } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(user: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  }

  it('should allow access when no roles metadata is set', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(undefined);
    expect(guard.canActivate(createMockContext({ role: 'tenant_user' }))).toBe(true);
  });

  it('should allow access when user role matches required roles', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(['super_admin', 'tenant_admin']);
    expect(guard.canActivate(createMockContext({ role: 'tenant_admin' }))).toBe(true);
  });

  it('should throw ForbiddenException when user role does not match', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(['super_admin']);
    expect(() => guard.canActivate(createMockContext({ role: 'tenant_admin' }))).toThrow(
      ForbiddenException,
    );
  });

  it('should throw ForbiddenException when user is missing', () => {
    reflector.getAllAndOverride = jest.fn().mockReturnValue(['super_admin']);
    expect(() => guard.canActivate(createMockContext(null))).toThrow(ForbiddenException);
  });
});
