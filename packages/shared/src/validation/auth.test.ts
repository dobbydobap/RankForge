import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from './auth';

describe('registerSchema', () => {
  it('should accept valid input', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      username: 'testuser',
      password: 'Password1',
    });
    expect(result.success).toBe(true);
  });

  it('should reject short username', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      username: 'ab',
      password: 'Password1',
    });
    expect(result.success).toBe(false);
  });

  it('should reject username with special characters', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      username: 'test user!',
      password: 'Password1',
    });
    expect(result.success).toBe(false);
  });

  it('should reject password without uppercase', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      username: 'testuser',
      password: 'password1',
    });
    expect(result.success).toBe(false);
  });

  it('should reject password without number', () => {
    const result = registerSchema.safeParse({
      email: 'user@example.com',
      username: 'testuser',
      password: 'Password',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid email', () => {
    const result = registerSchema.safeParse({
      email: 'not-an-email',
      username: 'testuser',
      password: 'Password1',
    });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('should accept valid input', () => {
    const result = loginSchema.safeParse({
      emailOrUsername: 'testuser',
      password: 'anypassword',
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty emailOrUsername', () => {
    const result = loginSchema.safeParse({
      emailOrUsername: '',
      password: 'password',
    });
    expect(result.success).toBe(false);
  });
});
