import { HttpStatus, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { IronSession, IronSessionData } from 'iron-session';
import { envs } from 'src/config';
import { ExceptionHandler } from '../common';
import { CreateUserDto, UserModel, UserService } from '../user';
import { LoginDto } from './dtos';
import { AuthResponse } from './interfaces';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    readonly _user: UserService,
    private readonly _jwt: JwtService,
  ) {}

  async login({ username, password }: LoginDto, session: IronSession<IronSessionData>): Promise<AuthResponse> {
    this.logger.log(`Login attempt for user: ${username}`);

    const user = await this._user.validatePassword(username, password);

    if (!user) throw new UnauthorizedException({ status: HttpStatus.UNAUTHORIZED, message: 'Invalid credentials' });

    await this.setUserSession(session, user);

    this.logger.log(`User ${username} logged in successfully`);
    return { user, message: 'Login successful' };
  }

  async loginWithJwt({ username, password }: LoginDto): Promise<AuthResponse> {
    this.logger.log(`JWT login attempt for user: ${username}`);

    const user = await this._user.validatePassword(username, password);

    if (!user) throw new UnauthorizedException({ status: HttpStatus.UNAUTHORIZED, message: 'Invalid credentials' });

    const jti = randomUUID();
    const payload = { sub: user.id, jti };

    const accessToken = await this._jwt.signAsync(payload);

    this.logger.log(`User ${username} logged in with JWT successfully`);
    return {
      user,
      message: 'Login successful',
      accessToken,
      expiresIn: envs.jwt.expiry,
      tokenType: 'Bearer',
    };
  }

  async register(dto: CreateUserDto): Promise<AuthResponse> {
    try {
      const newUser = await this._user.create(dto);

      this.logger.log(`User registered successfully: ${dto.username}`);
      return { user: newUser, message: 'Registration successful' };
    } catch (error) {
      ExceptionHandler.handle({
        error,
        context: `AuthService.register({ ${dto.username}, ${dto.email}, **** })`,
        message: 'Registration failed',
      });
    }
  }

  private async setUserSession(session: IronSession<IronSessionData>, user: UserModel): Promise<void> {
    session.user = user;
    return await session.save();
  }
}
