import { HttpStatus, Injectable, Logger, UnauthorizedException } from '@nestjs/common';

import { exclude, hasher } from '#modules/common/index.js';
import { UserService } from '#modules/user/index.js';

import { SignInDto, SignUpDto } from './dto/index.js';

@Injectable()
export class CredentialsService {
  private readonly logger = new Logger(CredentialsService.name);
  constructor(private readonly userService: UserService) {}

  async register(dto: SignUpDto) {
    this.logger.debug(`Registering user username=${dto.username}`);
    const user = await this.userService.create(dto);
    this.logger.debug(`Registered user id=${user.id} username=${user.username}`);
    return user;
  }

  async verify({ username, password }: SignInDto) {
    this.logger.debug(`Verifying credentials username=${username}`);
    const found = await this.userService.findCredentials(username);

    const isValid = await hasher.check(password, found.password);
    if (!isValid) {
      this.logger.warn('Invalid password: ', { username });
      throw new UnauthorizedException({ status: HttpStatus.UNAUTHORIZED, message: 'Invalid credentials' });
    }

    if (hasher.needsRehash(found.password)) {
      this.logger.debug(`Rehashing password id=${found.id}`);
      const hashed = await hasher.hash(password);
      await this.userService.updatePasswordHash(found.id, hashed);
    }

    this.logger.debug(`Credentials verified id=${found.id} username=${username}`);
    return exclude(found, 'password');
  }
}
