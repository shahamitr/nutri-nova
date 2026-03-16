'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import StreakIndicator from '@/components/gamification/StreakIndicator';
import Link from 'next/link';
import { PageTransition, FadeIn } from '@/components/motion/MotionWrappers';

interface Progress {
  profile_completed: boolean;
  bmi_calculated: boolean;
  routine_completed: boolean;
  diet_generated: boolean;
  points: number;
  badges: string[];
}

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

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

  const completedSteps = progress
    ? [progress.profile_completed, progress.bmi_calculated, progress.routine_completed, progress.diet_generated].filter(Boolean).length
    : 0;
  const completionPct = (completedSteps / 4) * 100;

  const quickActions = [
    { href: '/dashboard/diet-planning', icon: '🎯', label: 'Start Diet Planning', desc: 'Talk to Dr. Nova', color: 'from-teal-500 to-emerald-600', shadow: 'shadow-teal-500/20' },
    { href: '/dashboard/health-metrics', icon: '📊', label: 'Health Metrics', desc: 'BMI & Profile', color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/20' },
    { href: '/dashboard/exercise-library', icon: '💪', label: 'Exercise Library', desc: 'Workout Videos', color: 'from-orange-500 to-red-500', shadow: 'shadow-orange-500/20' },
    { href: '/dashboard/recipe-hub', icon: '🥗', label: 'Recipe Hub', desc: 'Healthy Recipes', color: 'from-green-500 to-emerald-600', shadow: 'shadow-green-500/20' },
    { href: '/dashboard/wellness', icon: '🧘', label: 'Wellness', desc: 'Mind & Body', color: 'from-purple-500 to-violet-600', shadow: 'shadow-purple-500/20' },
    { href: '/dashboard/gamification', icon: '🏆', label: 'Achievements', desc: 'Rewards & Streaks', color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' },
  ];

  const journeySteps = [
    { key: 'profile_completed', label: 'Create Health Profile', icon: '📋', href: '/dashboard/health-metrics' },
    { key: 'bmi_calculated', label: 'Calculate Your BMI', icon: '⚖️', href: '/dashboard/health-metrics' },
    { key: 'routine_completed', label: 'Establish Routine', icon: '🏃', href: '/dashboard/exercise-library' },
    { key: 'diet_generated', label: 'Generate Diet Plan', icon: '🍽️', href: '/dashboard/diet-planning' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-500 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-8">
        {/* Welcome Hero */}
        <FadeIn delay={0}>
          <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-700 rounded-2xl p-8 text-white shadow-xl shadow-teal-600/15">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10">
          <p className="text-teal-200 text-sm font-medium mb-1">Welcome back,</p>
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">{user?.name || 'there'} 👋</h1>
          <p className="text-teal-100 max-w-lg">
            Your AI-powered nutrition journey continues. Let Dr. Nova help you reach your health goals.
          </p>
        </div>
      </div>
        </FadeIn>

      {/* Streak + Progress Row */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StreakIndicator />

        {/* Progress Overview */}
        {progress && (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Your Journey</h2>
              <span className="text-sm font-semibold text-teal-600">{completionPct}% complete</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 mb-5">
              <div
                className="bg-gradient-to-r from-teal-500 to-emerald-500 h-3 rounded-full transition-all duration-700"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {journeySteps.map((step) => {
                const done = progress[step.key as keyof Progress] as boolean;
                return (
                  <Link
                    key={step.key}
                    href={step.href}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                      done
                        ? 'bg-emerald-50 border border-emerald-200'
                        : 'bg-slate-50 border border-slate-200 hover:border-teal-300 hover:bg-teal-50'
                    }`}
                  >
                    <span className="text-xl">{step.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${done ? 'text-emerald-700' : 'text-slate-700'}`}>
                        {step.label}
                      </p>
                    </div>
                    {done && (
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
        </div>
      </FadeIn>

      {/* Quick Actions Grid */}
      <FadeIn delay={0.2}>
        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`group relative overflow-hidden bg-gradient-to-br ${action.color} rounded-2xl p-6 text-white shadow-lg ${action.shadow} hover:scale-[1.02] active:scale-[0.98] transition-all duration-200`}
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <span className="text-4xl block mb-3">{action.icon}</span>
              <p className="font-bold text-lg">{action.label}</p>
              <p className="text-sm opacity-80 mt-0.5">{action.desc}</p>
              <svg className="w-5 h-5 absolute bottom-5 right-5 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
        </div>
      </FadeIn>

      {/* Points & Badges */}
      <FadeIn delay={0.3}>
        {progress && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-2">Total Points</h3>
              <p className="text-5xl font-black text-teal-600">{progress.points.toLocaleString()}</p>
              <p className="text-sm text-slate-500 mt-1">Keep going to unlock more rewards</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-3">Badges Earned</h3>
              {progress.badges.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {progress.badges.map((badge, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 text-sm font-medium rounded-full border border-amber-200">
                      🏆 {badge}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">Complete activities to earn your first badge</p>
              )}
            </div>
          </div>
        )}
      </FadeIn>
      </div>
    </PageTransition>
  );
}
