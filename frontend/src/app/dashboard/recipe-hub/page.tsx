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

export default function RecipeHubPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [selectedMealType, setSelectedMealType] = useState<string>('all');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(0);
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set());

  const mealTypes = [
    { value: 'all', label: 'All Recipes' },
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snacks' },
    { value: 'smoothie', label: 'Smoothies & Juices' },
  ];

  useEffect(() => {
    fetchRecipeVideos();
    fetchFavorites();
  }, [selectedMealType]);

  const fetchRecipeVideos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const url = selectedMealType === 'all'
        ? '/api/content/recipes'
        : `/api/content/recipes?mealType=${selectedMealType}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setVideos(data.data.videos);
      } else {
        setError(data.message || 'Failed to load recipe videos');
      }
    } catch (err) {
      setError('Failed to load recipe videos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch('/api/content/favorites?category=recipe', {
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
            category: 'recipe',
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
      category: 'recipe',
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading healthy recipes...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchRecipeVideos}
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
            Recipe Hub
          </h1>
          <p className="text-gray-600">
            Healthy recipes tailored to your dietary preferences
          </p>
        </div>

        {/* Meal Type Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {mealTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedMealType(type.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedMealType === type.value
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {type.label}
              </button>
            ))}
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
                These recipes match your diet preference and exclude your allergens.
                Save your favorites for quick access!
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
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  {watchedVideos.has(video.id) ? '✓ Watched (+5 pts)' : '▶ Watch Recipe (+5 pts)'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No recipes found for this category</p>
          </div>
        )}
      </div>
    </div>
  );
}
