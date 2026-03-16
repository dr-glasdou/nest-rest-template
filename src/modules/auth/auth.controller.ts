import { BadRequestException, Body, Controller, Get, HttpStatus, Post, Req, Session } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IronSession, IronSessionData } from 'iron-session';

import { envs } from 'src/config';
import { RedisService } from 'src/modules/redis';
import { CreateUserDto } from '../user';
import { AuthService } from './auth.service';
import { Auth } from './decorators';
import { LoginDto } from './dtos';
import { AuthResponse } from './interfaces';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
  ) {}

  @Auth()
  @Get('me')
  getProfile(@Req() req: Request) {
    return req.user;
  }

  @Post('login')
  login(@Body() loginDto: LoginDto, @Session() session: IronSession<IronSessionData>): Promise<AuthResponse> {
    return this.authService.login(loginDto, session);
  }

  @Post('login/jwt')
  loginJwt(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.loginWithJwt(loginDto);
  }

  @Post('logout')
  async logout(@Req() req: Request, @Session() session: IronSession<IronSessionData>): Promise<{ message: string }> {
    const authType = req.authType;

    if (authType === 'session') {
      session.destroy();
      return { message: 'Logged out successfully' };
    }

    const jti = req.jti;
    if (!jti)
      throw new BadRequestException({ status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'No JTI found in request' });

    const token = req.headers.authorization?.substring(7) || '';
    const payload = await this.jwtService.verifyAsync(token, { secret: envs.jwt.secret });
    const ttl = payload.exp - payload.iat;
    await this.redisService.blacklistToken(jti, ttl);

    return { message: 'Logged out successfully' };
  }

  @Post('register')
  register(@Body() dto: CreateUserDto): Promise<AuthResponse> {
    return this.authService.register(dto);
  }
}
