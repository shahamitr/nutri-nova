'use client';

import { useState, useEffect } from 'react';

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

  useEffect(() => {
    fetchMemories();
    fetchStats();
  }, [filter]);

  const fetchMemories = async () => {
    try {
      setLoading(true);
      const endpoint = filter === 'all'
        ? '/api/memory'
        : `/api/memory/type/${filter}`;

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
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
      const response = await fetch('/api/memory/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'preference': return '❤️';
      case 'fact': return '📋';
      case 'goal': return '🎯';
      case 'concern': return '⚠️';
      case 'restriction': return '🚫';
      default: return '📝';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'preference': return 'bg-pink-100 text-pink-800';
      case 'fact': return 'bg-blue-100 text-blue-800';
      case 'goal': return 'bg-green-100 text-green-800';
      case 'concern': return 'bg-yellow-100 text-yellow-800';
      case 'restriction': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Conversation Memory</h1>
        <p className="text-gray-600">
          What I remember about you from our conversations
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-sm text-gray-600">Total Memories</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-3xl font-bold text-pink-600">{stats.by_type.preference || 0}</p>
            <p className="text-sm text-gray-600">Preferences</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{stats.by_type.goal || 0}</p>
            <p className="text-sm text-gray-600">Goals</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{stats.by_type.restriction || 0}</p>
            <p className="text-sm text-gray-600">Restrictions</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{stats.by_type.fact || 0}</p>
            <p className="text-sm text-gray-600">Facts</p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {['all', 'preference', 'goal', 'restriction', 'fact', 'concern'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === type
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading memories...</p>
        </div>
      )}

      {/* Memories List */}
      {!loading && (
        <>
          {memories.length > 0 ? (
            <div className="space-y-4">
              {memories.map((memory) => (
                <div
                  key={memory.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{getTypeIcon(memory.memory_type)}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(memory.memory_type)}`}>
                          {memory.memory_type}
                        </span>
                        <span className="text-sm text-gray-500">
                          Importance: {memory.importance}/10
                        </span>
                      </div>
                      <p className="text-gray-800 text-lg mb-3">{memory.content}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>📅 Created: {new Date(memory.created_at).toLocaleDateString()}</span>
                        <span>🔄 Referenced: {memory.reference_count} times</span>
                        <span>⏰ Last used: {new Date(memory.last_referenced).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-2xl mb-2">🧠</p>
              <p className="text-gray-600 mb-4">
                {filter === 'all'
                  ? "No memories yet. Start a conversation to build your memory profile!"
                  : `No ${filter} memories found`
                }
              </p>
            </div>
          )}
        </>
      )}

      {/* Most Referenced Memories */}
      {stats && stats.most_referenced.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Most Referenced</h2>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
            <div className="space-y-3">
              {stats.most_referenced.map((memory, index) => (
                <div key={memory.id} className="flex items-start gap-3">
                  <span className="text-2xl font-bold text-blue-600">#{index + 1}</span>
                  <div className="flex-1">
                    <p className="text-gray-800">{memory.content}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Referenced {memory.reference_count} times
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          💡 How Memory Works
        </h3>
        <p className="text-blue-800 text-sm leading-relaxed">
          I remember important information from our conversations to provide more personalized advice.
          This includes your dietary preferences, health goals, restrictions, and concerns.
          The more we talk, the better I understand your needs and can tailor recommendations specifically for you.
        </p>
      </div>
    </div>
  );
}
