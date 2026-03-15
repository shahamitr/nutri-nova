import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import ConversationMemoryService from '../services/ConversationMemoryService';

const router = new Hono();

/**
 * GET /api/memory
 * Get all memories for the authenticated user
 */
router.get('/', authenticate, async (c) => {
  try {
    const userId = c.get('userId');
    const limit = parseInt(c.req.query('limit') || '50');

    const memories = await ConversationMemoryService.getUserMemories(userId, limit);

    return c.json({
      success: true,
      memories,
      count: memories.length
    });
  } catch (error) {
    console.error('Error fetching memories:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch memories'
    }, 500);
  }
});

/**
 * GET /api/memory/type/:type
 * Get memories by type
 */
router.get('/type/:type', authenticate, async (c) => {
  try {
    const userId = c.get('userId');
    const type = c.req.param('type') as 'preference' | 'fact' | 'goal' | 'concern' | 'restriction';
    const limit = parseInt(c.req.query('limit') || '20');

    const memories = await ConversationMemoryService.getMemoriesByType(userId, type, limit);

    return c.json({
      success: true,
      memories,
      count: memories.length
    });
  } catch (error) {
    console.error('Error fetching memories by type:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch memories'
    }, 500);
  }
});

/**
 * GET /api/memory/search
 * Search memories by content
 */
router.get('/search', authenticate, async (c) => {
  try {
    const userId = c.get('userId');
    const searchTerm = c.req.query('q');
    const limit = parseInt(c.req.query('limit') || '10');

    if (!searchTerm) {
      return c.json({
        success: false,
        error: 'Search term is required'
      }, 400);
    }

    const memories = await ConversationMemoryService.searchMemories(userId, searchTerm, limit);

    return c.json({
      success: true,
      memories,
      count: memories.length
    });
  } catch (error) {
    console.error('Error searching memories:', error);
    return c.json({
      success: false,
      error: 'Failed to search memories'
    }, 500);
  }
});

/**
 * GET /api/memory/stats
 * Get memory statistics for the user
 */
router.get('/stats', authenticate, async (c) => {
  try {
    const userId = c.get('userId');

    const stats = await ConversationMemoryService.getMemoryStats(userId);

    return c.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching memory stats:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch memory statistics'
    }, 500);
  }
});

/**
 * POST /api/memory
 * Manually add a memory
 */
router.post('/', authenticate, async (c) => {
  try {
    const userId = c.get('userId');
    const { memory_type, content, importance } = await c.req.json();

    if (!memory_type || !content) {
      return c.json({
        success: false,
        error: 'memory_type and content are required'
      }, 400);
    }

    const memoryId = await ConversationMemoryService.storeMemory({
      user_id: userId,
      memory_type,
      content,
      importance: importance || 5
    });

    return c.json({
      success: true,
      memory_id: memoryId,
      message: 'Memory stored successfully'
    });
  } catch (error) {
    console.error('Error storing memory:', error);
    return c.json({
      success: false,
      error: 'Failed to store memory'
    }, 500);
  }
});

/**
 * PUT /api/memory/:id/importance
 * Update memory importance
 */
router.put('/:id/importance', authenticate, async (c) => {
  try {
    const memoryId = parseInt(c.req.param('id'));
    const { importance } = await c.req.json();

    if (!importance || importance < 1 || importance > 10) {
      return c.json({
        success: false,
        error: 'Importance must be between 1 and 10'
      }, 400);
    }

    await ConversationMemoryService.updateImportance(memoryId, importance);

    return c.json({
      success: true,
      message: 'Memory importance updated'
    });
  } catch (error) {
    console.error('Error updating memory importance:', error);
    return c.json({
      success: false,
      error: 'Failed to update memory importance'
    }, 500);
  }
});

/**
 * DELETE /api/memory/:id
 * Deactivate a memory (soft delete)
 */
router.delete('/:id', authenticate, async (c) => {
  try {
    const memoryId = parseInt(c.req.param('id'));

    await ConversationMemoryService.deactivateMemory(memoryId);

    return c.json({
      success: true,
      message: 'Memory deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating memory:', error);
    return c.json({
      success: false,
      error: 'Failed to deactivate memory'
    }, 500);
  }
});

export default router;
