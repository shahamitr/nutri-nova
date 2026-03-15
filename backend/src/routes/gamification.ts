import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import GamificationService from '../services/GamificationService';

const router = new Hono();

/**
 * GET /api/gamification/stats
 * Get user's gamification statistics
 */
router.get('/stats', authenticate, async (c) => {
  try {
    const userId = c.get('userId');
    const stats = await GamificationService.getUserStats(userId);

    return c.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error fetching gamification stats:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch statistics',
    }, 500);
  }
});

/**
 * GET /api/gamification/achievements
 * Get user's earned achievements
 */
router.get('/achievements', authenticate, async (c) => {
  try {
    const userId = c.get('userId');
    const achievements = await GamificationService.getUserAchievements(userId);

    return c.json({
      success: true,
      achievements,
      count: achievements.length,
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch achievements',
    }, 500);
  }
});

/**
 * GET /api/gamification/achievements/all
 * Get all available achievements
 */
router.get('/achievements/all', authenticate, async (c) => {
  try {
    const achievements = await GamificationService.getAllAchievements();

    return c.json({
      success: true,
      achievements,
      count: achievements.length,
    });
  } catch (error) {
    console.error('Error fetching all achievements:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch achievements',
    }, 500);
  }
});

/**
 * GET /api/gamification/activities
 * Get recent activities
 */
router.get('/activities', authenticate, async (c) => {
  try {
    const userId = c.get('userId');
    const limit = parseInt(c.req.query('limit') || '20');
    const activities = await GamificationService.getRecentActivities(userId, limit);

    return c.json({
      success: true,
      activities,
      count: activities.length,
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch activities',
    }, 500);
  }
});

/**
 * POST /api/gamification/activity
 * Log a new activity
 */
router.post('/activity', authenticate, async (c) => {
  try {
    const userId = c.get('userId');
    const { activity_type, metadata } = await c.req.json();

    if (!activity_type) {
      return c.json({
        success: false,
        error: 'activity_type is required',
      }, 400);
    }

    const result = await GamificationService.logActivity(userId, activity_type, metadata);

    return c.json({
      success: true,
      ...result,
      message: result.level_up
        ? `Congratulations! You leveled up to level ${result.new_level}!`
        : `You earned ${result.points_earned} points!`,
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    return c.json({
      success: false,
      error: 'Failed to log activity',
    }, 500);
  }
});

/**
 * GET /api/gamification/leaderboard
 * Get global leaderboard
 */
router.get('/leaderboard', authenticate, async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '50');
    const leaderboard = await GamificationService.getLeaderboard(limit);

    return c.json({
      success: true,
      leaderboard,
      count: leaderboard.length,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch leaderboard',
    }, 500);
  }
});

/**
 * GET /api/gamification/summary
 * Get activity summary for date range
 */
router.get('/summary', authenticate, async (c) => {
  try {
    const userId = c.get('userId');
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');

    if (!startDate || !endDate) {
      return c.json({
        success: false,
        error: 'start_date and end_date are required',
      }, 400);
    }

    const summary = await GamificationService.getActivitySummary(userId, startDate, endDate);

    return c.json({
      success: true,
      summary,
      start_date: startDate,
      end_date: endDate,
    });
  } catch (error) {
    console.error('Error fetching activity summary:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch activity summary',
    }, 500);
  }
});

export default router;
