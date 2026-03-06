import { Hono } from 'hono';
import { DietService } from '../services/DietService';
import { authenticate } from '../middleware/auth';
import { apiRateLimit } from '../middleware/rateLimit';

const diet = new Hono();
const dietService = new DietService();

/**
 * POST /api/diet/generate-plan
 * Generate personalized diet plan
 */
diet.post('/generate-plan', authenticate, apiRateLimit, async (c) => {
  try {
    const userId = c.get('userId');

    const plan = await dietService.generateDietPlan(userId);

    return c.json({
      success: true,
      data: plan,
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message || 'Failed to generate diet plan',
      },
      400
    );
  }
});

/**
 * GET /api/diet/plan
 * Get most recent diet plan
 */
diet.get('/plan', authenticate, async (c) => {
  try {
    const userId = c.get('userId');

    const plan = await dietService.getDietPlan(userId);

    if (!plan) {
      return c.json(
        {
          success: false,
          error: 'No diet plan found. Please generate a diet plan first.',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: plan,
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message || 'Failed to get diet plan',
      },
      400
    );
  }
});

export default diet;
