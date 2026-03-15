import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { ContentRecommendationService } from '../services/ContentRecommendationService';
import { query } from '../db/connection';

const app = new Hono();
const contentService = new ContentRecommendationService();

/**
 * Get personalized exercise videos
 * GET /exercises
 */
app.get('/exercises', authenticate, async (c) => {
  try {
    const userId = c.get('userId');

    // Get user's health profile
    const profiles = await query<any[]>(
      'SELECT * FROM health_profile WHERE user_id = ?',
      [userId]
    );

    const profile = profiles.length > 0 ? profiles[0] : {};

    // Get exercise videos
    const videos = await contentService.getExerciseVideos(profile);

    return c.json({
      success: true,
      data: {
        videos,
        count: videos.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching exercise videos:', error);
    return c.json(
      {
        success: false,
        message: error.message || 'Failed to fetch exercise videos',
      },
      500
    );
  }
});

/**
 * Get recipe videos
 * GET /recipes?mealType=breakfast
 */
app.get('/recipes', authenticate, async (c) => {
  try {
    const userId = c.get('userId');
    const mealType = c.req.query('mealType'); // breakfast, lunch, dinner, snack

    // Get user's health profile
    const profiles = await query<any[]>(
      'SELECT * FROM health_profile WHERE user_id = ?',
      [userId]
    );

    const profile = profiles.length > 0 ? profiles[0] : {};

    // Get recipe videos
    const videos = await contentService.getRecipeVideos(profile, mealType);

    return c.json({
      success: true,
      data: {
        videos,
        count: videos.length,
        mealType: mealType || 'all',
      },
    });
  } catch (error: any) {
    console.error('Error fetching recipe videos:', error);
    return c.json(
      {
        success: false,
        message: error.message || 'Failed to fetch recipe videos',
      },
      500
    );
  }
});

/**
 * Get wellness videos
 * GET /wellness?topic=meditation
 */
app.get('/wellness', authenticate, async (c) => {
  try {
    const topic = c.req.query('topic') || 'wellness'; // meditation, sleep, stress, wellness

    // Get wellness videos
    const videos = await contentService.getWellnessVideos(topic);

    return c.json({
      success: true,
      data: {
        videos,
        count: videos.length,
        topic,
      },
    });
  } catch (error: any) {
    console.error('Error fetching wellness videos:', error);
    return c.json(
      {
        success: false,
        message: error.message || 'Failed to fetch wellness videos',
      },
      500
    );
  }
});

/**
 * Save favorite video
 * POST /favorites
 */
app.post('/favorites', authenticate, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { videoId, title, thumbnail, url, category } = body;

    // Check if already favorited
    const existing = await query<any[]>(
      'SELECT id FROM user_favorite_videos WHERE user_id = ? AND video_id = ?',
      [userId, videoId]
    );

    if (existing.length > 0) {
      return c.json({
        success: true,
        message: 'Video already in favorites',
      });
    }

    // Save favorite
    await query(
      `INSERT INTO user_favorite_videos (user_id, video_id, title, thumbnail, url, category)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, videoId, title, thumbnail, url, category]
    );

    return c.json({
      success: true,
      message: 'Video added to favorites',
    });
  } catch (error: any) {
    console.error('Error saving favorite:', error);
    return c.json(
      {
        success: false,
        message: 'Failed to save favorite',
      },
      500
    );
  }
});

/**
 * Get user's favorite videos
 * GET /favorites
 */
app.get('/favorites', authenticate, async (c) => {
  try {
    const userId = c.get('userId');
    const category = c.req.query('category'); // exercise, recipe, wellness

    let sql = 'SELECT * FROM user_favorite_videos WHERE user_id = ?';
    const params: any[] = [userId];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    sql += ' ORDER BY saved_at DESC';

    const favorites = await query<any[]>(sql, params);

    return c.json({
      success: true,
      data: {
        favorites,
        count: favorites.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching favorites:', error);
    return c.json(
      {
        success: false,
        message: 'Failed to fetch favorites',
      },
      500
    );
  }
});

/**
 * Remove favorite video
 * DELETE /favorites/:videoId
 */
app.delete('/favorites/:videoId', authenticate, async (c) => {
  try {
    const userId = c.get('userId');
    const videoId = c.req.param('videoId');

    await query(
      'DELETE FROM user_favorite_videos WHERE user_id = ? AND video_id = ?',
      [userId, videoId]
    );

    return c.json({
      success: true,
      message: 'Video removed from favorites',
    });
  } catch (error: any) {
    console.error('Error removing favorite:', error);
    return c.json(
      {
        success: false,
        message: 'Failed to remove favorite',
      },
      500
    );
  }
});

export default app;
