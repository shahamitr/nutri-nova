'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import ProgressCard from '@/components/dashboard/ProgressCard';

interface Progress {
  profile_completed: boolean;
  bmi_calculated: boolean;
  routine_completed: boolean;
  diet_generated: boolean;
  points: number;
  badges: string[];
}

export default function ProgressPage() {
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
    return <div className="text-center py-12">Loading progress...</div>;
  }

  if (!progress) {
    return <div className="text-center py-12">No progress data found.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your Progress</h1>
      <ProgressCard progress={progress} completionPercentage={calculateCompletion()} />
    </div>
  );
}
