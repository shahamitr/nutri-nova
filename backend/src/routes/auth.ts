import { Hono } from 'hono';
import { AuthService } from '../services/AuthService';
import { authenticate } from '../middleware/auth';
import { loginRateLimit, signupRateLimit, totpRateLimit } from '../middleware/rateLimit';

const auth = new Hono();
const authService = new AuthService();

/**
 * POST /api/auth/signup
 * User registration with TOTP setup
 */
auth.post('/signup', signupRateLimit, async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, password } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return c.json(
        {
          success: false,
          error: 'Missing required fields: name, email, password',
        },
        400
      );
    }

    // Perform signup
    const result = await authService.signup(name, email, password);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message || 'Signup failed',
      },
      400
    );
  }
});

/**
 * POST /api/auth/login
 * User login with email, password, and TOTP
 */
auth.post('/login', loginRateLimit, async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, totp_code } = body;

    // Validate required fields
    const isDev = process.env.NODE_ENV === 'development';
    if (!email || !password || (!totp_code && !isDev)) {
      return c.json(
        {
          success: false,
          error: 'Missing required fields: email, password, totp_code',
        },
        400
      );
    }

    // Perform login
    const result = await authService.login(email, password, totp_code);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message || 'Login failed',
      },
      401
    );
  }
});

/**
 * POST /api/auth/verify-totp
 * Verify TOTP code for authenticated user
 */
auth.post('/verify-totp', authenticate, totpRateLimit, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { totp_code } = body;

    if (!totp_code) {
      return c.json(
        {
          success: false,
          error: 'Missing required field: totp_code',
        },
        400
      );
    }

    const isValid = await authService.verifyTOTP(userId, totp_code);

    return c.json({
      success: true,
      data: { valid: isValid },
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message || 'TOTP verification failed',
      },
      400
    );
  }
});

/**
 * POST /api/auth/refresh
 * Refresh session token
 */
auth.post('/refresh', authenticate, async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    const token = authHeader!.substring(7);

    const newToken = authService.refreshToken(token);

    return c.json({
      success: true,
      data: { session_token: newToken },
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message || 'Token refresh failed',
      },
      401
    );
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side token invalidation)
 */
auth.post('/logout', authenticate, async (c) => {
  // In a stateless JWT system, logout is handled client-side by removing the token
  // For enhanced security, you could maintain a token blacklist in Redis
  return c.json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
});

/**
 * GET /api/auth/me
 * Get current user info
 */
auth.get('/me', authenticate, async (c) => {
  try {
    const userId = c.get('userId');
    const email = c.get('userEmail');

    return c.json({
      success: true,
      data: {
        userId,
        email,
      },
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message || 'Failed to get user info',
      },
      400
    );
  }
});

export default auth;
