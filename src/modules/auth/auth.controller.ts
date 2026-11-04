import { CurrentUser, Public, SignInService } from '@nestjs/authentication';
import { Body, Controller, Get, HttpStatus, Logger, Post, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { PublicUserDto } from '#modules/user/index.js';

import { CredentialsService } from './credentials.service.js';
import { SignInDto, SignInResponseDto, SignUpDto, userSignInSchema, userSignUpSchema } from './dto/index.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly credentialsService: CredentialsService,
    private readonly signInService: SignInService,
  ) {}

  @Get('me')
  @ApiOperation({
    summary: 'Current user',
    description: 'Returns the session user. Requires an active session cookie.',
  })
  @ZodResponse({ status: 200, type: PublicUserDto, description: 'Authenticated user' })
  me(@CurrentUser() user: PublicUserDto) {
    return user;
  }

  @Public()
  @Post('sign-up')
  @ApiOperation({
    summary: 'Sign up',
    description: 'Creates a user and starts a session cookie.',
  })
  @ZodResponse({ status: 201, type: PublicUserDto, description: 'User created and signed in' })
  async signUp(@Body({ schema: userSignUpSchema }) body: SignUpDto) {
    const user = await this.credentialsService.register(body);
    await this.signInService.signIn(user.id, { method: 'password' });
    return user;
  }

  @Public()
  @Post('sign-in')
  @ApiOperation({
    summary: 'Sign in',
    description: 'Verifies credentials and starts a session cookie. Returns whether MFA is pending.',
  })
  @ZodResponse({ status: 201, type: SignInResponseDto, description: 'Signed in' })
  async signIn(@Body({ schema: userSignInSchema }) body: SignInDto) {
    const user = await this.credentialsService.verify(body);
    if (!user) throw new UnauthorizedException({ status: HttpStatus.UNAUTHORIZED, message: 'Invalid credentials' });

    const { session } = await this.signInService.signIn(user.id, { method: 'password' });
    return { mfaRequired: session.mfa === 'pending' };
  }

  @Post('sign-out')
  @ApiOperation({
    summary: 'Sign out',
    description: 'Ends the current session. Requires an active session cookie.',
  })
  async signOut() {
    if (!(await this.signInService.signOut())) {
      this.logger.error(`Sign out failed; No active session`);
      throw new UnauthorizedException({ status: HttpStatus.UNAUTHORIZED, message: 'Sign out failed' });
    }
    return { message: 'Signed out successfully' };
  }

  @Post('sign-out-everywhere')
  @ApiOperation({
    summary: 'Sign out everywhere',
    description: 'Revokes all sessions for the current user. Requires an active session cookie.',
  })
  async signOutEverywhere(@CurrentUser('id') userId: string) {
    await this.signInService.signOutEverywhere(userId);
  }
}
