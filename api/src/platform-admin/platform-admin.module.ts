import { Module } from '@nestjs/common';
import { PlatformAdminTenantsController } from './tenants.controller';
import { PlatformAdminModulesController } from './modules.controller';
import { PlatformAdminLicensesController } from './licenses.controller';
import { PlatformAdminService } from './platform-admin.service';

@Module({
  controllers: [
    PlatformAdminTenantsController,
    PlatformAdminModulesController,
    PlatformAdminLicensesController,
  ],
  providers: [PlatformAdminService],
})
export class PlatformAdminModule {}
