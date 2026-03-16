import { JwtModuleOptions } from '@nestjs/jwt';
import { envs } from './envs.config';

export const jwtConfig: JwtModuleOptions = {
  secret: envs.jwt.secret as string,
  signOptions: {
    expiresIn: envs.jwt.expiry as unknown as undefined,
  },
};
