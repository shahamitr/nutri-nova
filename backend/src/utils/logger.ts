// Logging utility with sensitive data exclusion

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
}

// Sensitive fields to exclude from logs
const SENSITIVE_FIELDS = [
  'password',
  'password_hash',
  'totp_secret',
  'totpCode',
  'token',
  'accessToken',
  'refreshToken',
  'authorization',
  'cookie',
];

// Mask email addresses (show first 2 chars + domain)
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  return `${local.substring(0, 2)}***@${domain}`;
}

// Recursively sanitize object to remove sensitive data
function sanitizeData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    // Check if it looks like an email
    if (data.includes('@') && data.includes('.')) {
      return maskEmail(data);
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();

      // Exclude sensitive fields
      if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
        sanitized[key] = '***REDACTED***';
      } else if (lowerKey === 'email') {
        sanitized[key] = typeof value === 'string' ? maskEmail(value) : value;
      } else {
        sanitized[key] = sanitizeData(value);
      }
    }

    return sanitized;
  }

  return data;
}

// Format loUG];
    return levels.indexOf(level) <= levels.indexOf(this.minLevel);
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error) {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } as any : undefined,
    };

    const formatted = formatLogEntry(entry);

    // Output to console (in production, this would go to a logging service)
    if (level === LogLevel.ERROR) {
      console.error(formatted);
    } else if (level === LogLevel.WARN) {
      console.warn(formatted);
    } else {
      console.log(formatted);
    }
  }

  error(message: string, context?: Record<string, any>, error?: Error) {
    this.log(LogLevel.ERROR, message, context, error);
  }

  warn(message: string, context?: Record<string, any>) {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, context);
  }

  // Log authentication attempts
  authAttempt(email: string, success: boolean, reason?: string) {
    this.info('Authentication attempt', {
      email: maskEmail(email),
      success,
      reason,
    });
  }

  // Log API requests (excluding sensitive headers)
  apiRequest(method: string, path: string, userId?: number, statusCode?: number) {
    this.info('API request', {
      method,
      path,
      userId,
      statusCode,
    });
  }
}

// Export singleton instance
export const logger = new Logger();
