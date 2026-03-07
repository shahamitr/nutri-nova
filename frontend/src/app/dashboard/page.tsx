'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import ProgressCard from '@/components/dashboard/ProgressCard';
import StreakIndicator from '@/components/gamification/StreakIndicator';
import Link from 'next/link';

interface Progress {
  profile_completed: boolean;
  bmi_calculated: boolean;
  routine_completed: boolean;
  diet_generated: boolean;
  points: number;
  badges: string[];
}

export default function DashboardPage() {
  const { token } = useAuth();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/progress/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProgress(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletion = () => {
    if (!progress) return 0;
    const completed = [
      progress.profile_completed,
      progress.bmi_calculated,
      progress.routine_completed,
      progress.diet_generated,
    ].filter(Boolean).length;
    return (completed / 4) * 100;
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Welcome to NutriVoice AI</h1>

      {/* Streak Indicator */}
      <div className="mb-6">
        <StreakIndicator />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {progress && (
          <ProgressCard progress={progress} completionPercentage={calculateCompletion()} />
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/dashboard/diet-planning"
              className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="font-medium text-blue-900">Start Diet Planning</p>
                  <p className="text-sm text-blue-700">Begin your personalized nutrition journey</p>
                </div>
              </div>
            </Link>

            <Link
              href="/dashboard/health-metrics"
              className="block p-4 bg-green-50 hover:bg-green-100 rounded-lg transition"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📊</span>
                <div>
                  <p className="font-medium text-green-900">View Health Metrics</p>
                  <p className="text-sm text-green-700">Check your BMI and health profile</p>
                </div>
              </div>
            </Link>

            {progress?.diet_generated && (
              <Link
                href="/dashboard/diet-plan"
                className="block p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🍽️</span>
                  <div>
                    <p className="font-medium text-purple-900">My Diet Plan</p>
                    <p className="text-sm text-purple-700">View your personalized meal plan</p>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
