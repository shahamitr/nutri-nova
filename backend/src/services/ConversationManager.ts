import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

interface ConversationMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

enum ConversationStage {
  GREETING = 'GREETING',
  BASIC_PROFILE = 'BASIC_PROFILE',
  LIFESTYLE = 'LIFESTYLE',
  DYNAMIC_QUESTIONS = 'DYNAMIC_QUESTIONS',
  SUMMARY = 'SUMMARY',
  COMPLETE = 'COMPLETE',
}

interface HealthProfileData {
  age?: number;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  diet_preference?: string;
  activity_level?: string;
  sleep_hours?: number;
  stress_level?: string;
  medical_conditions?: string;
}

interface ConversationState {
  session_id: string;
  user_id: number;
  current_question: string;
  collected_data: HealthProfileData;
  conversation_history: ConversationMessage[];
  stage: ConversationStage;
  created_at: Date;
  expires_at: Date;
}

// In-memory session store (in production, use Redis)
const sessionStore: Map<string, ConversationState> = new Map();

// Clean up expired sessions every 5 minutes
setInterval(() => {
  const now = new Date();
  sessionStore.forEach((state, sessionId) => {
    if (state.expires_at < now) {
      sessionStore.delete(sessionId);
      console.log(`Cleaned up expired session: ${sessionId}`);
    }
  });
}, 300000);

export class ConversationManager {
  private readonly novaLiteApiKey = process.env.NOVA_LITE_API_KEY || '';
  private readonly novaLiteEndpoint = process.env.NOVA_LITE_ENDPOINT || 'https://nova-lite.amazonaws.com';
  private readonly sessionTTL = 1800000; // 30 minutes in milliseconds

  /**
   * Start a new conversation session
   */
  async startSession(userId: number, userName: string): Promise<{ session_id: string; greeting: string }> {
    const sessionId = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.sessionTTL);

    const greeting = `Hello ${userName}! I'm your AI nutritionist. I'll ask you a few questions to create your personalized diet plan. Let's start with some basic information about you.`;

    const initialState: ConversationState = {
      session_id: sessionId,
      user_id: userId,
      current_question: 'What is your age?',
      collected_data: {},
      conversation_history: [
        {
          role: 'ai',
          content: greeting,
          timestamp: now,
        },
        {
          role: 'ai',
          content: 'What is your age?',
          timestamp: now,
        },
      ],
      stage: ConversationStage.BASIC_PROFILE,
      created_at: now,
      expires_at: expiresAt,
    };

    sessionStore.set(sessionId, initialState);

    return {
      session_id: sessionId,
      greeting: greeting + '\n\n' + 'What is your age?',
    };
  }

  /**
   * Get conversation state
   */
  getConversationState(sessionId: string): ConversationState | null {
    const state = sessionStore.get(sessionId);

    if (!state) {
      return null;
    }

    // Check if expired
    if (state.expires_at < new Date()) {
      sessionStore.delete(sessionId);
      return null;
    }

    return state;
  }

  /**
   * Update conversation state
   */
  updateConversationState(sessionId: string, updates: Partial<ConversationState>): void {
    const state = sessionStore.get(sessionId);

    if (!state) {
      throw new Error('Session not found');
    }

    // Extend expiration on activity
    const expiresAt = new Date(Date.now() + this.sessionTTL);

    sessionStore.set(sessionId, {
      ...state,
      ...updates,
      expires_at: expiresAt,
    });
  }

  /**
   * Process user response and generate next question
   */
  async processResponse(sessionId: string, userResponse: string): Promise<{
    ai_response: string;
    conversation_complete: boolean;
    collected_data?: HealthProfileData;
  }> {
    const state = this.getConversationState(sessionId);

    if (!state) {
      throw new Error('Session not found or expired');
    }

    // Add user message to history
    state.conversation_history.push({
      role: 'user',
      content: userResponse,
      timestamp: new Date(),
    });

    // Extract data from response based on current stage
    await this.extractDataFromResponse(state, userResponse);

    // Validate response completeness
    const isComplete = this.validateResponse(state, userResponse);

    if (!isComplete) {
      const clarification = 'I need a bit more information. Could you please provide a complete answer?';
      state.conversation_history.push({
        role: 'ai',
        content: clarification,
        timestamp: new Date(),
      });
      this.updateConversationState(sessionId, state);
      return {
        ai_response: clarification,
        conversation_complete: false,
      };
    }

    // Determine next question
    const nextQuestion = await this.determineNextQuestion(state);

    if (nextQuestion === null) {
      // Conversation complete
      state.stage = ConversationStage.COMPLETE;
      const summary = this.generateSummary(state);

      state.conversation_history.push({
        role: 'ai',
        content: summary,
        timestamp: new Date(),
      });

      this.updateConversationState(sessionId, state);

      return {
        ai_response: summary,
        conversation_complete: true,
        collected_data: state.collected_data,
      };
    }

    // Add AI response to history
    state.current_question = nextQuestion;
    state.conversation_history.push({
      role: 'ai',
      content: nextQuestion,
      timestamp: new Date(),
    });

    this.updateConversationState(sessionId, state);

    return {
      ai_response: nextQuestion,
      conver     }
        }
        // Extract gender
        else if (!state.collected_data.gender) {
          if (lowerResponse.includes('male') && !lowerResponse.includes('female')) {
            state.collected_data.gender = 'MALE';
          } else if (lowerResponse.includes('female')) {
            state.collected_data.gender = 'FEMALE';
          } else if (lowerResponse.includes('other')) {
            state.collected_data.gender = 'OTHER';
          }
        }
        // Extract height
        else if (!state.collected_data.height_cm) {
          const heightMatch = response.match(/(\d+\.?\d*)/);
          if (heightMatch) {
            let height = parseFloat(heightMatch[1]);
            // Convert feet to cm if needed
            if (height < 10) {
              height = height * 30.48; // feet to cm
            }
            state.collected_data.height_cm = height;
          }
        }
        // Extract weight
        else if (!state.collected_data.weight_kg) {
          const weightMatch = response.match(/(\d+\.?\d*)/);
          if (weightMatch) {
            state.collected_data.weight_kg = parseFloat(weightMatch[1]);
          }
        }
        // Extract diet preference
        else if (!state.collected_data.diet_preference) {
          if (lowerResponse.includes('vegetarian') && !lowerResponse.includes('non')) {
            state.collected_data.diet_preference = 'VEGETARIAN';
          } else if (lowerResponse.includes('eggetarian') || lowerResponse.includes('egg')) {
            state.collected_data.diet_preference = 'EGGETARIAN';
          } else if (lowerResponse.includes('non-vegetarian') || lowerResponse.includes('non vegetarian')) {
            state.collected_data.diet_preference = 'NON_VEGETARIAN';
          }
        }
        break;

      case ConversationStage.LIFESTYLE:
        // Extract activity level
        if (!state.collected_data.activity_level) {
          if (lowerResponse.includes('sedentary') || lowerResponse.includes('desk')) {
            state.collected_data.activity_level = 'SEDENTARY';
          } else if (lowerResponse.includes('light')) {
            state.collected_data.activity_level = 'LIGHT';
          } else if (lowerResponse.includes('moderate')) {
            state.collected_data.activity_level = 'MODERATE';
          } else if (lowerResponse.includes('active') || lowerResponse.includes('very active')) {
            state.collected_data.activity_level = 'ACTIVE';
          }
        }
        // Extract sleep hours
        else if (!state.collected_data.sleep_hours) {
          const sleepMatch = response.match(/(\d+\.?\d*)/);
          if (sleepMatch) {
            state.collected_data.sleep_hours = parseFloat(sleepMatch[1]);
          }
        }
        // Extract stress level
        else if (!state.collected_data.stress_level) {
          if (lowerResponse.includes('low')) {
            state.collected_data.stress_level = 'LOW';
          } else if (lowerResponse.includes('moderate') || lowerResponse.includes('medium')) {
            state.collected_data.stress_level = 'MODERATE';
          } else if (lowerResponse.includes('high')) {
            state.collected_data.stress_level = 'HIGH';
          }
        }
        break;

      case ConversationStage.DYNAMIC_QUESTIONS:
        // Store medical conditions or other dynamic responses
        if (!state.collected_data.medical_conditions) {
          state.collected_data.medical_conditions = response;
        }
        break;
    }
  }

  /**
   * Validate response completeness
   */
  private validateResponse(state: ConversationState, response: string): boolean {
    // Basic validation - response should not be empty or too short
    if (!response || response.trim().length < 1) {
      return false;
    }

    // Check if response contains meaningful content
    const meaningfulWords = response.trim().split(/\s+/).length;
    if (meaningfulWords < 1) {
      return false;
    }

    return true;
  }

  /**
   * Determine next question based on conversation state
   */
  private async determineNextQuestion(state: ConversationState): Promise<string | null> {
    const data = state.collected_data;

    // Basic Profile Stage
    if (state.stage === ConversationStage.BASIC_PROFILE) {
      if (!data.age) return 'What is your age?';
      if (!data.gender) return 'What is your gender? (Male/Female/Other)';
      if (!data.height_cm) return 'What is your height in centimeters?';
      if (!data.weight_kg) return 'What is your weight in kilograms?';
      if (!data.diet_preference) return 'What is your diet preference? (Vegetarian/Eggetarian/Non-Vegetarian)';

      // Move to lifestyle stage
      state.stage = ConversationStage.LIFESTYLE;
    }

    // Lifestyle Stage
    if (state.stage === ConversationStage.LIFESTYLE) {
      if (!data.activity_level) return 'What is your daily activity level? (Sedentary/Light/Moderate/Active)';
      if (!data.sleep_hours) return 'How many hours do you sleep per day?';
      if (!data.stress_level) return 'What is your stress level? (Low/Moderate/High)';

      // Move to dynamic questions stage
      state.stage = ConversationStage.DYNAMIC_QUESTIONS;
    }

    // Dynamic Questions Stage (adaptive based on profile)
    if (state.stage === ConversationStage.DYNAMIC_QUESTIONS) {
      // Age-based questions
      if (data.age && data.age < 18 && !data.medical_conditions) {
        return 'Do you participate in any sports or physical activities at school?';
      }

      // Activity level based questions
      if (data.activity_level === 'SEDENTARY' && !data.medical_conditions) {
        return 'Would you be willing to add light exercise to your routine?';
      }

      // If no dynamic questions needed, move to summary
      state.stage = ConversationStage.SUMMARY;
    }

    // All questions answered
    return null;
  }

  /**
   * Generate conversation summary
   */
  private generateSummary(state: ConversationState): string {
    const data = state.collected_data;

    return `Thank you for providing all the information! Here's a summary:

Age: ${data.age} years
Gender: ${data.gender}
Height: ${data.height_cm} cm
Weight: ${data.weight_kg} kg
Diet Preference: ${data.diet_preference}
Activity Level: ${data.activity_level}
Sleep: ${data.sleep_hours} hours/day
Stress Level: ${data.stress_level}

I'll now generate your personalized diet plan based on this information. Please proceed to the diet plan generation.`;
  }

  /**
   * Get conversation history
   */
  getConversationHistory(sessionId: string): ConversationMessage[] {
    const state = this.getConversationState(sessionId);
    return state ? state.conversation_history : [];
  }

  /**
   * Delete session (cleanup)
   */
  deleteSession(sessionId: string): void {
    sessionStore.delete(sessionId);
  }

  /**
   * Get active session count (for monitoring)
   */
  getActiveSessionCount(): number {
    return sessionStore.size;
  }
}
