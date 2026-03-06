// User Types
export interface User {
  id: number;
  name: string;
  email: string;
  created_at: Date;
}

export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface SignupResponse {
  user: User;
  totp_secret: string;
  qr_code_url: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  totp_code: string;
}

export interface LoginResponse {
  user: User;
  session_token: string;
}

// Voice Types
export enum VoiceAccent {
  US_ENGLISH = 'US_ENGLISH',
  UK_ENGLISH = 'UK_ENGLISH',
  AUSTRALIAN_ENGLISH = 'AUSTRALIAN_ENGLISH',
  INDIAN_ENGLISH = 'INDIAN_ENGLISH',
}

export enum VoiceGender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export interface VoiceSettings {
  user_id: number;
  accent: VoiceAccent;
  voice_gender: VoiceGender;
  speech_speed: number;
}

export interface VoiceSessionRequest {
  user_id: number;
}

export interface VoiceSessionResponse {
  session_id: string;
  greeting: string;
}

export interface ProcessSpeechRequest {
  session_id: string;
  audio_data: string; // base64 encoded audio
}

export interface ProcessSpeechResponse {
  transcript: string;
  ai_response: string;
  audio_url?: string;
  conversation_complete: boolean;
}

// Health Profile Types
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum DietPreference {
  VEGETARIAN = 'VEGETARIAN',
  EGGETARIAN = 'EGGETARIAN',
  NON_VEGETARIAN = 'NON_VEGETARIAN',
}

export enum ActivityLevel {
  SEDENTARY = 'SEDENTARY',
  LIGHT = 'LIGHT',
  MODERATE = 'MODERATE',
  ACTIVE = 'ACTIVE',
  VERY_ACTIVE = 'VERY_ACTIVE',
}

export enum StressLevel {
  LOW = 'LOW',
  MODERATE = 'MODERATE',
  HIGH = 'HIGH',
}

export interface HealthProfile {
  user_id: number;
  age: number;
  gender: Gender;
  height_cm: number;
  weight_kg: number;
  diet_preference: DietPreference;
  activity_level: ActivityLevel;
  sleep_hours: number;
  stress_level: StressLevel;
  medical_conditions?: string;
}

// BMI Types
export enum BMICategory {
  UNDERWEIGHT = 'UNDERWEIGHT',
  NORMAL = 'NORMAL',
  OVERWEIGHT = 'OVERWEIGHT',
  OBESE = 'OBESE',
}

export interface BMIRecord {
  id: number;
  user_id: number;
  bmi_value: number;
  category: BMICategory;
  calculated_at: Date;
}

export interface BMICalculationResponse {
  bmi_value: number;
  category: BMICategory;
  interpretation: string;
}

// Diet Plan Types
export interface Meal {
  name: string;
  items: FoodItem[];
  total_calories: number;
}

export interface FoodItem {
  name: string;
  portion: string;
  calories: number;
}

export interface DietPlan {
  id: number;
  user_id: number;
  daily_calories: number;
  protein_percentage: number;
  carbs_percentage: number;
  fats_percentage: number;
  breakfast: Meal;
  lunch: Meal;
  snack: Meal;
  dinner: Meal;
  created_at: Date;
}

export interface GenerateDietPlanResponse {
  diet_plan: DietPlan;
}

// Progress Types
export interface UserProgress {
  user_id: number;
  profile_completed: boolean;
  bmi_calculated: boolean;
  routine_completed: boolean;
  diet_generated: boolean;
  points: number;
  badges: string[];
  completion_percentage: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Conversation Types
export interface ConversationState {
  session_id: string;
  user_id: number;
  current_question: string;
  collected_data: Partial<HealthProfile>;
  conversation_history: ConversationMessage[];
  stage: ConversationStage;
}

export interface ConversationMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export enum ConversationStage {
  GREETING = 'GREETING',
  BASIC_PROFILE = 'BASIC_PROFILE',
  LIFESTYLE = 'LIFESTYLE',
  DYNAMIC_QUESTIONS = 'DYNAMIC_QUESTIONS',
  SUMMARY = 'SUMMARY',
  COMPLETE = 'COMPLETE',
}
