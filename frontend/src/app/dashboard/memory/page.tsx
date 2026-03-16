'use client';

import { useState, useEffect } from 'react';
import PageHeader from '@/components/dashboard/PageHeader';
import { PageTransition, FadeIn } from '@/components/motion/MotionWrappers';

interface Memory {
  id: number;
  memory_type: 'preference' | 'fact' | 'goal' | 'concern' | 'restriction';
  content: string;
  importance: number;
  created_at: string;
  last_referenced: string;
  reference_count: number;
}

interface MemoryStats {
  total: number;
  by_type: Record<string, number>;
  most_referenced: Memory[];
}

export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => { fetchMemories(); fetchStats(); }, [filter]);

  const fetchMemories = async () => {
    try {
      setLoading(true);
      const endpoint = filter === 'all'
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/memory`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/memory/type/${filter}`;
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch memories');
      const data = await response.json();
      setMemories(data.memories);
    } catch (error) {
      console.error('Error fetching memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/memory/stats`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = { preference: '❤️', fact: '📋', goal: '🎯', concern: '⚠️', restriction: '🚫' };
    return icons[type] || '📝';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      preference: 'bg-pink-100 text-pink-800',
      fact: 'bg-sky-100 text-sky-800',
      goal: 'bg-emerald-100 text-emerald-800',
      concern: 'bg-amber-100 text-amber-800',
      restriction: 'bg-red-100 text-red-800',
    };
    return colors[type] || 'bg-slate-100 text-slate-800';
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Conversation Memory"
          description="What I remember about you from our conversations"
          icon="🧠"
        />

        {/* Stats Cards */}
        <FadeIn delay={0.1}>
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Total Memories', value: stats.total, color: 'text-teal-600' },
                { label: 'Preferences', value: stats.by_type.preference || 0, color: 'text-pink-600' },
                { label: 'Goals', value: stats.by_type.goal || 0, color: 'text-emerald-600' },
                { label: 'Restrictions', value: stats.by_type.restriction || 0, color: 'text-red-600' },
                { label: 'Facts', value: stats.by_type.fact || 0, color: 'text-sky-600' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-4 text-center">
                  <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          )}
        </FadeIn>

        {/* Filter Tabs */}
        <FadeIn delay={0.15}>
          <div className="flex gap-2 flex-wrap">
            {['all', 'preference', 'goal', 'restriction', 'fact', 'concern'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  filter === type
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200/60 hover:bg-slate-50'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </FadeIn>

        {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          <p className="mt-4 text-slate-500">Loading memories...</p>
        </div>
      )}

        <FadeIn delay={0.2}>
          {!loading && (
            <>
              {memories.length > 0 ? (
                <div className="space-y-4">
                  {memories.map((memory) => (
                    <div key={memory.id} className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 hover:shadow-md transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-2xl">{getTypeIcon(memory.memory_type)}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(memory.memory_type)}`}>
                              {memory.memory_type}
                            </span>
                            <span className="text-sm text-slate-400">Importance: {memory.importance}/10</span>
                          </div>
                          <p className="text-slate-800 text-lg mb-3">{memory.content}</p>
                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span>📅 {new Date(memory.created_at).toLocaleDateString()}</span>
                            <span>🔄 {memory.reference_count}x referenced</span>
                            <span>⏰ Last: {new Date(memory.last_referenced).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/60">
                  <p className="text-3xl mb-3">🧠</p>
                  <p className="text-slate-600 mb-2">
                    {filter === 'all' ? 'No memories yet. Start a conversation to build your memory profile!' : `No ${filter} memories found`}
                  </p>
                </div>
              )}
            </>
          )}
        </FadeIn>

        {/* Most Referenced */}
        <FadeIn delay={0.25}>
          {stats && stats.most_referenced.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4">Most Referenced</h2>
              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl border border-teal-200 p-6">
                <div className="space-y-3">
                  {stats.most_referenced.map((memory, index) => (
                    <div key={memory.id} className="flex items-start gap-3">
                      <span className="text-2xl font-bold text-teal-600">#{index + 1}</span>
                      <div className="flex-1">
                        <p className="text-slate-800">{memory.content}</p>
                        <p className="text-sm text-slate-500 mt-1">Referenced {memory.reference_count} times</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </FadeIn>

        {/* Info Box */}
        <FadeIn delay={0.3}>
          <div className="bg-teal-50 border border-teal-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-teal-900 mb-2">💡 How Memory Works</h3>
            <p className="text-teal-800 text-sm leading-relaxed">
              I remember important information from our conversations to provide more personalized advice.
              This includes your dietary preferences, health goals, restrictions, and concerns.
              The more we talk, the better I understand your needs and can tailor recommendations specifically for you.
            </p>
          </div>
        </FadeIn>
      </div>
    </PageTransition>
  );
}
