'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import PageHeader from '@/components/dashboard/PageHeader';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '@/components/motion/MotionWrappers';

interface UserStats {
  points: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  total_activities: number;
  achievements_count: number;
  next_level_points: number;
  progress_to_next_level: number;
}

interface Achievement {
  id: number;
  user_id: number;
  achievement_id: number;
  earned_at: string;
  achievement: {
    id: number;
    name: string;
    description: string;
    icon: string;
    points: number;
    category: string;
  };
}

interface Activity {
  id: number;
  user_id: number;
  activity_type: string;
  points_earned: number;
  activity_date: string;
  created_at: string;
  metadata?: any;
}

interface LeaderboardEntry {
  user_id: number;
  name: string;
  points: number;
  level: number;
  rank: number;
}

export default function GamificationPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'activities' | 'leaderboard'>('overview');

  useEffect(() => { fetchGamificationData(); }, [token]);

  const fetchGamificationData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, achievementsRes, activitiesRes, leaderboardRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/gamification/stats`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/gamification/achievements`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/gamification/activities?limit=10`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/gamification/leaderboard?limit=10`, { headers }),
      ]);

      const [statsData, achievementsData, activitiesData, leaderboardData] = await Promise.all([
        statsRes.json(), achievementsRes.json(), activitiesRes.json(), leaderboardRes.json(),
      ]);

      if (statsData.success) setStats(statsData.stats);
      if (achievementsData.success) setAchievements(achievementsData.achievements);
      if (activitiesData.success) setActivities(activitiesData.activities);
      if (leaderboardData.success) setLeaderboard(leaderboardData.leaderboard);
    } catch (error) {
      console.error('Error fetching gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityLabel = (activityType: string): string => {
    const labels: Record<string, string> = {
      meal_logged: '🍽️ Meal Logged',
      workout_completed: '💪 Workout Completed',
      water_logged: '💧 Water Logged',
      video_watched: '📺 Video Watched',
      diet_plan_created: '📋 Diet Plan Created',
      health_assessment: '🏥 Health Assessment',
      report_generated: '📄 Report Generated',
      goal_updated: '🎯 Goal Updated',
    };
    return labels[activityType] || activityType;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-slate-500">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
    <div className="space-y-6">
      <PageHeader
        title="Your Progress"
        description="Track your achievements and compete with others"
        icon="🏆"
      />

      {/* Stats Overview */}
      {stats && (
        <FadeIn delay={0.1}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-6 text-white shadow-sm">
            <div className="text-4xl font-bold">{stats.level}</div>
            <div className="text-teal-100 mt-1">Level</div>
            <div className="mt-4">
              <div className="bg-teal-400/40 rounded-full h-2">
                <div className="bg-white rounded-full h-2 transition-all duration-500" style={{ width: `${stats.progress_to_next_level}%` }}></div>
              </div>
              <div className="text-xs text-teal-100 mt-1">{stats.progress_to_next_level}% to Level {stats.level + 1}</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-6 text-white shadow-sm">
            <div className="text-4xl font-bold">{stats.points.toLocaleString()}</div>
            <div className="text-purple-100 mt-1">Total Points</div>
            <div className="text-sm text-purple-100 mt-2">{stats.next_level_points - stats.points} pts to next level</div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-sm">
            <div className="text-4xl font-bold">{stats.current_streak}</div>
            <div className="text-orange-100 mt-1">Day Streak 🔥</div>
            <div className="text-sm text-orange-100 mt-2">Longest: {stats.longest_streak} days</div>
          </div>
          <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-6 text-white shadow-sm">
            <div className="text-4xl font-bold">{stats.achievements_count}</div>
            <div className="text-sky-100 mt-1">Achievements</div>
            <div className="text-sm text-sky-100 mt-2">{stats.total_activities} total activities</div>
          </div>
        </div>
        </FadeIn>
      )}

      {/* Tabs */}
      <FadeIn delay={0.2}>
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm mb-6">
        <div className="border-b border-slate-200/60">
          <nav className="flex -mb-px">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'achievements', label: 'Achievements', icon: '🏅' },
              { id: 'activities', label: 'Activities', icon: '📝' },
              { id: 'leaderboard', label: 'Leaderboard', icon: '👥' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>{tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Achievements</h3>
                {achievements.length === 0 ? (
                  <p className="text-slate-500">No achievements yet. Keep going!</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.slice(0, 4).map((a) => (
                      <div key={a.id} className="flex items-center p-4 bg-slate-50 rounded-xl">
                        <div className="text-4xl mr-4">{a.achievement.icon}</div>
                        <div className="flex-1">
                          <div className="font-semibold text-slate-800">{a.achievement.name}</div>
                          <div className="text-sm text-slate-500">{a.achievement.description}</div>
                          <div className="text-xs text-slate-400 mt-1">+{a.achievement.points} pts • {new Date(a.earned_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Activities</h3>
                {activities.length === 0 ? (
                  <p className="text-slate-500">No activities yet. Start your journey!</p>
                ) : (
                  <div className="space-y-2">
                    {activities.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <span>{getActivityLabel(activity.activity_type)}</span>
                        <div className="text-sm">
                          <span className="font-semibold text-emerald-600">+{activity.points_earned} pts</span>
                          <span className="text-slate-400 ml-2">{new Date(activity.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">All Achievements ({achievements.length})</h3>
              {achievements.length === 0 ? (
                <p className="text-slate-500">No achievements yet. Complete activities to earn achievements!</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((a) => (
                    <div key={a.id} className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
                      <div className="text-5xl mb-3">{a.achievement.icon}</div>
                      <div className="font-semibold text-lg text-slate-800">{a.achievement.name}</div>
                      <div className="text-sm text-slate-500 mt-1">{a.achievement.description}</div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm font-semibold text-orange-600">+{a.achievement.points} pts</span>
                        <span className="text-xs text-slate-400">{new Date(a.earned_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Activities Tab */}
          {activeTab === 'activities' && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Activity History</h3>
              {activities.length === 0 ? (
                <p className="text-slate-500">No activities yet. Start logging your progress!</p>
              ) : (
                <div className="space-y-2">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition">
                      <div>
                        <div className="font-medium text-slate-800">{getActivityLabel(activity.activity_type)}</div>
                        <div className="text-sm text-slate-400">{new Date(activity.created_at).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-emerald-600">+{activity.points_earned} pts</div>
                        <div className="text-xs text-slate-400">{activity.activity_date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Top Users</h3>
              {leaderboard.length === 0 ? (
                <p className="text-slate-500">Leaderboard is empty. Be the first!</p>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry) => (
                    <div key={entry.user_id} className={`flex items-center justify-between p-4 rounded-xl ${entry.rank <= 3 ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200' : 'bg-slate-50'}`}>
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${entry.rank === 1 ? 'bg-amber-400 text-white' : entry.rank === 2 ? 'bg-slate-300 text-white' : entry.rank === 3 ? 'bg-orange-400 text-white' : 'bg-slate-200 text-slate-600'}`}>
                          {entry.rank}
                        </div>
                        <div className="ml-4">
                          <div className="font-semibold text-slate-800">{entry.name}</div>
                          <div className="text-sm text-slate-500">Level {entry.level}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg text-slate-800">{entry.points.toLocaleString()}</div>
                        <div className="text-xs text-slate-400">points</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      </FadeIn>
    </div>
    </PageTransition>
  );
}
