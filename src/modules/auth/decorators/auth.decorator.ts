import { applyDecorators, UseGuards } from '@nestjs/common';
import { UnifiedAuthGuard } from '../guards/unified-auth.guard';

export function Auth(/* ...roles: Role[] */) {
  return applyDecorators(UseGuards(UnifiedAuthGuard));
}
