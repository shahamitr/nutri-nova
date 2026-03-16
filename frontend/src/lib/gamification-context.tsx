'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useAuth } from './auth-context';

interface GamificationStats {
  points: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  total_activities: number;
  achievements_count: number;
  next_level_points: number;
  progress_to_next_level: number;
}

interface GamificationContextType {
  stats: GamificationStats | null;
  loading: boolean;
  refreshStats: () => Promise<void>;
  refreshStreak: () => Promise<void>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/gamification/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching gamification stats:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const refreshStats = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  const refreshStreak = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Listen for gamification events
  useEffect(() => {
    const handleGamificationUpdate = () => {
      refreshStats();
    };

    window.addEventListener('gamification:update', handleGamificationUpdate);
    window.addEventListener('gamification:activity', handleGamificationUpdate);
    window.addEventListener('gamification:levelup', handleGamificationUpdate);

    return () => {
      window.removeEventListener('gamification:update', handleGamificationUpdate);
      window.removeEventListener('gamification:activity', handleGamificationUpdate);
      window.removeEventListener('gamification:levelup', handleGamificationUpdate);
    };
  }, [refreshStats]);

  return (
    <GamificationContext.Provider value={{ stats, loading, refreshStats, refreshStreak }}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}
