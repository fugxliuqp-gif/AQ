import { Controller, Get, Post, Put, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PlatformAdminService } from './platform-admin.service';

@Controller('admin/platform/tenants')
@Roles('super_admin')
export class PlatformAdminTenantsController {
  constructor(private readonly service: PlatformAdminService) {}

  @Get()
  async list(
    @Query('status') status?: string,
    @Query('plan') plan?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.service.listTenants({
      status,
      plan,
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 20,
    });
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.getTenantById(BigInt(id));
  }

  @Post()
  async create(@Body() body: any, @CurrentUser('userId') userId: string) {
    return this.service.createTenant({ ...body, createdBy: BigInt(userId) });
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.updateTenant(BigInt(id), body);
  }
}
