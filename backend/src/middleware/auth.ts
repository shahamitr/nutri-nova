import { Context, Next } from 'hono';
import { AuthService } from '../services/AuthService';

const authService = new AuthService();

/**
 * Authentication middleware - verifies JWT token
 */
export const authenticate = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, error: 'Missing or invalid authorization header' }, 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = authService.verifyToken(token);

    // Attach user info to context
    c.set('userId', decoded.userId);
    c.set('userEmail', decoded.email);

    await next();
  } catch (error) {
    return c.json({ success: false, error: 'Invalid or expired session token' }, 401);
  }
};

/**
 * Optional authentication - doesn't fail if token is missing
 */
export const optionalAuth = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = authService.verifyToken(token);
      c.set('userId', decoded.userId);
      c.set('userEmail', decoded.email);
    }

    await next();
  } catch (error) {
    // Continue without authentication
    await next();
  }
};
