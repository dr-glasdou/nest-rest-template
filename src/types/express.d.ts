import { IronSession, IronSessionData } from 'iron-session';
import { UserModel } from 'src/modules/user';

declare module 'express' {
  interface Request {
    session: IronSession<IronSessionData>;
    user?: UserModel;
    authType?: 'session' | 'jwt';
    jti?: string;
  }
}
