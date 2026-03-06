import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { query } from '../db/connection';
import crypto from 'crypto';

interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  totp_secret: string;
  created_at: Date;
}

interface SignupResult {
  user: {
    id: number;
    name: string;
    email: string;
    created_at: Date;
  };
  totp_secret: string;
  qr_code_url: string;
}

interface LoginResult {
  user: {
    id: number;
    name: string;
    email: string;
    created_at: Date;
  };
  session_token: string;
}

export class AuthService {
  private readonly bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
  private readonly jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
  private readonly sessionTimeout = parseInt(process.env.SESSION_TIMEOUT || '1800'); // 30 minutes
  private readonly encryptionKey = process.env.TOTP_ENCRYPTION_KEY || 'your-32-character-encryption-key';

  /**
   * Encrypt TOTP secret before storing in database
   */
  private encryptTOTPSecret(secret: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt TOTP secret from database
   */
  private decryptTOTPSecret(encryptedSecret: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);

    const parts = encryptedSecret.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Validate email format
   */
  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   * Requirements: min 8 chars, at least one uppercase, one lowercase, one number, one special char
   */
  private validatePassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one number' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { valid: false, message: 'Password must contain at least one special character' };
    }
    return { valid: true };
  }

  /**
   * User signup with TOTP setup
   */
  async signup(name: string, email: string, password: string): Promise<SignupResult> {
    // Validate email format
    if (!this.validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Validate password strength
    const passwordValidation = this.validatePassword(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.message || 'Invalid password');
    }

    // Check if email already exists
    const existingUsers = await query<User[]>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, this.bcryptRounds);

    // Generate TOTP secret
    const totpSecret = speakeasy.generateSecret({
      name: `NutriVoice AI (${email})`,
      length: 32,
    });

    // Encrypt TOTP secret
    const encryptedSecret = this.encryptTOTPSecret(totpSecret.base32);

    // Generate QR code URL
    const qrCodeUrl = await QRCode.toDataURL(totpSecret.otpauth_url || '');

    // Insert user into database
    const result = await query<any>(
      'INSERT INTO users (name, email, password_hash, totp_secret) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, encryptedSecret]
    );

    const userId = result.insertId;

    // Initialize user progress
    await query(
      'INSERT INTO user_progress (user_id) VALUES (?)',
      [userId]
    );

    // Initialize voice settings with defaults
    await query(
      'INSERT INTO voice_settings (user_id) VALUES (?)',
      [userId]
    );

    return {
      user: {
        id: userId,
        name,
        email,
        created_at: new Date(),
      },
      totp_secret: totpSecret.base32,
      qr_code_url: qrCodeUrl,
    };
  }

  /**
   * User login with email, password, and TOTP verification
   */
  async login(email: string, password: string, totpCode: string): Promise<LoginResult> {
    // Retrieve user from database
    const users = await query<User[]>(
      'SELECT id, name, email, password_hash, totp_secret, created_at FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = users[0];

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      throw new Error('Invalid credentials');
    }

    // Decrypt TOTP secret
    const totpSecret = this.decryptTOTPSecret(user.totp_secret);

    // Verify TOTP code (30-second time window)
    const totpValid = speakeasy.totp.verify({
      secret: totpSecret,
      encoding: 'base32',
      token: totpCode,
      window: 1, // Allow 1 step before/after (30 seconds each side)
    });

    if (!totpValid) {
      throw new Error('Invalid TOTP code');
    }

    // Generate JWT session token
    const sessionToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      this.jwtSecret,
      {
        expiresIn: this.sessionTimeout, // 30 minutes
      }
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
      },
      session_token: sessionToken,
    };
  }

  /**
   * Verify JWT session token
   */
  verifyToken(token: string): { userId: number; email: string } {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as {
        userId: number;
        email: string;
      };
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired session token');
    }
  }

  /**
   * Refresh session token (extend expiration)
   */
  refreshToken(token: string): string {
    const decoded = this.verifyToken(token);

    // Generate new token with extended expiration
    const newToken = jwt.sign(
      {
        userId: decoded.userId,
        email: decoded.email,
      },
      this.jwtSecret,
      {
        expiresIn: this.sessionTimeout,
      }
    );

    return newToken;
  }

  /**
   * Verify TOTP code only (for re-verification scenarios)
   */
  async verifyTOTP(userId: number, totpCode: string): Promise<boolean> {
    const users = await query<User[]>(
      'SELECT totp_secret FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      throw new Error('User not found');
    }

    const totpSecret = this.decryptTOTPSecret(users[0].totp_secret);

    return speakeasy.totp.verify({
      secret: totpSecret,
      encoding: 'base32',
      token: totpCode,
      window: 1,
    });
  }
}
