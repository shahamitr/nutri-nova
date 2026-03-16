import { Hono } from 'hono';
import gamificationService from '../services/GamificationService';
import { authenticate } from '../middleware/auth';

const progress = new Hono();

/**
 * GET /api/progress/user
 * Get user progress
 */
progress.get('/user', authenticate, async (c) => {
  try {
    const userId = c.get('userId');

    const userProgress = await gamificationService.getProgress(userId);

    return c.json({
      success: true,
      data: userProgress,
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message || 'Failed to get user progress',
      },
      400
    );
  }
});

/**
 * POST /api/progress/update
 * Update progress stage (internal use)
 */
progress.post('/update', authenticate, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { stage } = body;

    if (!stage || !['profile', 'bmi', 'routine', 'diet'].includes(stage)) {
      return c.json(
        {
          success: false,
          error: 'Invalid stage. Must be one of: profile, bmi, routine, diet',
        },
        400
      );
    }

    await gamificationService.updateProgress(userId, stage);

    return c.json({
      success: true,
      message: `Progress updated for stage: ${stage}`,
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message || 'Failed to update progress',
      },
      400
    );
  }
});

export default progress;
