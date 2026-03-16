'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import ProgressCard from '@/components/dashboard/ProgressCard';
import PageHeader from '@/components/dashboard/PageHeader';
import { PageTransition, FadeIn } from '@/components/motion/MotionWrappers';

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

  useEffect(() => { fetchProgress(); }, []);

  const fetchProgress = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/progress/user`, {
        headers: { Authorization: `Bearer ${token}` },
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
    const completed = [progress.profile_completed, progress.bmi_calculated, progress.routine_completed, progress.diet_generated].filter(Boolean).length;
    return (completed / 4) * 100;
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
        <p className="mt-4 text-slate-500">Loading progress...</p>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/60 shadow-sm">
        <p className="text-slate-500">No progress data found.</p>
      </div>
    );
  }

  return (
    <PageTransition>
    <div className="space-y-6">
      <PageHeader
        title="Your Progress"
        description="Track your journey milestones"
        icon="📈"
      />
      <FadeIn delay={0.1}>
        <ProgressCard progress={progress} completionPercentage={calculateCompletion()} />
      </FadeIn>
    </div>
    </PageTransition>
  );
}
