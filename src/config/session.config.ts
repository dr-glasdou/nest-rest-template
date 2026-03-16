import { SessionOptions } from 'iron-session';
import { envs } from './envs.config';

export const sessionConfig: SessionOptions = {
  password: envs.session.secret,
  cookieName: envs.session.cookieName,
  cookieOptions: {
    secure: envs.isProd,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: envs.session.cookieMaxAge, // 7 days
    path: '/',
  },
};
