import { Public } from '@nestjs/authentication';
import { Controller, Logger, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { RbacService } from './rbac.service.js';

@ApiTags('Rbac')
@Controller('rbac')
export class RbacController {
  private readonly logger = new Logger(RbacController.name);

  constructor(private readonly rbacService: RbacService) {}

  @Public()
  @Post('seed')
  @ApiOperation({
    summary: 'Seed RBAC',
    description: 'Insert-or-omit admin role + default permissions. Safe to re-run.',
  })
  async seed() {
    this.logger.debug('Manual RBAC seed');
    await this.rbacService.seed();
    return { message: 'RBAC seeded' };
  }
}
