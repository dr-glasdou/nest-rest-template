import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { BasicResponseDto } from '../common/index.js';
import { HealthService } from './health.service.js';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Health check',
    description: 'Returns service liveness. Use for load balancers and uptime monitors.',
  })
  @ZodResponse({ status: 200, type: BasicResponseDto, description: 'Service is healthy' })
  check() {
    return this.healthService.check();
  }
}
