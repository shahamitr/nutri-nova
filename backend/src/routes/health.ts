import { Hono } from 'hono';
import { HealthService } from '../services/HealthService';
import { authenticate } from '../middleware/auth';
import { apiRateLimit } from '../middleware/rateLimit';

const health = new Hono();
const healthService = new HealthService();

/**
 * POST /api/health/profile
 * Save health profile
 */
health.post('/profile', authenticate, apiRateLimit, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();

    const profile = {
      user_id: userId,
      age: body.age,
      gender: body.gender,
      height_cm: body.height_cm,
      weight_kg: body.weight_kg,
      diet_preference: body.diet_preference,
      activity_level: body.activity_level,
      sleep_hours: body.sleep_hours,
      stress_level: body.stress_level,
      medical_conditions: body.medical_conditions,
    };

    const savedProfile = await healthService.saveHealthProfile(profile);

    return c.json({
      success: true,
      data: savedProfile,
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message || 'Failed to save health profile',
      },
      400
    );
  }
});

/**
 * GET /api/health/profile
 * Get health profile
 */
health.get('/profile', authenticate, async (c) => {
  try {
    const userId = c.get('userId');

    const profile = await healthService.getHealthProfile(userId);

    if (!profile) {
      return c.json(
        {
          success: false,
          error: 'Health profile not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message || 'Failed to get health profile',
      },
      400
    );
  }
});

/**
 * POST /api/health/bmi
 * Calculate BMI
 */
health.post('/bmi', authenticate, async (c) => {
  try {
    const userId = c.get('userId');

    const result = await healthService.calculateBMI(userId);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message || 'Failed to calculate BMI',
      },
      400
    );
  }
});

/**
 * GET /api/health/bmi/history
 * Get BMI history
 */
health.get('/bmi/history', authenticate, async (c) => {
  try {
    const userId = c.get('userId');

    const history = await healthService.getBMIHistory(userId);

    return c.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message || 'Failed to get BMI history',
      },
      400
    );
  }
});

export default health;
