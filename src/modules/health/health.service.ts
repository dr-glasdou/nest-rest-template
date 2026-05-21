import { HttpStatus, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma';
import { RedisService } from 'src/redis';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  checkHealth() {
    this.logger.debug('Checking health...');
    return { status: 'healthy' };
  }

  async checkDatabaseConnection() {
    try {
      this.logger.debug('Checking database connection...');
      await this.prisma.$queryRaw`SELECT 1`;
      return { database: 'connected' };
    } catch (_) {
      throw new InternalServerErrorException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Database connection failed',
      });
    }
  }

  async checkCacheDbConnection() {
    try {
      this.logger.debug('Checking cache database connection...');
      await this.redis.ping();
      return { cache: 'connected' };
    } catch (_) {
      throw new InternalServerErrorException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Cache database connection failed',
      });
    }
  }
}
