// User and Authentication Types
export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface SignupResponse {
  totpSecret: string;
  qrCodeUrl: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
  totpCode: string;
}

export interface LoginResponse {
  sessionToken: string;
  user: User;
}

// Voice Settings Types
export type VoiceAccent = 'US_ENGLISH' | 'UK_ENGLISH' | 'AUSTRALIAN_ENGLISH' | 'INDIAN_ENGLISH';
export type VoiceGender = 'MALE' | 'FEMALE';

export interface VoiceSettings {
  accent: VoiceAccent;
  voiceGender: VoiceGender;
  speechSpeed: number; // 0.5 to 2.0
}

// Health Profile Types
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type DietPreference = 'VEGETARIAN' | 'EGGETARIAN' | 'NON_VEGETARIAN';
export type ActivityLevel = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';
export type StressLevel = 'LOW' | 'MODERATE' | 'HIGH';

export interface HealthProfile {
  userId: number;
  age: number;
  gender: Gender;
  heightCm: number;
  weightKg: number;
  dietPreference: DietPreference;
  workType?: string;
  activityLevel?: ActivityLevel;
  exerciseFrequency?: string;
  sleepHours?: number;
  stressLevel?: StressLevel;
  medicalConditions?: string;
}

// BMI Types
export type BMICategory = 'UNDERWEIGHT' | 'NORMAL' | 'OVERWEIGHT' | 'OBESE';

export interface BMIRecord {
  id: number;
  userId: number;
  bmiValue: number;
  category: BMICategory;
  calculatedAt: Date;
}

export interface BMICalculation {
  bmi: number;
  category: BMICategory;
  interpretation: string;
}

// Diet Plan Types
export interface FoodItem {
  name: string;
  portion: string;
  calories: number;
}

export interface Meal {
  name: string;
  items: FoodItem[];
  totalCalories: number;
}

export interface Macronutrients {
  proteinPercentage: number;
  carbsPercentage: number;
  fatsPercentage: number;
}

export interface DietPlan {
  id: number;
  userId: number;
  dailyCalories: number;
  macros: Macronutrients;
  meals: {
    breakfast: Meal;
    lunch: Meal;
    snack: Meal;
    dinner: Meal;
  };
  createdAt: Date;
}

// Gamification Types
export interface UserProgress {
  userId: number;
  profileCompleted: boolean;
  bmiCalculated: boolean;
  routineCompleted: boolean;
  dietGenerated: boolean;
  points: number;
  badges: string[];
  completionPercentage: number;
}

export interface Badge {
  name: string;
  description: string;
  earnedAt: Date;
}

// Conversation Types
export type MessageRole = 'user' | 'assistant';

export interface Message {
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export type ConversationStage = 'profile' | 'lifestyle' | 'complete';

export interface ConversationState {
  sessionId: string;
  userId: number;
  currentQuestion: string;
  collectedData: Partial<HealthProfile>;
  conversationHistory: Message[];
  stage: ConversationStage;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
