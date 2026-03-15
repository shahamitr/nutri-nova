import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import ConversationMemoryService from './ConversationMemoryService';

interface ConversationMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

enum ConversationStage {
  GREETING = 'GREETING',
  BASIC_PROFILE = 'BASIC_PROFILE',
  LIFESTYLE = 'LIFESTYLE',
  HEALTH_CONDITIONS = 'HEALTH_CONDITIONS',
  HABITS = 'HABITS',
  PAIN_ASSESSMENT = 'PAIN_ASSESSMENT',
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
  sleep_quality?: string;
  stress_level?: string;
  energy_levels?: string;
  medical_conditions?: string;

  // Comprehensive health fields
  allergies?: string;
  smoking_status?: string;
  alcohol_consumption?: string;
  water_intake_daily?: number;
  joint_pain?: boolean;
  back_pain?: boolean;
  neck_pain?: boolean;
  pain_details?: string;
  chronic_conditions?: string;
  medications?: string;
  injuries?: string;
  dietary_restrictions?: string;
  food_dislikes?: string;
  meal_frequency?: number;
  exercise_limitations?: string;
  health_goals?: string;
  family_history?: string;
  digestive_issues?: string;
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

    // Load user's memory context for personalized greeting
    const memoryContext = await ConversationMemoryService.getContextForPrompt(userId);
    const memories = await ConversationMemoryService.getUserMemories(userId, 5);

    let greeting = `Hello ${userName}! I'm your AI nutritionist.`;

    // Personalize greeting based on memories
    if (memories.length > 0) {
      const lastGoal = memories.find(m => m.memory_type === 'goal');
      if (lastGoal) {
        greeting += ` I remember you mentioned: "${lastGoal.content}". Let's continue working on that!`;
      } else {
        greeting += ` Welcome back! I remember our previous conversations.`;
      }
    } else {
      greeting += ` I'll ask you a few questions to create your personalized diet plan.`;
    }

    greeting += ` Let's start with some basic information about you.`;

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

    // Save user message to database
    await this.saveMessageToDatabase(state.user_id, sessionId, 'user', userResponse);

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

      // Save AI message to database
      await this.saveMessageToDatabase(state.user_id, sessionId, 'ai', clarification);

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

      // Save AI message to database
      await this.saveMessageToDatabase(state.user_id, sessionId, 'ai', summary);

      // Extract and store memories from the conversation
      const conversationText = state.conversation_history
        .filter(m => m.role === 'user')
        .map(m => m.content)
        .join('. ');

      await ConversationMemoryService.extractMemoriesFromConversation(
        state.user_id,
        conversationText
      );

      // Store specific important facts as memories
      const data = state.collected_data;

      // Store dietary restrictions as high-importance memories
      if (data.dietary_restrictions && data.dietary_restrictions !== 'none') {
        await ConversationMemoryService.storeMemory({
          user_id: state.user_id,
          memory_type: 'restriction',
          content: `Dietary restrictions: ${data.dietary_restrictions}`,
          importance: 9
        });
      }

      // Store allergies as critical memories
      if (data.allergies && data.allergies !== 'none') {
        await ConversationMemoryService.storeMemory({
          user_id: state.user_id,
          memory_type: 'restriction',
          content: `Allergies: ${data.allergies}`,
          importance: 10
        });
      }

      // Store health goals
      if (data.health_goals) {
        await ConversationMemoryService.storeMemory({
          user_id: state.user_id,
          memory_type: 'goal',
          content: data.health_goals,
          importance: 8
        });
      }

      // Store diet preference
      if (data.diet_preference) {
        await ConversationMemoryService.storeMemory({
          user_id: state.user_id,
          memory_type: 'preference',
          content: `Prefers ${data.diet_preference} diet`,
          importance: 7
        });
      }

      // Store chronic conditions as important facts
      if (data.chronic_conditions && data.chronic_conditions !== 'none') {
        await ConversationMemoryService.storeMemory({
          user_id: state.user_id,
          memory_type: 'fact',
          content: `Chronic conditions: ${data.chronic_conditions}`,
          importance: 9
        });
      }

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

    // Save AI message to database
    await this.saveMessageToDatabase(state.user_id, sessionId, 'ai', nextQuestion);

    this.updateConversationState(sessionId, state);

    return {
      ai_response: nextQuestion,
      conversation_complete: false,
    };
  }

  /**
   * Save message to database
   */
  private async saveMessageToDatabase(
    userId: number,
    sessionId: string,
    role: 'user' | 'ai',
    content: string
  ): Promise<void> {
    try {
      const { query } = await import('../db/connection');
      await query(
        'INSERT INTO conversation_history (user_id, session_id, role, content) VALUES (?, ?, ?, ?)',
        [userId, sessionId, role, content]
      );
    } catch (error) {
      console.error('Error saving message to database:', error);
      // Don't throw - conversation should continue even if DB save fails
    }
  }

  /**
   * Extract data from response based on current stage
   */
  private async extractDataFromResponse(state: ConversationState, response: string): Promise<void> {
    const lowerResponse = response.toLowerCase();

    switch (state.stage) {
      case ConversationStage.BASIC_PROFILE:
        // Extract age
        if (!state.collected_data.age) {
          const ageMatch = response.match(/(\d+)/);
          if (ageMatch) {
            state.collected_data.age = parseInt(ageMatch[1]);
          }
        }
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
        // Extract sleep quality
        else if (state.collected_data.sleep_hours !== undefined && !state.collected_data.sleep_quality) {
          if (lowerResponse.includes('poor')) {
            state.collected_data.sleep_quality = 'POOR';
          } else if (lowerResponse.includes('fair')) {
            state.collected_data.sleep_quality = 'FAIR';
          } else if (lowerResponse.includes('good')) {
            state.collected_data.sleep_quality = 'GOOD';
          } else if (lowerResponse.includes('excellent')) {
            state.collected_data.sleep_quality = 'EXCELLENT';
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
        // Extract energy levels
        else if (!state.collected_data.energy_levels) {
          if (lowerResponse.includes('very low')) {
            state.collected_data.energy_levels = 'VERY_LOW';
          } else if (lowerResponse.includes('low')) {
            state.collected_data.energy_levels = 'LOW';
          } else if (lowerResponse.includes('moderate')) {
            state.collected_data.energy_levels = 'MODERATE';
          } else if (lowerResponse.includes('high') && !lowerResponse.includes('very')) {
            state.collected_data.energy_levels = 'HIGH';
          } else if (lowerResponse.includes('very high')) {
            state.collected_data.energy_levels = 'VERY_HIGH';
          }
        }
        break;

      case ConversationStage.HEALTH_CONDITIONS:
        // Extract allergies
        if (state.collected_data.allergies === undefined) {
          state.collected_data.allergies = lowerResponse.includes('none') || lowerResponse.includes('no') ? null : response;
        }
        // Extract chronic conditions
        else if (state.collected_data.chronic_conditions === undefined) {
          state.collected_data.chronic_conditions = lowerResponse.includes('none') || lowerResponse.includes('no') ? null : response;
        }
        // Extract medications
        else if (state.collected_data.medications === undefined) {
          state.collected_data.medications = lowerResponse.includes('none') || lowerResponse.includes('no') ? null : response;
        }
        // Extract injuries
        else if (state.collected_data.injuries === undefined) {
          state.collected_data.injuries = lowerResponse.includes('none') || lowerResponse.includes('no') ? null : response;
        }
        // Extract dietary restrictions
        else if (state.collected_data.dietary_restrictions === undefined) {
          state.collected_data.dietary_restrictions = lowerResponse.includes('none') || lowerResponse.includes('no') ? null : response;
        }
        // Extract food dislikes
        else if (state.collected_data.food_dislikes === undefined) {
          state.collected_data.food_dislikes = lowerResponse.includes('none') || lowerResponse.includes('no') ? null : response;
        }
        // Extract digestive issues
        else if (state.collected_data.digestive_issues === undefined) {
          state.collected_data.digestive_issues = lowerResponse.includes('none') || lowerResponse.includes('no') ? null : response;
        }
        // Extract family history
        else if (state.collected_data.family_history === undefined) {
          state.collected_data.family_history = lowerResponse.includes('none') || lowerResponse.includes('no') ? null : response;
        }
        break;

      case ConversationStage.HABITS:
        // Extract smoking status
        if (state.collected_data.smoking_status === undefined) {
          if (lowerResponse.includes('none') || lowerResponse.includes('no') || lowerResponse.includes('non')) {
            state.collected_data.smoking_status = 'NON_SMOKER';
          } else if (lowerResponse.includes('occasional')) {
            state.collected_data.smoking_status = 'OCCASIONAL';
          } else if (lowerResponse.includes('regular')) {
            state.collected_data.smoking_status = 'REGULAR';
          } else if (lowerResponse.includes('heavy')) {
            state.collected_data.smoking_status = 'HEAVY';
          }
        }
        // Extract alcohol consumption
        else if (state.collected_data.alcohol_consumption === undefined) {
          if (lowerResponse.includes('none') || lowerResponse.includes('no') || lowerResponse.includes('never')) {
            state.collected_data.alcohol_consumption = 'NONE';
          } else if (lowerResponse.includes('occasional')) {
            state.collected_data.alcohol_consumption = 'OCCASIONAL';
          } else if (lowerResponse.includes('moderate')) {
            state.collected_data.alcohol_consumption = 'MODERATE';
          } else if (lowerResponse.includes('heavy')) {
            state.collected_data.alcohol_consumption = 'HEAVY';
          }
        }
        // Extract water intake
        else if (state.collected_data.water_intake_daily === undefined) {
          const waterMatch = response.match(/(\d+\.?\d*)/);
          if (waterMatch) {
            state.collected_data.water_intake_daily = parseFloat(waterMatch[1]);
          }
        }
        // Extract meal frequency
        else if (state.collected_data.meal_frequency === undefined) {
          const mealMatch = response.match(/(\d+)/);
          if (mealMatch) {
            state.collected_data.meal_frequency = parseInt(mealMatch[1]);
          }
        }
        break;

      case ConversationStage.PAIN_ASSESSMENT:
        // Extract joint pain
        if (state.collected_data.joint_pain === undefined) {
          state.collected_data.joint_pain = lowerResponse.includes('yes') || lowerResponse.includes('have');
        }
        // Extract back pain
        else if (state.collected_data.back_pain === undefined) {
          state.collected_data.back_pain = lowerResponse.includes('yes') || lowerResponse.includes('have');
        }
        // Extract neck pain
        else if (state.collected_data.neck_pain === undefined) {
          state.collected_data.neck_pain = lowerResponse.includes('yes') || lowerResponse.includes('have');
        }
        // Extract pain details
        else if ((state.collected_data.joint_pain || state.collected_data.back_pain || state.collected_data.neck_pain) && !state.collected_data.pain_details) {
          state.collected_data.pain_details = response;
        }
        // Extract exercise limitations
        else if (state.collected_data.exercise_limitations === undefined) {
          state.collected_data.exercise_limitations = lowerResponse.includes('none') || lowerResponse.includes('no') ? null : response;
        }
        // Extract health goals
        else if (state.collected_data.health_goals === undefined) {
          state.collected_data.health_goals = response;
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
      if (data.sleep_hours !== undefined && !data.sleep_quality) return 'How would you rate your sleep quality? (Poor/Fair/Good/Excellent)';
      if (!data.stress_level) return 'What is your stress level? (Low/Moderate/High)';
      if (!data.energy_levels) return 'How would you describe your energy levels throughout the day? (Very Low/Low/Moderate/High/Very High)';

      // Move to health conditions stage
      state.stage = ConversationStage.HEALTH_CONDITIONS;
    }

    // Health Conditions Stage
    if (state.stage === ConversationStage.HEALTH_CONDITIONS) {
      if (data.allergies === undefined) return 'Do you have any food allergies or intolerances? (Please list them, or say "none")';
      if (data.chronic_conditions === undefined) return 'Do you have any chronic health conditions like diabetes, hypertension, thyroid issues, etc.? (Please list them, or say "none")';
      if (data.medications === undefined) return 'Are you currently taking any medications? (Please list them, or say "none")';
      if (data.injuries === undefined) return 'Do you have any past or current injuries that might affect your exercise routine? (Please describe, or say "none")';
      if (data.dietary_restrictions === undefined) return 'Do you have any dietary restrictions due to religious, ethical, or personal reasons? (Please describe, or say "none")';
      if (data.food_dislikes === undefined) return 'Are there any foods you strongly dislike or prefer to avoid? (Please list them, or say "none")';
      if (data.digestive_issues === undefined) return 'Do you experience any digestive issues like IBS, acid reflux, bloating, etc.? (Please describe, or say "none")';
      if (data.family_history === undefined) return 'Is there any relevant family medical history we should know about? (Heart disease, diabetes, obesity, etc., or say "none")';

      // Move to habits stage
      state.stage = ConversationStage.HABITS;
    }

    // Habits Stage
    if (state.stage === ConversationStage.HABITS) {
      if (data.smoking_status === undefined) return 'Do you smoke? (Non-smoker/Occasional/Regular/Heavy)';
      if (data.alcohol_consumption === undefined) return 'How often do you consume alcohol? (None/Occasional/Moderate/Heavy)';
      if (data.water_intake_daily === undefined) return 'How many liters of water do you drink per day on average? (Please provide a number)';
      if (data.meal_frequency === undefined) return 'How many meals do you prefer to eat per day? (Usually 3-6)';

      // Move to pain assessment stage
      state.stage = ConversationStage.PAIN_ASSESSMENT;
    }

    // Pain Assessment Stage
    if (state.stage === ConversationStage.PAIN_ASSESSMENT) {
      if (data.joint_pain === undefined) return 'Do you experience any joint pain? (Yes/No)';
      if (data.back_pain === undefined) return 'Do you experience any back pain? (Yes/No)';
      if (data.neck_pain === undefined) return 'Do you experience any neck pain? (Yes/No)';

      // If any pain reported, ask for details
      if ((data.joint_pain || data.back_pain || data.neck_pain) && !data.pain_details) {
        return 'Please describe your pain in more detail (location, severity, when it occurs)';
      }

      if (data.exercise_limitations === undefined) return 'Do you have any physical limitations that would restrict certain exercises? (Please describe, or say "none")';
      if (data.health_goals === undefined) return 'What are your specific health goals beyond weight management? (e.g., better sleep, more energy, reduced pain, improved fitness, etc.)';

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
