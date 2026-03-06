import { Hono } from 'hono';
import { ConversationManager } from '../services/ConversationManager';
import { VoiceService } from '../services/VoiceService';
import { authenticate } from '../middleware/auth';
import { apiRateLimit } from '../middleware/rateLimit';
import { query } from '../db/connection';

const conversation = new Hono();
const conversationManager = new ConversationManager();
const voiceService = new VoiceService();

/**
 * POST /api/conversation/start
 * Start a new conversation session
 */
conversation.post('/start', authenticate, async (c) => {
  try {
    const userId = c.get('userId');

    // Get user name
    const users = await query<any[]>(
      'SELECT name FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return c.json(
        {
          success: false,
          error: 'User not found',
        },
        404
      );
    }

    const userName = users[0].name;

    // Start conversation session
    const result = await conversationManager.startSession(userId, userName);

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message || 'Failed to start conversation',
      },
      400
    );
  }
});

/**
 * POST /api/conversation/message
 * Process user message (text or voice)
 */
conversation.post('/message', authenticate, apiRateLimit, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { session_id, message, audio_data } = body;

    if (!session_id) {
      return c.json(
        {
          success: false,
          error: 'Missing required field: session_id',
        },
        400
      );
    }

    // Verify session belongs to user
    const state = conversationManager.getConversationState(session_id);
    if (!state) {
      return c.json(
        {
          success: false,
          error: 'Session not found or expired',
        },
        404
      );
    }

    if (state.user_id !== userId) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized access to session',
        },
        403
      );
    }

    let userMessage = message;

    // If audio data provided, convert to text
    if (audio_data) {
      const sttResult = await voiceService.speechToText(audio_data);
      userMessage = sttResult.transcript;
    }

    if (!userMessage) {
      return c.json(
        {
          success: false,
          error: 'No message or audio data provided',
        },
        400
      );
    }

    // Process the message
    const result = await conversationManager.processResponse(session_id, userMessage);

    // Generate TTS for AI response
    let audioUrl: string | undefined;
    try {
      const ttsResult = await voiceService.textToSpeech(result.ai_response, userId);
      audioUrl = ttsResult.audio_url || ttsResult.audio_base64;
    } catch (error) {
      console.warn('TTS generation failed, continuing with text only');
    }

    return c.json({
      success: true,
      data: {
        user_message: userMessage,
        ai_response: result.ai_response,
        audio_url: audioUrl,
        conversation_complete: result.conversation_complete,
        collected_data: result.collected_data,
      },
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message || 'Failed to process message',
      },
      400
    );
  }
});

/**
 * GET /api/conversation/history/:sessionId
 * Get conversation history
 */
conversation.get('/history/:sessionId', authenticate, async (c) => {
  try {
    const userId = c.get('userId');
    const sessionId = c.req.param('sessionId');

    // Verify session belongs to user
    const state = conversationManager.getConversationState(sessionId);
    if (!state) {
      return c.json(
        {
          success: false,
          error: 'Session not found or expired',
        },
        404
      );
    }

    if (state.user_id !== userId) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized access to session',
        },
        403
      );
    }

    const history = conversationManager.getConversationHistory(sessionId);

    return c.json({
      success: true,
      data: {
        session_id: sessionId,
        history,
        stage: state.stage,
        collected_data: state.collected_data,
      },
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message || 'Failed to get conversation history',
      },
      400
    );
  }
});

/**
 * DELETE /api/conversation/:sessionId
 * End conversation session
 */
conversation.delete('/:sessionId', authenticate, async (c) => {
  try {
    const userId = c.get('userId');
    const sessionId = c.req.param('sessionId');

    // Verify session belongs to user
    const state = conversationManager.getConversationState(sessionId);
    if (state && state.user_id !== userId) {
      return c.json(
        {
          success: false,
          error: 'Unauthorized access to session',
        },
        403
      );
    }

    conversationManager.deleteSession(sessionId);

    return c.json({
      success: true,
      data: { message: 'Session ended successfully' },
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message || 'Failed to end session',
      },
      400
    );
  }
});

/**
 * GET /api/conversation/stats
 * Get conversation statistics (for monitoring)
 */
conversation.get('/stats', authenticate, async (c) => {
  try {
    const activeSessionCount = conversationManager.getActiveSessionCount();

    return c.json({
      success: true,
      data: {
        active_sessions: activeSessionCount,
      },
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message || 'Failed to get stats',
      },
      400
    );
  }
});

export default conversation;
