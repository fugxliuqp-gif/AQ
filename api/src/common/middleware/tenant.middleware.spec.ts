import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { TenantMiddleware } from './tenant.middleware';
import { PrismaService } from '../../prisma/prisma.service';

describe('TenantMiddleware', () => {
  let middleware: TenantMiddleware;
  const mockPrisma = {
    tenant: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  function mockReq(user?: any) {
    return { user } as any;
  }
  const mockRes = {} as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantMiddleware,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    middleware = module.get<TenantMiddleware>(TenantMiddleware);
    jest.clearAllMocks();
  });

  it('should call next() when no user on request', async () => {
    const next = jest.fn();
    await middleware.use(mockReq(undefined), mockRes, next);
    expect(next).toHaveBeenCalled();
  });

  it('should set ignoreTenantFilter for super_admin and call next()', async () => {
    const req = mockReq({ role: 'super_admin' });
    const next = jest.fn();
    await middleware.use(req, mockRes, next);
    expect(req.ignoreTenantFilter).toBe(true);
    expect(next).toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when tenantId is missing', async () => {
    const next = jest.fn();
    await expect(
      middleware.use(mockReq({ role: 'tenant_admin' }), mockRes, next),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when tenant does not exist', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValue(null);
    const next = jest.fn();
    await expect(
      middleware.use(mockReq({ role: 'tenant_admin', tenantId: '1' }), mockRes, next),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw ForbiddenException when tenant status is expired', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValue({ id: 1n, status: 'expired' });
    const next = jest.fn();
    await expect(
      middleware.use(mockReq({ role: 'tenant_admin', tenantId: '1' }), mockRes, next),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException and update status when expireDate passed', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValue({
      id: 1n,
      status: 'active',
      expireDate: new Date('2020-01-01'),
      tenantCode: 'oldcorp',
    });
    mockPrisma.tenant.update.mockResolvedValue({});
    const next = jest.fn();

    await expect(
      middleware.use(mockReq({ role: 'tenant_admin', tenantId: '1' }), mockRes, next),
    ).rejects.toThrow(ForbiddenException);
    expect(mockPrisma.tenant.update).toHaveBeenCalledWith({
      where: { id: 1n },
      data: { status: 'expired' },
    });
  });

  it('should set tenantId and tenantCode and call next() for valid tenant', async () => {
    mockPrisma.tenant.findUnique.mockResolvedValue({
      id: 1n,
      status: 'active',
      expireDate: null,
      tenantCode: 'testcorp',
    });
    const req = mockReq({ role: 'tenant_admin', tenantId: '1' });
    const next = jest.fn();
    await middleware.use(req, mockRes, next);
    expect(req.tenantId).toBe(1n);
    expect(req.tenantCode).toBe('testcorp');
    expect(next).toHaveBeenCalled();
  });
});
