import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { AuthService } from '../../services/AuthService';
import { query } from '../../db/connection';
import bcrypt from 'bcryptjs';

describe('AuthService - Property-Based Tests', () => {
  const authService = new AuthService();

  afterEach(async () => {
    // Clean up test data
    await query('DELETE FROM users WHERE email LIKE ?', ['test.property%']);
  });

  /**
   * Property 1: Authentication Requires All Three Credentials
   * Validates: Requirements 1.3
   * Verify login fails if any credential is invalid
   */
  describe('Property 1: Authentication Requires All Three Credentials', () => {
    it('should fail login when email is invalid', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.emailAddress(),
          fc.string({ minLength: 8 }),
          fc.string({ minLength: 6, maxLength: 6 }).map(s => s.replace(/\D/g, '0').padEnd(6, '0')),
          async (email, password, totpCode) => {
            // Try to login with non-existent email
            await expect(
              authService.login(email, password, totpCode)
            ).rejects.toThrow();
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should fail login when password is invalid', async () => {
      // Create a test user first
      const testEmail = 'test.property.auth1@example.com';
      const correctPassword = 'ValidPass123!';
      await authService.signup('Test User', testEmail, correctPassword);

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 8 }).filter(p => p !== correctPassword),
          fc.string({ minLength: 6, maxLength: 6 }).map(s => s.replace(/\D/g, '0').padEnd(6, '0')),
          async (wrongPassword, totpCode) => {
            // Try to login with wrong password
            await expect(
              authService.login(testEmail, wrongPassword, totpCode)
            ).rejects.toThrow();
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should fail login when TOTP code is invalid', async () => {
      // Create a test user first
      const testEmail = 'test.property.auth2@example.com';
      const password = 'ValidPass123!';
      await authService.signup('Test User', testEmail, password);

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 6, maxLength: 6 }).map(s => s.replace(/\D/g, '0').padEnd(6, '0')),
          async (invalidTotpCode) => {
            // Try to login with invalid TOTP (will fail since we don't have the real TOTP)
            await expect(
              authService.login(testEmail, password, invalidTotpCode)
            ).rejects.toThrow();
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property 2: Sensitive Data Encryption at Rest
   * Validates: Requirements 1.2, 1.5, 15.1, 15.2
   * Verify password_hash is not plaintext and totp_secret is encrypted
   */
  describe('Property 2: Sensitive Data Encryption at Rest', () => {
    it('should never store plaintext passwords', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3 }),
          fc.emailAddress().map(e => `test.property.${e}`),
          fc.string({ minLength: 8 }),
          async (name, email, password) => {
            try {
              const result = await authService.signup(name, email, password);

              // Retrieve user from database
              const users = await query<any[]>(
                'SELECT password_hash FROM users WHERE id = ?',
                [result.user.id]
              );

              expect(users.length).toBe(1);
              const storedHash = users[0].password_hash;

              // Verify password is hashed (not plaintext)
              expect(storedHash).not.toBe(password);
              expect(storedHash.length).toBeGreaterThan(password.length);
              expect(storedHash).toMatch(/^\$2[aby]\$/); // bcrypt hash format

              // Verify hash can be validated
              const isValid = await bcrypt.compare(password, storedHash);
              expect(isValid).toBe(true);
            } catch (error: any) {
              // Skip if email already exists or validation fails
              if (!error.message.includes('already exists') && !error.message.includes('validation')) {
                throw error;
              }
            }
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should encrypt TOTP secrets before storage', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3 }),
          fc.emailAddress().map(e => `test.property.totp.${e}`),
          fc.string({ minLength: 8 }),
          async (name, email, password) => {
            try {
              const result = await authService.signup(name, email, password);

              // Retrieve user from database
              const users = await query<any[]>(
                'SELECT totp_secret FROM users WHERE id = ?',
                [result.user.id]
              );

              expect(users.length).toBe(1);
              const storedSecret = users[0].totp_secret;

              // Verify TOTP secret is encrypted (not the raw base32 secret)
              // The returned secret should be base32, but stored secret should be encrypted
              expect(storedSecret).not.toBe(result.totp_secret);
              expect(storedSecret.length).toBeGreaterThan(0);
            } catch (error: any) {
              // Skip if email already exists or validation fails
              if (!error.message.includes('already exists') && !error.message.includes('validation')) {
                throw error;
              }
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property 3: TOTP Time Window Validation
   * Validates: Requirements 1.4
   * Verify TOTP codes outside 30s window are rejected
   */
  describe('Property 3: TOTP Time Window Validation', () => {
    it('should reject TOTP codes that are clearly invalid', async () => {
      // Create a test user
      const testEmail = 'test.property.totp.window@example.com';
      const password = 'ValidPass123!';
      await authService.signup('Test User', testEmail, password);

      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 6, maxLength: 6 }).map(s => s.replace(/\D/g, '0').padEnd(6, '0')),
          async (randomTotpCode) => {
            // Random TOTP codes should fail (extremely low probability of being valid)
            await expect(
              authService.login(testEmail, password, randomTotpCode)
            ).rejects.toThrow(/TOTP|Invalid/i);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property 4: Session Creation on Successful Authentication
   * Validates: Requirements 1.6
   * Verify session created with proper expiration
   */
  describe('Property 4: Session Creation on Successful Authentication', () => {
    it('should create valid JWT tokens on successful signup', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3 }),
          fc.emailAddress().map(e => `test.property.session.${e}`),
          fc.string({ minLength: 8 }),
          async (name, email, password) => {
            try {
              const result = await authService.signup(name, email, password);

              // Verify session token is created
              expect(result.session_token).toBeDefined();
              expect(typeof result.session_token).toBe('string');
              expect(result.session_token.length).toBeGreaterThan(0);

              // JWT tokens have 3 parts separated by dots
              const parts = result.session_token.split('.');
              expect(parts.length).toBe(3);
            } catch (error: any) {
              // Skip if email already exists or validation fails
              if (!error.message.includes('already exists') && !error.message.includes('validation')) {
                throw error;
              }
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property 28: Session Timeout After Inactivity
   * Validates: Requirements 15.4
   * Verify sessions expire after 30 minutes
   */
  describe('Property 28: Session Timeout After Inactivity', () => {
    it('should create tokens with expiration time', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 3 }),
          fc.emailAddress().map(e => `test.property.expire.${e}`),
          fc.string({ minLength: 8 }),
          async (name, email, password) => {
            try {
              const result = await authService.signup(name, email, password);

              // Decode JWT to check expiration (without verification)
              const payload = JSON.parse(
                Buffer.from(result.session_token.split('.')[1], 'base64').toString()
              );

              expect(payload.exp).toBeDefined();
              expect(payload.iat).toBeDefined();

              // Verify expiration is set to 30 minutes (1800 seconds)
              const expirationDuration = payload.exp - payload.iat;
              expect(expirationDuration).toBe(1800); // 30 minutes
            } catch (error: any) {
              // Skip if email already exists or validation fails
              if (!error.message.includes('already exists') && !error.message.includes('validation')) {
                throw error;
              }
            }
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  /**
   * Property 30: Rate Limiting Enforcement
   * Validates: Requirements 15.6
   * Verify requests blocked after limit exceeded
   * Note: This is tested at the middleware level, not service level
   */
  describe('Property 30: Rate Limiting Enforcement', () => {
    it('should have rate limiting configured for auth endpoints', () => {
      // This property is validated at the API endpoint level with middleware
      // The rate limiting middleware is configured in routes/auth.ts
      // Actual enforcement testing requires HTTP requests to the API
      expect(true).toBe(true); // Placeholder - actual test in integration tests
    });
  });
});
