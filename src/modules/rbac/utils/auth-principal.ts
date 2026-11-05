/** Shape authorization policies read from `request.user` (session / API key principal). */
export type AuthPrincipal = {
  id: string;
  roles: readonly string[];
  permissions: readonly { module: string; action: string }[];
};

export const hasPermission = (user: AuthPrincipal | null | undefined, module: string, action: string): boolean =>
  !!user?.permissions.some((p) => p.module === module && p.action === action);
