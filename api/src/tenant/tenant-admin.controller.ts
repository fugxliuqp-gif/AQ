import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { TenantAdminService } from './tenant-admin.service';

@Controller('admin/tenant')
@Roles('tenant_admin', 'super_admin')
export class TenantAdminController {
  constructor(private readonly service: TenantAdminService) {}

  @Get('info')
  async getInfo(@CurrentUser() user: CurrentUserPayload) {
    return this.service.getTenantInfo(BigInt(user.tenantId!));
  }

  // --- Roles ---
  @Get('roles')
  async listRoles(@CurrentUser() user: CurrentUserPayload) {
    return this.service.listRoles(BigInt(user.tenantId!));
  }

  @Post('roles')
  async createRole(
    @Body() body: any,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.createRole(BigInt(user.tenantId!), body, BigInt(user.userId));
  }

  @Put('roles/:id')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.updateRole(BigInt(user.tenantId!), BigInt(id), body);
  }

  @Delete('roles/:id')
  async deleteRole(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.deleteRole(BigInt(user.tenantId!), BigInt(id));
  }

  // --- Users ---
  @Get('users')
  async listUsers(
    @CurrentUser() user: CurrentUserPayload,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.service.listUsers(BigInt(user.tenantId!), {
      skip: skip ? parseInt(skip, 10) : 0,
      take: take ? parseInt(take, 10) : 20,
    });
  }

  @Post('users')
  async createUser(
    @Body() body: any,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.createUser(BigInt(user.tenantId!), body, BigInt(user.userId));
  }

  @Put('users/:id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.updateUser(BigInt(user.tenantId!), BigInt(id), body, BigInt(user.userId));
  }

  @Get('modules')
  async getAvailableModules(@CurrentUser() user: CurrentUserPayload) {
    return this.service.getUserModules(BigInt(user.tenantId!));
  }
}
