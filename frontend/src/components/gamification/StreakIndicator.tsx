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
        setStreak({ current_streak: data.stats.current_streak, longest_streak: data.stats.longest_streak });
      }
    } catch (error) {
      console.error('Error fetching streak:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !streak) return null;

  return (
    <div className="bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 text-white rounded-2xl p-6 shadow-lg shadow-orange-500/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-100">Current Streak</p>
          <p className="text-4xl font-black mt-1">
            {streak.current_streak} <span className="text-2xl font-bold">{streak.current_streak === 1 ? 'day' : 'days'}</span>
          </p>
          <p className="text-xs text-orange-200 mt-2">
            Personal best: {streak.longest_streak} days
          </p>
        </div>
        <div className="text-6xl">
          {streak.current_streak >= 7 ? '🔥' : streak.current_streak >= 3 ? '⚡' : '✨'}
        </div>
      </div>
      <p className="text-sm text-orange-100 mt-4 pt-3 border-t border-white/20">
        {streak.current_streak === 0
          ? 'Complete an activity today to start your streak!'
          : "Keep it going — don't break the chain!"}
      </p>
    </div>
  );
}
