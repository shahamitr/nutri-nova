import express from 'express';
import { authenticateToken } from '../middleware/auth';
import GamificationService from '../services/GamificationService';

const router = express.Router();

/**
 * GET /api/gamification/stats
 * Get user's gamification statistics
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const stats = await GamificationService.getUserStats(userId);

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error fetching gamification stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
});

/**
 * GET /api/gamification/achievements
 * Get user's earned achievements
 */
router.get('/achievements', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const achievements = await GamificationService.getUserAchievements(userId);

    res.json({
      success: true,
      achievements,
      count: achievements.length,
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch achievements',
    });
  }
});

/**
 * GET /api/gamification/achievements/all
 * Get all available achievements
 */
router.get('/achievements/all', authenticateToken, async (req, res) => {
  try {
    const achievements = await GamificationService.getAllAchievements();

    res.json({
      success: true,
      achievements,
      count: achievements.length,
    });
  } catch (error) {
    console.error('Error fetching all achievements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch achievements',
    });
  }
});

/**
 * GET /api/gamification/activities
 * Get recent activities
 */
router.get('/activities', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;
    const activities = await GamificationService.getRecentActivities(userId, limit);

    res.json({
      success: true,
      activities,
      count: activities.length,
    });
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activities',
    });
  }
});

/**
 * POST /api/gamification/activity
 * Log a new activity
 */
router.post('/activity', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { activity_type, metadata } = req.body;

    if (!activity_type) {
      return res.status(400).json({
        success: false,
        error: 'activity_type is required',
      });
    }

    const result = await GamificationService.logActivity(userId, activity_type, metadata);

    res.json({
      success: true,
      ...result,
      message: result.level_up
        ? `Congratulations! You leveled up to level ${result.new_level}!`
        : `You earned ${result.points_earned} points!`,
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to log activity',
    });
  }
});

/**
 * GET /api/gamification/leaderboard
 * Get global leaderboard
 */
router.get('/leaderboard', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const leaderboard = await GamificationService.getLeaderboard(limit);

    res.json({
      success: true,
      leaderboard,
      count: leaderboard.length,
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard',
    });
  }
});

/**
 * GET /api/gamification/summary
 * Get activity summary for date range
 */
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'start_date and end_date are required',
      });
    }

    const summary = await GamificationService.getActivitySummary(userId, startDate, endDate);

    res.json({
      success: true,
      summary,
      start_date: startDate,
      end_date: endDate,
    });
  } catch (error) {
    console.error('Error fetching activity summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity summary',
    });
  }
});

export default router;
