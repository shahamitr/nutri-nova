import express from 'express';
import { authenticateToken } from '../middleware/auth';
import ConversationMemoryService from '../services/ConversationMemoryService';

const router = express.Router();

/**
 * GET /api/memory
 * Get all memories for the authenticated user
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 50;

    const memories = await ConversationMemoryService.getUserMemories(userId, limit);

    res.json({
      success: true,
      memories,
      count: memories.length
    });
  } catch (error) {
    console.error('Error fetching memories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch memories'
    });
  }
});

/**
 * GET /api/memory/type/:type
 * Get memories by type
 */
router.get('/type/:type', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const type = req.params.type as 'preference' | 'fact' | 'goal' | 'concern' | 'restriction';
    const limit = parseInt(req.query.limit as string) || 20;

    const memories = await ConversationMemoryService.getMemoriesByType(userId, type, limit);

    res.json({
      success: true,
      memories,
      count: memories.length
    });
  } catch (error) {
    console.error('Error fetching memories by type:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch memories'
    });
  }
});

/**
 * GET /api/memory/search
 * Search memories by content
 */
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const searchTerm = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        error: 'Search term is required'
      });
    }

    const memories = await ConversationMemoryService.searchMemories(userId, searchTerm, limit);

    res.json({
      success: true,
      memories,
      count: memories.length
    });
  } catch (error) {
    console.error('Error searching memories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search memories'
    });
  }
});

/**
 * GET /api/memory/stats
 * Get memory statistics for the user
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;

    const stats = await ConversationMemoryService.getMemoryStats(userId);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching memory stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch memory statistics'
    });
  }
});

/**
 * POST /api/memory
 * Manually add a memory
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { memory_type, content, importance } = req.body;

    if (!memory_type || !content) {
      return res.status(400).json({
        success: false,
        error: 'memory_type and content are required'
      });
    }

    const memoryId = await ConversationMemoryService.storeMemory({
      user_id: userId,
      memory_type,
      content,
      importance: importance || 5
    });

    res.json({
      success: true,
      memory_id: memoryId,
      message: 'Memory stored successfully'
    });
  } catch (error) {
    console.error('Error storing memory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to store memory'
    });
  }
});

/**
 * PUT /api/memory/:id/importance
 * Update memory importance
 */
router.put('/:id/importance', authenticateToken, async (req, res) => {
  try {
    const memoryId = parseInt(req.params.id);
    const { importance } = req.body;

    if (!importance || importance < 1 || importance > 10) {
      return res.status(400).json({
        success: false,
        error: 'Importance must be between 1 and 10'
      });
    }

    await ConversationMemoryService.updateImportance(memoryId, importance);

    res.json({
      success: true,
      message: 'Memory importance updated'
    });
  } catch (error) {
    console.error('Error updating memory importance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update memory importance'
    });
  }
});

/**
 * DELETE /api/memory/:id
 * Deactivate a memory (soft delete)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const memoryId = parseInt(req.params.id);

    await ConversationMemoryService.deactivateMemory(memoryId);

    res.json({
      success: true,
      message: 'Memory deactivated successfully'
    });
  } catch (error) {
    console.error('Error deactivating memory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deactivate memory'
    });
  }
});

export default router;
