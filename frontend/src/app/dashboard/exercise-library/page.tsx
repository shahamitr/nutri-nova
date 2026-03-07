'use client';

import React, { useEffect, useState } from 'react';
import VideoCard from '@/components/content/VideoCard';
import { logActivityWithToast, ACTIVITY_TYPES } from '@/lib/gamification';
import LevelUpModal from '@/components/gamification/LevelUpModal';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration?: string;
  viewCount?: string;
  url: string;
}

export default function ExerciseLibraryPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(0);
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchExerciseVideos();
    fetchFavorites();
  }, []);

  const fetchExerciseVideos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/content/exercises', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setVideos(data.data.videos);
      } else {
        setError(data.message || 'Failed to load exercise videos');
      }
    } catch (err) {
      setError('Failed to load exercise videos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch('/api/content/favorites?category=exercise', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        const favoriteIds = new Set(data.data.favorites.map((f: any) => f.video_id));
        setFavorites(favoriteIds);
      }
    } catch (err) {
      console.error('Failed to load favorites:', err);
    }
  };

  const handleFavoriteToggle = async (videoId: string) => {
    const token = localStorage.getItem('token');
    const video = videos.find(v => v.id === videoId);

    if (!video) return;

    try {
      if (favorites.has(videoId)) {
        // Remove from favorites
        await fetch(`/api/content/favorites/${videoId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(videoId);
          return newSet;
        });
      } else {
        // Add to favorites
        await fetch('/api/content/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            videoId: video.id,
            title: video.title,
            thumbnail: video.thumbnail,
            url: video.url,
            category: 'exercise',
          }),
        });

        setFavorites(prev => new Set(prev).add(videoId));
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleVideoWatch = async (videoId: string, videoTitle: string) => {
    const token = localStorage.getItem('token');
    if (!token || watchedVideos.has(videoId)) return;

    const result = await logActivityWithToast(token, ACTIVITY_TYPES.VIDEO_WATCHED, {
      video_id: videoId,
      video_title: videoTitle,
      category: 'exercise',
    });

    if (result.level_up && result.new_level) {
      setNewLevel(result.new_level);
      setShowLevelUp(true);
    }

    setWatchedVideos(prev => new Set(prev).add(videoId));

    // Open video in new tab
    const video = videos.find(v => v.id === videoId);
    if (video) {
      window.open(video.url, '_blank');
    }
  };

  const handleWorkoutComplete = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const result = await logActivityWithToast(token, ACTIVITY_TYPES.WORKOUT_COMPLETED, {
      timestamp: new Date().toISOString(),
    });

    if (result.level_up && result.new_level) {
      setNewLevel(result.new_level);
      setShowLevelUp(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchExerciseVideos}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <LevelUpModal
        show={showLevelUp}
        newLevel={newLevel}
        onClose={() => setShowLevelUp(false)}
      />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Exercise Library
          </h1>
          <p className="text-gray-600">
            Personalized workout videos based on your health profile
          </p>
        </div>

        {/* Workout Completion Button */}
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">💪 Complete Your Workout</h3>
              <p className="text-gray-600">Finished exercising? Log it and earn 20 points!</p>
            </div>
            <button
              onClick={handleWorkoutComplete}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition shadow-lg"
            >
              ✓ Mark Complete (+20 pts)
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-sm text-green-800">
                These videos are selected based on your activity level, health conditions, and fitness goals.
                Click the heart icon to save your favorites!
              </p>
            </div>
          </div>
        </div>

        {/* Video Grid */}
        {videos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div key={video.id} className="relative">
                <VideoCard
                  {...video}
                  isFavorite={favorites.has(video.id)}
                  onFavoriteToggle={handleFavoriteToggle}
                />
                <button
                  onClick={() => handleVideoWatch(video.id, video.title)}
                  disabled={watchedVideos.has(video.id)}
                  className={`mt-2 w-full px-4 py-2 rounded-lg font-medium transition ${
                    watchedVideos.has(video.id)
                      ? 'bg-green-100 text-green-700 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {watchedVideos.has(video.id) ? '✓ Watched (+5 pts)' : '▶ Watch Video (+5 pts)'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No exercise videos found</p>
          </div>
        )}
      </div>
    </div>
  );
}
