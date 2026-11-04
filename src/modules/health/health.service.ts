import { Injectable, Logger } from '@nestjs/common';

import type { BasicResponse } from '../common/index.js';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  check(): BasicResponse {
    this.logger.debug('Checking health');
    return { message: 'OK', timestamp: new Date().toISOString() };
  }
}
