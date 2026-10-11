export class UserError extends Error {}
export function errorMessage(error: unknown): string {
  if (error instanceof UserError) return error.message;
  const code =
    typeof error === 'object' && error !== null && 'code' in error ? Number(error.code) : 0;
  if (code === 50013)
    return 'Discord rejected this action because the bot lacks permissions or its role is too low. Run /diagnose check.';
  if (code === 50001)
    return 'The bot cannot access the selected channel or resource. Check channel overwrites and /diagnose check.';
  if ([10003, 10007, 10008, 10011, 10013].includes(code))
    return 'That channel, member, message, role, or user no longer exists or is inaccessible.';
  return 'The action could not be completed. Check /diagnose check for permissions and configuration. The operator can inspect the error log.';
}
