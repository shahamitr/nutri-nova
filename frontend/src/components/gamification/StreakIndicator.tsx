'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

interface StreakData {
  current_streak: number;
  longest_streak: number;
}

export default function StreakIndicator() {
  const { token } = useAuth();
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreak();
  }, [token]);

  const fetchStreak = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/gamification/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setStreak({
          current_streak: data.stats.current_streak,
          longest_streak: data.stats.longest_streak,
        });
      }
    } catch (error) {
      console.error('Error fetching streak:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !streak) return null;

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold uppercase tracking-wide opacity-90">
            Current Streak
          </div>
          <div className="text-3xl font-bold mt-1">
            {streak.current_streak} {streak.current_streak === 1 ? 'day' : 'days'} 🔥
          </div>
          <div className="text-xs opacity-75 mt-1">
            Longest: {streak.longest_streak} days
          </div>
        </div>
        <div className="text-6xl">
          {streak.current_streak >= 7 ? '🔥' :
           streak.current_streak >= 3 ? '⚡' : '✨'}
        </div>
      </div>
      {streak.current_streak === 0 && (
        <div className="mt-3 text-sm opacity-90">
          Complete an activity today to start your streak!
        </div>
      )}
      {streak.current_streak > 0 && (
        <div className="mt-3 text-sm opacity-90">
          Don't break the streak! Come back tomorrow.
        </div>
      )}
    </div>
  );
}
