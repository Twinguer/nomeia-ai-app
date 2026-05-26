export const devLog = {
  debug: (..._args: unknown[]) => {},
  warn: (..._args: unknown[]) => {},
  error: (..._args: unknown[]) => {},
};

export function sanitizeForLog<T>(value: T): T {
  return value;
}
