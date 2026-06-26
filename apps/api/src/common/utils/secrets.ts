import { ConfigService } from '@nestjs/config';

/**
 * Get a required secret from config.
 * In production, throws if missing.
 * In dev, returns a warning-prefixed default so local dev still works.
 */
export function requireSecret(configService: ConfigService, key: string): string {
  const value = configService.get<string>(key);
  if (value) return value;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Required secret "${key}" is not set in production environment`);
  }

  // Dev fallback with clear warning
  console.warn(`[SECURITY WARNING] ${key} not set, using insecure dev fallback. Set it in .env`);
  return `dev-insecure-${key.toLowerCase()}`;
}
