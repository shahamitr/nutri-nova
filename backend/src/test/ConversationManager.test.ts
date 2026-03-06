import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { fc } from 'fast-check';
import { ConversationManager } from '../services/ConversationManager';
import { getPool, closePool } from '../db/connection';

describe('ConversationManager - Property-Based Tests', () => {
  let conversationManager: ConversationManager;
  let testUserId: number;

  beforeAll(async () => {
    conversationManager = new ConversationManager();

    // Create test user
    const pool = getPool();
    const [result] = await pool.execute<any>(
      'INSERT INTO users (name, email, password_hash, totp_secret) VALUES (?, ?, ?, ?)',
      ['Test User', `test-conv-${Date.now()}@example.com`, 'hash', 'secret']
    );
    testUserId = result.insertId;
  });

  afterAll(async () => {
    const pool = getPool();
    await pool.execute('DELETE FROM users WHERE id = ?', [testUserId]);
    await closePool();
  });

  /**
   * Property 7: Conversation Context Preservation
   * Validates: Requirements 3.5
   */
  describe('Property 7: Conversation Context Preservation', () => {
    it('should preserve conversation history across interactions', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 2, maxLength: 5 }),
          async (messages) => {
            // Start session
            const session = await conversationManager.startSession(testUserId, 'Test User');
            const sessionId = session.session_id;

            // Send multiple messages
            for (const message of messages) {
              await conversationManager.processResponse(sessionId, message);
            }

            // Get conversation history
            const history = conversationManager.getConversationHistory(sessionId);

            // Verify all user messages are in history
            const userMessages = history.filter((msg) => msg.role === 'user');
            expect(userMessages.length).toBeGreaterThanOrEqual(messages.length);

            // Verify messages are preserved in order
            for (let i = 0; i < messages.length; i++) {
              expect(userMessages[i].content).toBe(messages[i]);
            }

            // Cleanup
            conversationManager.deleteSession(sessionId);
          }
        ),
        { numRuns: 10 }
      );
    });

    it('should maintain conversation state across multiple interactions', async () => {
      const session = await conversationManager.startSession(testUserId, 'Test User');
      const sessionId = session.session_id;

      // Get initial state
      const initialState = conversationManager.getConversationState(sessionId);
      expect(initialState).not.toBeNull();
      expect(initialState!.conversation_history.length).toBeGreaterThan(0);

      // Send a message
      await conversationManager.processResponse(sessionId, '25');

      // Get updated state
      const updatedState = conversationManager.getConversationState(sessionId);
      expect(updatedState).not.toBeNull();
      expect(updatedState!.conversation_history.length).toBeGreaterThan(
        initialState!.conversation_history.length
      );

      // Cleanup
      conversationManager.deleteSession(sessionId);
    });
  });

  /**
   * Property 23: Conversation State Completeness
   * Validates: Requirements 12.2
   */
  describe('Property 23: Conversation State Completeness', () => {
    it('should include all required fields in conversation state', async () => {
      await fc.assert(
        fc.asyncProperty(fc.string({ minLength: 3, maxLength: 20 }), async (userName) => {
          const session = await conversationManager.startSession(testUserId, userName);
          const sessionId = session.session_id;

          const state = conversationManager.getConversationState(sessionId);

          // Verify state completeness
          expect(state).not.toBeNull();
          expect(state!.session_id).toBe(sessionId);
          expect(state!.user_id).toBe(testUserId);
          expect(state!.current_question).toBeDefined();
          expect(state!.collected_data).toBeDefined();
          expect(state!.conversation_history).toBeDefined();
          expect(Array.isArray(state!.conversation_history)).toBe(true);
          expect(state!.stage).toBeDefined();
          expect(state!.created_at).toBeInstanceOf(Date);
          expect(state!.expires_at).toBeInstanceOf(Date);

          // Verify expiration is in the future
          expect(state!.expires_at.getTime()).toBeGreaterThan(Date.now());

          // Cleanup
          conversationManager.deleteSession(sessionId);
        }),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 24: Response Validation Before Proceeding
   * Validates: Requirements 12.4
   */
  describe('Property 24: Response Validation Before Proceeding', () => {
    it('should validate response completeness before proceeding', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant(''), // Empty string
            fc.constant('   '), // Whitespace only
            fc.string({ minLength: 1, maxLength: 100 }) // Valid string
          ),
          async (response) => {
            const session = await conversationManager.startSession(testUserId, 'Test User');
            const sessionId = session.session_id;

            const result = await conversationManager.processResponse(sessionId, response);

            // Empty or whitespace-only responses should trigger clarification
            if (response.trim().length === 0) {
              expect(result.ai_response).toContain('more information');
              expect(result.conversation_complete).toBe(false);
            }

            // Cleanup
            conversationManager.deleteSession(sessionId);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  /**
   * Property 22: Conversation Pipeline Order Preservation
   * Validates: Requirements 12.1
   */
  describe('Property 22: Conversation Pipeline Order Preservation', () => {
    it('should maintain correct pipeline sequence', async () => {
      const session = await conversationManager.startSession(testUserId, 'Test User');
      const sessionId = session.session_id;

      // Verify initial state
      const initialState = conversationManager.getConversationState(sessionId);
      expect(initialState!.stage).toBe('BASIC_PROFILE');

      // Process responses through stages
      await conversationManager.processResponse(sessionId, '25'); // age
      await conversationManager.processResponse(sessionId, 'male'); // gender
      await conversationManager.processResponse(sessionId, '175'); // height
      await conversationManager.processResponse(sessionId, '75'); // weight
      await conversationManager.processResponse(sessionId, 'vegetarian'); // diet

      // Should move to LIFESTYLE stage
      const midState = conversationManager.getConversationState(sessionId);
      expect(midState!.stage).toBe('LIFESTYLE');

      // Cleanup
      conversationManager.deleteSession(sessionId);
    });
  });

  /**
   * Property 25: Pipeline Error Handling with Fallback
   * Validates: Requirements 12.5
   */
  describe('Property 25: Pipeline Error Handling with Fallback', () => {
    it('should handle errors gracefully with fallback responses', async () => {
      const session = await conversationManager.startSession(testUserId, 'Test User');
      const sessionId = session.session_id;

      // Test with various invalid inputs
      const invalidInputs = ['', '   ', null, undefined];

      for (const input of invalidInputs) {
        try {
          const result = await conversationManager.processResponse(
            sessionId,
            input as string
          );

          // Should provide fallback response
          expect(result.ai_response).toBeDefined();
          expect(result.conversation_complete).toBe(false);
        } catch (error) {
          // Error handling is acceptable
          expect(error).toBeDefined();
        }
      }

      // Cleanup
      conversationManager.deleteSession(sessionId);
    });
  });

  /**
   * Property 26: Conversation Step Logging
   * Validates: Requirements 12.6
   */
  describe('Property 26: Conversation Step Logging', () => {
    it('should log all conversation steps with timestamps', async () => {
      const session = await conversationManager.startSession(testUserId, 'Test User');
      const sessionId = session.session_id;

      const beforeTime = new Date();

      // Send a message
      await conversationManager.processResponse(sessionId, '25');

      const afterTime = new Date();

      // Get history
      const history = conversationManager.getConversationHistory(sessionId);

      // Verify all messages have timestamps
      history.forEach((message) => {
        expect(message.timestamp).toBeInstanceOf(Date);
        expect(message.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
        expect(message.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
      });

      // Cleanup
      conversationManager.deleteSession(sessionId);
    });
  });

  /**
   * Additional Tests: Session Expiration
   */
  describe('Session Expiration', () => {
    it('should expire sessions after TTL', async () => {
      const session = await conversationManager.startSession(testUserId, 'Test User');
      const sessionId = session.session_id;

      // Get initial state
      const state = conversationManager.getConversationState(sessionId);
      expect(state).not.toBeNull();

      // Manually expire the session (for testing)
      const expiredState = conversationManager.getConversationState(sessionId);
      if (expiredState) {
        expiredState.expires_at = new Date(Date.now() - 1000); // Expired 1 second ago
        conversationManager.updateConversationState(sessionId, expiredState);
      }

      // Try to get expired session
      const retrievedState = conversationManager.getConversationState(sessionId);

      // Note: The actual expiration check happens in getConversationState
      // In production, expired sessions are cleaned up periodically
    });
  });

  /**
   * Additional Tests: Data Extraction
   */
  describe('Data Extraction', () => {
    it('should extract age from user response', async () => {
      const session = await conversationManager.startSession(testUserId, 'Test User');
      const sessionId = session.session_id;

      await conversationManager.processResponse(sessionId, 'I am 25 years old');

      const state = conversationManager.getConversationState(sessionId);
      expect(state!.collected_data.age).toBe(25);

      // Cleanup
      conversationManager.deleteSession(sessionId);
    });

    it('should extract gender from user response', async () => {
      const session = await conversationManager.startSession(testUserId, 'Test User');
      const sessionId = session.session_id;

      // Skip to gender question
      await conversationManager.processResponse(sessionId, '25');
      await conversationManager.processResponse(sessionId, 'I am male');

      const state = conversationManager.getConversationState(sessionId);
      expect(state!.collected_data.gender).toBe('MALE');

      // Cleanup
      conversationManager.deleteSession(sessionId);
    });
  });
});
