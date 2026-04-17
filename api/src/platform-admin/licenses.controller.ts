import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { PlatformAdminService } from './platform-admin.service';

@Controller('admin/platform/licenses')
@Roles('super_admin')
export class PlatformAdminLicensesController {
  constructor(private readonly service: PlatformAdminService) {}

  @Get(':tenantId')
  async getByTenant(@Param('tenantId', ParseIntPipe) tenantId: number) {
    return this.service.getTenantLicenses(BigInt(tenantId));
  }

  @Post(':tenantId')
  async save(
    @Param('tenantId', ParseIntPipe) tenantId: number,
    @Body() body: { moduleCode: string; status: string; expireDate?: string; maxUsers?: number; customPrice?: number },
  ) {
    return this.service.upsertLicense({
      tenantId: BigInt(tenantId),
      moduleCode: body.moduleCode,
      status: body.status,
      expireDate: body.expireDate ? new Date(body.expireDate) : undefined,
      maxUsers: body.maxUsers,
      customPrice: body.customPrice,
    });
  }
}
