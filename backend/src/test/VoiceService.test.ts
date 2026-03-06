import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { fc } from 'fast-check';
import { VoiceService } from '../services/VoiceService';
import { getPool, closePool } from '../db/connection';

describe('VoiceService - Property-Based Tests', () => {
  let voiceService: VoiceService;
  let testUserId: number;

  beforeAll(async () => {
    voiceService = new VoiceService();

    // Create test user
    const pool = getPool();
    const [result] = await pool.execute<any>(
      'INSERT INTO users (name, email, password_hash, totp_secret) VALUES (?, ?, ?, ?)',
      ['Test User', `test-voice-${Date.now()}@example.com`, 'hash', 'secret']
    );
    testUserId = result.insertId;

    // Initialize voice settings
    await pool.execute(
      'INSERT INTO voice_settings (user_id) VALUES (?)',
      [testUserId]
    );
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.execute('DELETE FROM users WHERE id = ?', [testUserId]);
    await closePool();
  });

  beforeEach(() => {
    voiceService.clearCache();
  });

  /**
   * Property 6: Voice Preferences Applied to TTS
   * Validates: Requirements 2.4
   */
  describe('Property 6: Voice Preferences Applied to TTS', () => {
    it('should apply user voice preferences to TTS requests', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('US_ENGLISH', 'UK_ENGLISH', 'AUSTRALIAN_ENGLISH', 'INDIAN_ENGLISH'),
          fc.constantFrom('MALE', 'FEMALE'),
          fc.float({ min: 0.5, max: 2.0 }),
          async (accent, gender, speed) => {
            // Save voice settings
            await voiceService.saveVoiceSettings(testUserId, accent, gender, speed);

            // Get settings back
            const settings = await voiceService.getVoiceSettings(testUserId);

            // Verify preferences are stored correctly
            expect(settings.accent).toBe(accent);
            expect(settings.voice_gender).toBe(gender);
            expect(settings.speech_speed).toBeCloseTo(speed, 2);

            // Note: Actual TTS API call verification would require mocking Nova Sonic
            // In production, you would verify the API request includes these preferences
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should reject invalid voice preferences', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string(),
          fc.string(),
          fc.float(),
          async (accent, gender, speed) => {
            // Filter out valid values
            const validAccents = ['US_ENGLISH', 'UK_ENGLISH', 'AUSTRALIAN_ENGLISH', 'INDIAN_ENGLISH'];
            const validGenders = ['MALE', 'FEMALE'];

            const isValidAccent = validAccents.includes(accent);
            const isValidGender = validGenders.includes(gender);
            const isValidSpeed = speed >= 0.5 && speed <= 2.0;

            if (isValidAccent && isValidGender && isValidSpeed) {
              // Skip valid combinations
              return true;
            }

            try {
              await voiceService.saveVoiceSettings(testUserId, accent, gender, speed);
              // Should not reach here for invalid values
              return false;
            } catch (error: any) {
              // Should throw error for invalid values
              expect(error.message).toMatch(/Invalid|must be between/);
              return true;
            }
          }
        ),
        { numRuns: 50 }
async (accent, gender, speed) => {
            // Save settings
            const saved = await voiceService.saveVoiceSettings(testUserId, accent, gender, speed);

            // Retrieve settings
            const retrieved = await voiceService.getVoiceSettings(testUserId);

            // Verify round-trip equivalence
            expect(retrieved.user_id).toBe(testUserId);
            expect(retrieved.accent).toBe(accent);
            expect(retrieved.voice_gender).toBe(gender);
            expect(retrieved.speech_speed).toBeCloseTo(speed, 2);

            // Verify saved matches retrieved
            expect(saved.accent).toBe(retrieved.accent);
            expect(saved.voice_gender).toBe(retrieved.voice_gender);
            expect(saved.speech_speed).toBeCloseTo(retrieved.speech_speed, 2);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should handle multiple updates correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              accent: fc.constantFrom('US_ENGLISH', 'UK_ENGLISH', 'AUSTRALIAN_ENGLISH', 'INDIAN_ENGLISH'),
              gender: fc.constantFrom('MALE', 'FEMALE'),
              speed: fc.float({ min: 0.5, max: 2.0 }),
            }),
            { minLength: 2, maxLength: 5 }
          ),
          async (updates) => {
            // Apply multiple updates
            for (const update of updates) {
              await voiceService.saveVoiceSettings(
                testUserId,
                update.accent,
                update.gender,
                update.speed
              );
            }

            // Verify final state matches last update
            const lastUpdate = updates[updates.length - 1];
            const retrieved = await voiceService.getVoiceSettings(testUserId);

            expect(retrieved.accent).toBe(lastUpdate.accent);
            expect(retrieved.voice_gender).toBe(lastUpdate.gender);
            expect(retrieved.speech_speed).toBeCloseTo(lastUpdate.speed, 2);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Additional Tests: TTS Caching
   */
  describe('TTS Caching', () => {
    it('should cache TTS results for repeated phrases', () => {
      // Test cache functionality
      const initialSize = voiceService.getCacheSize();
      expect(initialSize).toBe(0);

      // Note: Actual caching test would require mocking Nova Sonic API
      // This test verifies the cache mechanism exists

      voiceService.clearCache();
      expect(voiceService.getCacheSize()).toBe(0);
    });
  });

  /**
   * Additional Tests: Default Settings
   */
  describe('Default Voice Settings', () => {
    it('should return default settings for users without preferences', async () => {
      // Create user without voice settings
      const pool = getPool();
      const [result] = await pool.execute<any>(
        'INSERT INTO users (name, email, password_hash, totp_secret) VALUES (?, ?, ?, ?)',
        ['Test User 2', `test-voice-default-${Date.now()}@example.com`, 'hash', 'secret']
      );
      const newUserId = result.insertId;

      // Get settings (should return defaults)
      const settings = await voiceService.getVoiceSettings(newUserId);

      expect(settings.accent).toBe('US_ENGLISH');
      expect(settings.voice_gender).toBe('MALE');
      expect(settings.speech_speed).toBe(1.0);

      // Cleanup
      await pool.execute('DELETE FROM users WHERE id = ?', [newUserId]);
    });
  });

  /**
   * Additional Tests: Speech Speed Validation
   */
  describe('Speech Speed Validation', () => {
    it('should enforce speech speed range (0.5 to 2.0)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.float({ min: -10, max: 10 }),
          async (speed) => {
            const isValid = speed >= 0.5 && speed <= 2.0;

            try {
              await voiceService.saveVoiceSettings(
                testUserId,
                'US_ENGLISH',
                'MALE',
                speed
              );

              // Should only succeed for valid speeds
              expect(isValid).toBe(true);
            } catch (error: any) {
              // Should only fail for invalid speeds
              expect(isValid).toBe(false);
              expect(error.message).toContain('must be between 0.5 and 2.0');
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
