import { query } from '../db/connection';
import axios from 'axios';

interface VoiceSettings {
  user_id: number;
  accent: string;
  voice_gender: string;
  speech_speed: number;
}

interface STTResult {
  transcript: string;
  confidence: number;
  duration: number;
}

interface TTSResult {
  audio_url?: string;
  audio_base64?: string;
  duration: number;
}

export class VoiceService {
  private readonly novaSonicApiKey = process.env.NOVA_SONIC_API_KEY || '';
  private readonly novaSonicEndpoint = process.env.NOVA_SONIC_ENDPOINT || 'https://nova-sonic.amazonaws.com';
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  // In-memory cache for repeated phrases (in production, use Redis)
  private ttsCache: Map<string, TTSResult> = new Map();

  /**
   * Speech-to-Text using Nova Sonic
   * Target latency: < 2 seconds
   */
  async speechToText(audioData: string, format: string = 'webm'): Promise<STTResult> {
    const startTime = Date.now();

    try {
      // Validate audio data
      if (!audioData || audioData.length === 0) {
        throw new Error('Invalid audio data');
      }

      // Call Nova Sonic STT API with retry logic
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          const response = await axios.post(
            `${this.novaSonicEndpoint}/v1/speech-to-text`,
            { audio_base64: audioData, format },
            {
              headers: {
                'Authorization': `Bearer ${this.novaSonicApiKey}`,
                'Content-Type': 'application/json',
              },
              timeout: 10000,
            }
          );

          const duration = Date.now() - startTime;

          // Log performance
          console.log(`STT completed in ${duration}ms (attempt ${attempt})`);

          return {
            transcript: response.data.transcript || '',
            confidence: response.data.confidence || 0.0,
            duration,
          };
        } catch (error: any) {
          lastError = error;

          if (attempt < this.maxRetries) {
            console.warn(`STT attempt ${attempt} failed, retrying...`);
            await this.sleep(this.retryDelay * attempt);
          }
        }
      }

      throw new Error(`STT failed after ${this.maxRetries} attempts: ${lastError?.message}`);
    } catch (error: any) {
      console.error('Speech-to-text error:', error.message);
      throw new Error(`Speech-to-text failed: ${error.message}`);
    }
  }

  /**
   * Text-to-Speech using Nova Sonic with user preferences
   * Target latency: < 2 seconds
   */
  async textToSpeech(
    text: string,
    userId: number,
    useCache: boolean = true
  ): Promise<TTSResult> {
    const startTime = Date.now();

    try {
      // Validate text
      if (!text || text.trim().length === 0) {
        throw new Error('Invalid text input');
      }

      // Get user voice preferences
      const settings = await this.getVoiceSettings(userId);

      // Generate cache key
      const cacheKey = `${text}:${settings.accent}:${settings.voice_gender}:${settings.speech_speed}`;

      // Check cache
      if (useCache && this.ttsCache.has(cacheKey)) {
        console.log('TTS cache hit');
        return this.ttsCache.get(cacheKey)!;
      }

      // Call Nova Sonic TTS API with retry logic
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          const response = await axios.post(
            `${this.novaSonicEndpoint}/v1/text-to-speech`,
            {
              text: text,
              voice: {
                accent: settings.accent,
                gender: settings.voice_gender,
                speed: settings.speech_speed,
              },
              output_format: 'mp3',
            },
            {
              headers: {
                'Authorization': `Bearer ${this.novaSonicApiKey}`,
                'Content-Type': 'application/json',
              },
              timeout: 5000, // 5 second timeout
            }
          );

          const duration = Date.now() - startTime;

          // Log performance
          console.log(`TTS completed in ${duration}ms (attempt ${attempt})`);

          const result: TTSResult = {
            audio_url: response.data.audio_url,
            audio_base64: response.data.audio_base64,
            duration,
          };

          // Cache result for repeated phrases
          if (useCache && text.length < 200) {
            this.ttsCache.set(cacheKey, result);
          }

          return result;
        } catch (error: any) {
          lastError = error;

          if (attempt < this.maxRetries) {
            console.warn(`TTS attempt ${attempt} failed, retrying...`);
            await this.sleep(this.retryDelay * attempt);
          }
        }
      }

      throw new Error(`TTS failed after ${this.maxRetries} attempts: ${lastError?.message}`);
    } catch (error: any) {
      console.error('Text-to-speech error:', error.message);

      // Return text-only fallback
      return {
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Get user voice settings
   */
  async getVoiceSettings(userId: number): Promise<VoiceSettings> {
    const settings = await query<VoiceSettings[]>(
      'SELECT user_id, accent, voice_gender, speech_speed FROM voice_settings WHERE user_id = ?',
      [userId]
    );

    if (settings.length === 0) {
      // Return default settings
      return {
        user_id: userId,
        accent: 'US_ENGLISH',
        voice_gender: 'MALE',
        speech_speed: 1.0,
      };
    }

    return settings[0];
  }

  /**
   * Save user voice settings
   */
  async saveVoiceSettings(
    userId: number,
    accent: string,
    voiceGender: string,
    speechSpeed: number
  ): Promise<VoiceSettings> {
    // Validate speech speed range
    if (speechSpeed < 0.5 || speechSpeed > 2.0) {
      throw new Error('Speech speed must be between 0.5 and 2.0');
    }

    // Validate accent
    const validAccents = ['US_ENGLISH', 'UK_ENGLISH', 'AUSTRALIAN_ENGLISH', 'INDIAN_ENGLISH'];
    if (!validAccents.includes(accent)) {
      throw new Error('Invalid accent');
    }

    // Validate voice gender
    const validGenders = ['MALE', 'FEMALE'];
    if (!validGenders.includes(voiceGender)) {
      throw new Error('Invalid voice gender');
    }

    // Check if settings exist
    const existing = await query<VoiceSettings[]>(
      'SELECT user_id FROM voice_settings WHERE user_id = ?',
      [userId]
    );

    if (existing.length === 0) {
      // Insert new settings
      await query(
        'INSERT INTO voice_settings (user_id, accent, voice_gender, speech_speed) VALUES (?, ?, ?, ?)',
        [userId, accent, voiceGender, speechSpeed]
      );
    } else {
      // Update existing settings
      await query(
        'UPDATE voice_settings SET accent = ?, voice_gender = ?, speech_speed = ? WHERE user_id = ?',
        [accent, voiceGender, speechSpeed, userId]
      );
    }

    return {
      user_id: userId,
      accent,
      voice_gender: voiceGender,
      speech_speed: speechSpeed,
    };
  }

  /**
   * Clear TTS cache (for testing or memory management)
   */
  clearCache(): void {
    this.ttsCache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.ttsCache.size;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
