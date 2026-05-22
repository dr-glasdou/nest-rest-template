import { HttpStatus, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { envs } from 'src/config';
import { UserService } from 'src/modules/user';
import { RedisService } from 'src/services/redis';
import { JwtPayload } from '../interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly userService: UserService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: envs.jwt.secret,
    });
  }

  async validate(payload: JwtPayload) {
    const { sub: userId, jti } = payload;

    const isBlacklisted = await this.redisService.isTokenBlacklisted(jti);
    if (isBlacklisted) {
      this.logger.warn(`Token ${jti} is blacklisted`);
      throw new UnauthorizedException({ status: HttpStatus.UNAUTHORIZED, message: 'Invalid token' });
    }

    const user = await this.userService.findBy({ where: { id: userId } });
    if (!user) throw new UnauthorizedException({ status: HttpStatus.UNAUTHORIZED, message: 'Invalid token' });

    return { user, jti };
  }
}
