/**
 * Gamification Helper
 * Utility functions for logging activities and earning points
 */

interface ActivityLogResult {
  success: boolean;
  points_earned?: number;
  level_up?: boolean;
  new_level?: number;
  message?: string;
  error?: string;
}

/**
 * Log an activity and earn points
 */
export async function logActivity(
  token: string,
  activityType: string,
  metadata?: any
): Promise<ActivityLogResult> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/gamification/activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        activity_type: activityType,
        metadata,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error logging activity:', error);
    return {
      success: false,
      error: 'Failed to log activity',
    };
  }
}

/**
 * Activity types and their point values
 */
export const ACTIVITY_TYPES = {
  MEAL_LOGGED: 'meal_logged', // 10 points
  WORKOUT_COMPLETED: 'workout_completed', // 20 points
  WATER_LOGGED: 'water_logged', // 5 points
  VIDEO_WATCHED: 'video_watched', // 5 points
  DIET_PLAN_CREATED: 'diet_plan_created', // 50 points
  HEALTH_ASSESSMENT: 'health_assessment', // 50 points
  REPORT_GENERATED: 'report_generated', // 30 points
  GOAL_UPDATED: 'goal_updated', // 15 points
};

/**
 * Show a toast notification for activity completion
 */
export function showActivityToast(result: ActivityLogResult) {
  if (!result.success) return;

  const message = result.level_up
    ? `🎉 Level Up! You're now level ${result.new_level}! (+${result.points_earned} points)`
    : `✨ +${result.points_earned} points earned!`;

  // You can integrate with a toast library here
  // For now, we'll use a simple alert (replace with proper toast in production)
  if (typeof window !== 'undefined') {
    // Create a custom toast element
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('animate-fade-out');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }
}

/**
 * Log activity with automatic toast notification
 */
export async function logActivityWithToast(
  token: string,
  activityType: string,
  metadata?: any
): Promise<ActivityLogResult> {
  const result = await logActivity(token, activityType, metadata);
  if (result.success) {
    showActivityToast(result);
  }
  return result;
}
