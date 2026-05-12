import { Body, Controller, Get, Post, Req, Session } from '@nestjs/common';
import { Request } from 'express';
import { IronSession, IronSessionData } from 'iron-session';

import { CreateUserDto } from '../user';
import { AuthService } from './auth.service';
import { Auth } from './decorators';
import { LoginDto } from './dtos';
import { AuthResponse } from './interfaces';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  @Auth()
  @Post('logout')
  logout(@Req() req: Request, @Session() session: IronSession<IronSessionData>): Promise<{ message: string }> {
    return this.authService.logout(req, session);
  }

  @Post('register')
  register(@Body() dto: CreateUserDto): Promise<AuthResponse> {
    return this.authService.register(dto);
  }
}
