import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import * as modules from './modules';
import { SessionMiddleware } from './modules/public';
import * as services from './services';

@Module({
  imports: [services.PrismaModule, services.RedisModule, modules.AuthModule, modules.HealthModule, modules.UserModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SessionMiddleware).forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
