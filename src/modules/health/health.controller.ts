import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  checkHealth() {
    return this.healthService.checkHealth();
  }

  @Get('db')
  checkDatabaseConnection() {
    return this.healthService.checkDatabaseConnection();
  }

  @Get('cache')
  checkCacheConnection() {
    return this.healthService.checkCacheDbConnection();
  }
}
