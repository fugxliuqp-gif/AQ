import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new JwtAuthGuard(reflector);
  });

  function createMockContext(request: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  }

  describe('canActivate', () => {
    it('should return true for public routes', () => {
      reflector.getAllAndOverride = jest.fn().mockReturnValue(true);
      const context = createMockContext({});
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should delegate to super.canActivate for non-public routes', () => {
      reflector.getAllAndOverride = jest.fn().mockReturnValue(undefined);
      const context = createMockContext({});
      jest.spyOn((guard as any).__proto__.__proto__, 'canActivate').mockReturnValue(true);
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('handleRequest', () => {
    it('should return user when no error and user exists', () => {
      const user = { userId: '1' };
      expect(guard.handleRequest(null, user, null)).toBe(user);
    });

    it('should throw UnauthorizedException when err exists', () => {
      expect(() => guard.handleRequest(new Error('bad'), null, null)).toThrow(Error);
    });

    it('should throw UnauthorizedException when user is missing', () => {
      expect(() => guard.handleRequest(null, null, null)).toThrow(UnauthorizedException);
    });
  });
});
