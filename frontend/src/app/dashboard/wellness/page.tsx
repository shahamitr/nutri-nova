'use client';

import { useState, useEffect } from 'react';
import VideoCard from '@/components/content/VideoCard';
import { logActivityWithToast, ACTIVITY_TYPES } from '@/lib/gamification';
import LevelUpModal from '@/components/gamification/LevelUpModal';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration: string;
  viewCount: string;
  publishedAt: string;
}

export default function WellnessPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<'meditation' | 'sleep' | 'stress'>('meditation');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(0);
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchVideos();
  }, [category]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/content/wellness?category=${category}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch wellness videos');
      }

      const data = await response.json();
      setVideos(data.videos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoWatch = async (videoId: string, videoTitle: string) => {
    const token = localStorage.getItem('token');
    if (!token || watchedVideos.has(videoId)) return;

    const result = await logActivityWithToast(token, ACTIVITY_TYPES.VIDEO_WATCHED, {
      video_id: videoId,
      video_title: videoTitle,
      category: 'wellness',
    });

    if (result.level_up && result.new_level) {
      setNewLevel(result.new_level);
      setShowLevelUp(true);
    }

    setWatchedVideos(prev => new Set(prev).add(videoId));
  };

  return (
    <div className="max-w-7xl mx-auto">
      <LevelUpModal
        show={showLevelUp}
        newLevel={newLevel}
        onClose={() => setShowLevelUp(false)}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Wellness Content</h1>
        <p className="text-gray-600">
          Discover meditation, sleep improvement, and stress management videos
        </p>
      </div>

      {/* Category Tabs */}
      <div className="mb-6 flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setCategory('meditation')}
          className={`px-6 py-3 font-medium transition ${
            category === 'meditation'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🧘 Meditation
        </button>
        <button
          onClick={() => setCategory('sleep')}
          className={`px-6 py-3 font-medium transition ${
            category === 'sleep'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          😴 Sleep
        </button>
        <button
          onClick={() => setCategory('stress')}
          className={`px-6 py-3 font-medium transition ${
            category === 'stress'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🌿 Stress Management
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading wellness videos...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchVideos}
            className="mt-2 text-red-600 hover:text-red-800 font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Videos Grid */}
      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div key={video.id} className="relative">
                <VideoCard video={video} />
                <button
                  onClick={() => handleVideoWatch(video.id, video.title)}
                  disabled={watchedVideos.has(video.id)}
                  className={`mt-2 w-full px-4 py-2 rounded-lg font-medium transition ${
                    watchedVideos.has(video.id)
                      ? 'bg-green-100 text-green-700 cursor-not-allowed'
                      : 'bg-purple-500 text-white hover:bg-purple-600'
                  }`}
                >
                  {watchedVideos.has(video.id) ? '✓ Watched (+5 pts)' : '▶ Watch Video (+5 pts)'}
                </button>
              </div>
            ))}
          </div>

          {videos.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">No videos found for this category.</p>
            </div>
          )}
        </>
      )}

      {/* Info Box */}
      <div className="mt-8 bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-2">
          Why Wellness Matters
        </h3>
        <p className="text-purple-800 text-sm leading-relaxed">
          Mental wellness is just as important as physical health. Regular meditation, quality sleep,
          and stress management techniques can significantly improve your overall health outcomes,
          boost your immune system, and enhance your weight management journey.
        </p>
      </div>
    </div>
  );
}
