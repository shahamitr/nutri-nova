'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';

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

  useEffect(() => {
    fetchGamificationData();
  }, [token]);

  const fetchGamificationData = async () => {
    try {
      setLoading(true);

      // Fetch stats
      const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/gamification/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.stats);

      // Fetch achievements
      const achievementsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/gamification/achievements`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const achievementsData = await achievementsRes.json();
      if (achievementsData.success) setAchievements(achievementsData.achievements);

      // Fetch activities
      const activitiesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/gamification/activities?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const activitiesData = await activitiesRes.json();
      if (activitiesData.success) setActivities(activitiesData.activities);

      // Fetch leaderboard
      const leaderboardRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/gamification/leaderboard?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const leaderboardData = await leaderboardRes.json();
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">🏆 Your Progress</h1>
        <p className="text-gray-600 mt-2">Track your achievements and compete with others</p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <div className="text-4xl font-bold">{stats.level}</div>
            <div className="text-blue-100 mt-1">Level</div>
            <div className="mt-4">
              <div className="bg-blue-400 rounded-full h-2">
                <div
                  className="bg-white rounded-full h-2 transition-all duration-500"
                  style={{ width: `${stats.progress_to_next_level}%` }}
                ></div>
              </div>
              <div className="text-xs text-blue-100 mt-1">
                {stats.progress_to_next_level}% to Level {stats.level + 1}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="text-4xl font-bold">{stats.points.toLocaleString()}</div>
            <div className="text-purple-100 mt-1">Total Points</div>
            <div className="text-sm text-purple-100 mt-2">
              {stats.next_level_points - stats.points} points to next level
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
            <div className="text-4xl font-bold">{stats.current_streak}</div>
            <div className="text-orange-100 mt-1">Day Streak 🔥</div>
            <div className="text-sm text-orange-100 mt-2">
              Longest: {stats.longest_streak} days
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
            <div className="text-4xl font-bold">{stats.achievements_count}</div>
            <div className="text-green-100 mt-1">Achievements</div>
            <div className="text-sm text-green-100 mt-2">
              {stats.total_activities} total activities
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
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
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Achievements</h3>
                {achievements.length === 0 ? (
                  <p className="text-gray-500">No achievements yet. Keep going!</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.slice(0, 4).map((achievement) => (
                      <div key={achievement.id} className="flex items-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-4xl mr-4">{achievement.achievement.icon}</div>
                        <div className="flex-1">
                          <div className="font-semibold">{achievement.achievement.name}</div>
                          <div className="text-sm text-gray-600">{achievement.achievement.description}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            +{achievement.achievement.points} points • {new Date(achievement.earned_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
                {activities.length === 0 ? (
                  <p className="text-gray-500">No activities yet. Start your journey!</p>
                ) : (
                  <div className="space-y-2">
                    {activities.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <span className="mr-3">{getActivityLabel(activity.activity_type)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-semibold text-green-600">+{activity.points_earned} pts</span>
                          <span className="text-gray-500 ml-2">{new Date(activity.created_at).toLocaleDateString()}</span>
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
              <h3 className="text-lg font-semibold mb-4">All Achievements ({achievements.length})</h3>
              {achievements.length === 0 ? (
                <p className="text-gray-500">No achievements yet. Complete activities to earn achievements!</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((achievement) => (
                    <div key={achievement.id} className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                      <div className="text-5xl mb-3">{achievement.achievement.icon}</div>
                      <div className="font-semibold text-lg">{achievement.achievement.name}</div>
                      <div className="text-sm text-gray-600 mt-1">{achievement.achievement.description}</div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm font-semibold text-orange-600">+{achievement.achievement.points} points</span>
                        <span className="text-xs text-gray-500">{new Date(achievement.earned_at).toLocaleDateString()}</span>
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
              <h3 className="text-lg font-semibold mb-4">Activity History</h3>
              {activities.length === 0 ? (
                <p className="text-gray-500">No activities yet. Start logging your progress!</p>
              ) : (
                <div className="space-y-2">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <div>
                        <div className="font-medium">{getActivityLabel(activity.activity_type)}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(activity.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">+{activity.points_earned} points</div>
                        <div className="text-xs text-gray-500">{activity.activity_date}</div>
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
              <h3 className="text-lg font-semibold mb-4">Top Users</h3>
              {leaderboard.length === 0 ? (
                <p className="text-gray-500">Leaderboard is empty. Be the first!</p>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.user_id}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        entry.rank <= 3
                          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          entry.rank === 1 ? 'bg-yellow-400 text-white' :
                          entry.rank === 2 ? 'bg-gray-300 text-white' :
                          entry.rank === 3 ? 'bg-orange-400 text-white' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {entry.rank}
                        </div>
                        <div className="ml-4">
                          <div className="font-semibold">{entry.name}</div>
                          <div className="text-sm text-gray-600">Level {entry.level}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{entry.points.toLocaleString()}</div>
                        <div className="text-xs text-gray-500">points</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
