import { Controller, Get, Post, Put, Body, Param, ParseIntPipe } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { PlatformAdminService } from './platform-admin.service';

@Controller('admin/platform/modules')
@Roles('super_admin')
export class PlatformAdminModulesController {
  constructor(private readonly service: PlatformAdminService) {}

  @Get()
  async list() {
    return this.service.listModules();
  }

  @Post()
  async create(@Body() body: any) {
    return this.service.createModule(body);
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.updateModule(BigInt(id), body);
  }
}
