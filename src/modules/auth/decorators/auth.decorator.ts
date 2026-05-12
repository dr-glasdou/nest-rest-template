import { applyDecorators, UseGuards } from '@nestjs/common';
import { UnifiedAuthGuard } from '../guards';

export function Auth(/* ...roles: Role[] */) {
  return applyDecorators(UseGuards(UnifiedAuthGuard));
}
