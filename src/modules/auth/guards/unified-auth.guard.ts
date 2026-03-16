import { CanActivate, ExecutionContext, HttpStatus, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IronSessionData } from 'iron-session';

import { envs } from 'src/config';
import { RedisService } from 'src/modules/redis';
import { UserService } from 'src/modules/user';

@Injectable()
export class UnifiedAuthGuard implements CanActivate {
  private readonly logger = new Logger(UnifiedAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const session = request.session as IronSessionData | undefined;

    if (session?.user) {
      request.user = session.user;
      request.authType = 'session';
      return true;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer '))
      throw new UnauthorizedException({
        status: HttpStatus.UNAUTHORIZED,
        message: 'You must be logged in to access this resource',
      });

    const token = authHeader.substring(7);

    try {
      const payload = await this.jwtService.verifyAsync(token, { secret: envs.jwt.secret });

      const { sub: userId, jti } = payload;

      const isBlacklisted = await this.redisService.isTokenBlacklisted(jti);
      if (isBlacklisted) {
        this.logger.warn(`Token ${jti} is blacklisted`);
        throw new UnauthorizedException({ status: HttpStatus.UNAUTHORIZED, message: 'Invalid token' });
      }

      const user = await this.userService.findBy({ where: { id: userId } });
      if (!user) throw new UnauthorizedException({ status: HttpStatus.UNAUTHORIZED, message: 'Invalid token' });

      request.user = user;
      request.jti = jti;
      request.authType = 'jwt';
      return true;
    } catch (jwtError) {
      this.logger.debug(`JWT validation failed: ${jwtError}`);
    }

    throw new UnauthorizedException({
      status: HttpStatus.UNAUTHORIZED,
      message: 'You must be logged in to access this resource',
    });
  }
}
