import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { AuthModule, HealthModule, SessionMiddleware, UserModule } from './modules';
import { RedisModule } from './modules/redis/redis.module';
import { PrismaModule } from './prisma';

@Module({
  imports: [PrismaModule, RedisModule, AuthModule, HealthModule, UserModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SessionMiddleware).forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
