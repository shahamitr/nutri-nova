import { Hono } from 'hono';
import { compress } from 'hono/compress';
import { applySecurityHeaders, applyCORS, httpsRedirect } from './middleware/security';
import { apiRateLimit } from './middleware/rateLimit';
import { bodySizeLimit, validateContentType } from './middleware/validation';
import { logger as customLogger } from './utils/logger';

const app = new Hono();

// Security middleware
app.use('*', httpsRedirect());
app.use('*', applySecurityHeaders());
app.use('*', applyCORS());

// Performance middleware
app.use('*', compress());

// Request validation middleware
app.use('*', bodySizeLimit(1024 * 1024)); // 1MB limit

// Rate limiting for API routes
app.use('/api/*', apiRateLimit);

// Logging middleware
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;

  customLogger.apiRequest(
    c.req.method,
    c.req.path,
    c.get('userId'),
    c.res.status
  );
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

// Import route modules
import authRoutes from './routes/auth';
import voiceRoutes from './routes/voice';
import healthRoutes from './routes/health';
import dietRoutes from './routes/diet';
import progressRoutes from './routes/progress';
import conversationRoutes from './routes/conversation';
import reportsRoutes from './routes/reports';
import contentRoutes from './routes/content';
import memoryRoutes from './routes/memory';
import gamificationRoutes from './routes/gamification';

// Register API routes
app.route('/api/auth', authRoutes);
app.route('/api/voice', voiceRoutes);
app.route('/api/health', healthRoutes);
app.route('/api/diet', dietRoutes);
app.route('/api/progress', progressRoutes);
app.route('/api/conversation', conversationRoutes);
app.route('/api/reports', reportsRoutes);
app.route('/api/content', contentRoutes);
app.route('/api/memory', memoryRoutes);
app.route('/api/gamification', gamificationRoutes);

// API root endpoint
app.get('/api', (c) => {
  return c.json({
    success: true,
    data: {
      message: 'NutriVoice AI Diet Planner API',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        voice: '/api/voice',
        health: '/api/health',
        diet: '/api/diet',
        progress: '/api/progress',
        conversation: '/api/conversation',
        reports: '/api/reports',
        content: '/api/content',
        memory: '/api/memory',
        gamification: '/api/gamification',
      },
    },
  });
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: 'Not Found',
    },
    404
  );
});

// Error handler
app.onError((err, c) => {
  // Log error with context (excluding sensitive data)
  customLogger.error('Server error', {
    path: c.req.path,
    method: c.req.method,
    userId: c.get('userId'),
  }, err);

  // Return generic error message (don't expose internals)
  return c.json(
    {
      success: false,
      error: process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : err.message,
    },
    500
  );
});

const port = parseInt(process.env.PORT || '3001');

console.log(`🚀 Server starting on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
