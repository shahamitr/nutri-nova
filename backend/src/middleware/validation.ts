import { Context, Next } from 'hono';
import { z } from 'zod';

// Input sanitization to prevent SQL injection and XSS
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return input;

  // Remove SQL injection patterns
  let sanitized = input
    .replace(/['";\\]/g, '') // Remove quotes and backslashes
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove multi-line comment start
    .replace(/\*\//g, ''); // Remove multi-line comment end

  // Escape HTML/XSS patterns
  sanitized = sanitized
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  return sanitized;
}

// Validate and sanitize request body
export function validateBody(schema: z.ZodSchema) {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();

      // Validate with Zod schema
      const validated = schema.parse(body);

      // Store validated data
      c.set('validatedBody', validated);

      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            success: false,
            error: 'Validation failed',
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
          400
        );
      }
      return c.json({ success: false, error: 'Invalid request body' }, 400);
    }
  };
}

// Request body size limit middleware
export function bodySizeLimit(maxSize: number = 1024 * 1024) {
  return async (c: Context, next: Next) => {
    const contentLength = c.req.header('content-length');

    if (contentLength && parseInt(contentLength) > maxSize) {
      return c.json(
        { success: false, error: 'Request body too large' },
        413
      );
    }

    await next();
  };
}

// Content-Type validation
export function validateContentType(allowedTypes: string[]) {
  return async (c: Context, next: Next) => {
    const contentType = c.req.header('content-type');

    if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
      return c.json(
        { success: false, error: 'Invalid content type' },
        415
      );
    }

    await next();
  };
}

// Common validation schemas
export const schemas = {
  signup: z.object({
    name: z.string().min(1).max(100),
    email: z.string().email().max(255),
    password: z.string().min(8).max(128),
  }),

  login: z.object({
    email: z.string().email(),
    password: z.string(),
    totpCode: z.string().length(6).regex(/^\d{6}$/),
  }),

  healthProfile: z.object({
    age: z.number().int().min(1).max(120),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
    height_cm: z.number().min(50).max(250),
    weight_kg: z.number().min(20).max(300),
    diet_preference: z.enum(['VEGETARIAN', 'EGGETARIAN', 'NON_VEGETARIAN']),
    activity_level: z.enum(['SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE']).optional(),
    sleep_hours: z.number().min(0).max(24).optional(),
    stress_level: z.enum(['LOW', 'MODERATE', 'HIGH']).optional(),
    medical_conditions: z.string().max(500).optional(),
  }),

  voiceSettings: z.object({
    accent: z.enum(['US_ENGLISH', 'UK_ENGLISH', 'AUSTRALIAN_ENGLISH', 'INDIAN_ENGLISH']),
    voice_gender: z.enum(['MALE', 'FEMALE']),
    speech_speed: z.number().min(0.5).max(2.0),
  }),
};
