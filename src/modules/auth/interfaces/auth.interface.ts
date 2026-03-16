import { UserModel } from 'src/modules/user';

export interface AuthResponse {
  user: UserModel;
  message: string;
  accessToken?: string;
  expiresIn?: string;
  tokenType?: 'Bearer';
}
