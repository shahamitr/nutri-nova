import { Hono } from 'hono';
import { VoiceService } from '../services/VoiceService';
import { authenticate } from '../middleware/auth';
import { apiRateLimit } from '../middleware/rateLimit';

const voice = new Hono();
const voiceService = new VoiceService();

/**
 * POST /api/voice/process-speech
 * Process speech input (STT)
 */
voice.post('/process-speech', authenticate, apiRateLimit, async (c) => {
  try {
    const body = await c.req.json();
    const { audio_data, format } = body;

    if (!audio_data) {
      return c.json(
        {
          success: false,
          error: 'Missing required field: audio_data',
        },
        400
      );
    }

    const result = await voiceService.speechToText(audio_data, format || 'webm');

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message || 'Speech processing failed',
      },
      400
    );
  }
});

/**
 * POST /api/voice/generate-response
 * Generate speech output (TTS)
 */
voice.post('/generate-response', authenticate, apiRateLimit, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { text, use_cache } = body;

    if (!text) {
      return c.json(
        {
          success: false,
          error: 'Missing required field: text',
        },
        400
      );
    }

    const result = await voiceService.textToSpeech(
      text,
      userId,
      use_cache !== false // Default to true
    );

    return c.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message || 'Speech generation failed',
      },
      400
    );
  }
});

/**
 * GET /api/voice/settings
 * Get user voice preferences
 */
voice.get('/settings', authenticate, async (c) => {
  try {
    const userId = c.get('userId');

    const settings = await voiceService.getVoiceSettings(userId);

    return c.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message || 'Failed to get voice settings',
      },
      400
    );
  }
});

/**
 * POST /api/voice/settings
 * Save user voice preferences
 */
voice.post('/settings', authenticate, async (c) => {
  try {
    const userId = c.get('userId');
    const body = await c.req.json();
    const { accent, voice_gender, speech_speed } = body;

    if (!accent || !voice_gender || speech_speed === undefined) {
      return c.json(
        {
          success: false,
          error: 'Missing required fields: accent, voice_gender, speech_speed',
        },
        400
      );
    }

    const settings = await voiceService.saveVoiceSettings(
      userId,
      accent,
      voice_gender,
      speech_speed
    );

    return c.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: error.message || 'Failed to save voice settings',
      },
      400
    );
  }
});

export default voice;
