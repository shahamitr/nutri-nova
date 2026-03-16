'use client';

import React, { useEffect, useState } from 'react';
import VideoCard from '@/components/content/VideoCard';
import VideoPlayerModal from '@/components/content/VideoPlayerModal';
import { logActivityWithToast, ACTIVITY_TYPES } from '@/lib/gamification';
import LevelUpModal from '@/components/gamification/LevelUpModal';
import PageHeader from '@/components/dashboard/PageHeader';
import { PageTransition, FadeIn } from '@/components/motion/MotionWrappers';

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
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

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
      const token = localStorage.getItem('auth_token');
      const url = selectedMealType === 'all'
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/content/recipes`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/content/recipes?mealType=${selectedMealType}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
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
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/content/favorites?category=recipe`, {
        headers: { Authorization: `Bearer ${token}` },
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
    const token = localStorage.getItem('auth_token');
    const video = videos.find(v => v.id === videoId);
    if (!video) return;
    try {
      if (favorites.has(videoId)) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/content/favorites/${videoId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        setFavorites(prev => { const s = new Set(prev); s.delete(videoId); return s; });
      } else {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/content/favorites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ videoId: video.id, title: video.title, thumbnail: video.thumbnail, url: video.url, category: 'recipe' }),
        });
        setFavorites(prev => new Set(prev).add(videoId));
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleVideoWatch = async (videoId: string, videoTitle: string) => {
    const token = localStorage.getItem('auth_token');
    const video = videos.find(v => v.id === videoId);
    if (video) setActiveVideo(video);

    if (!token || watchedVideos.has(videoId)) return;
    const result = await logActivityWithToast(token, ACTIVITY_TYPES.VIDEO_WATCHED, {
      video_id: videoId, video_title: videoTitle, category: 'recipe',
    });
    if (result.level_up && result.new_level) {
      setNewLevel(result.new_level);
      setShowLevelUp(true);
    }
    setWatchedVideos(prev => new Set(prev).add(videoId));
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <PageHeader
            title="Recipe Hub"
            description="Healthy recipes tailored to your dietary preferences"
            icon="🥗"
          />
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-slate-500">Loading healthy recipes...</p>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <PageHeader
            title="Recipe Hub"
            description="Healthy recipes tailored to your dietary preferences"
            icon="🥗"
          />
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-800">{error}</p>
            <button onClick={fetchRecipeVideos} className="mt-4 px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all shadow-sm">
              Try Again
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <LevelUpModal show={showLevelUp} newLevel={newLevel} onClose={() => setShowLevelUp(false)} />
        {activeVideo && (
          <VideoPlayerModal videoId={activeVideo.id} title={activeVideo.title} onClose={() => setActiveVideo(null)} />
        )}

        <PageHeader
          title="Recipe Hub"
          description="Healthy recipes tailored to your dietary preferences"
          icon="🥗"
        />

        {/* Meal Type Filter */}
        <FadeIn delay={0.1}>
          <div className="flex flex-wrap gap-2">
            {mealTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedMealType(type.value)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  selectedMealType === type.value
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200/60 hover:bg-slate-50'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </FadeIn>

        {/* Info Banner */}
        <FadeIn delay={0.15}>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm text-emerald-800">
                These recipes match your diet preference and exclude your allergens. Save your favorites for quick access!
              </p>
            </div>
          </div>
        </FadeIn>

        {/* Video Grid */}
        <FadeIn delay={0.2}>
          {videos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <div key={video.id} className="relative">
                  <VideoCard
                    {...video}
                    isFavorite={favorites.has(video.id)}
                    onFavoriteToggle={handleFavoriteToggle}
                    onPlay={(id) => handleVideoWatch(id, video.title)}
                  />
                  <button
                    onClick={() => handleVideoWatch(video.id, video.title)}
                    disabled={watchedVideos.has(video.id)}
                    className={`mt-3 w-full px-4 py-2.5 rounded-xl font-medium transition-all ${
                      watchedVideos.has(video.id)
                        ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed'
                        : 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:from-teal-600 hover:to-emerald-700 shadow-sm'
                    }`}
                  >
                    {watchedVideos.has(video.id) ? '✓ Watched (+5 pts)' : '▶ Watch Recipe (+5 pts)'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/60">
              <p className="text-slate-500">No recipes found for this category</p>
            </div>
          )}
        </FadeIn>
      </div>
    </PageTransition>
  );
}
