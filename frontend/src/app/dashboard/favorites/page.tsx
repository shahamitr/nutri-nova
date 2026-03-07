'use client';

import { useState, useEffect } from 'react';
import VideoCard from '@/components/content/VideoCard';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration: string;
  viewCount: string;
  publishedAt: string;
  category: string;
}

export default function FavoritesPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/content/favorites', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch favorite videos');
      }

      const data = await response.json();
      setVideos(data.favorites);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (videoId: string) => {
    try {
      const response = await fetch('/api/content/favorites', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove favorite');
      }

      // Remove from local state
      setVideos(videos.filter(v => v.id !== videoId));
    } catch (err) {
      console.error('Error removing favorite:', err);
    }
  };

  const filteredVideos = filterCategory === 'all'
    ? videos
    : videos.filter(v => v.category === filterCategory);

  const categories = ['all', ...Array.from(new Set(videos.map(v => v.category)))];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Favorites</h1>
        <p className="text-gray-600">
          All your saved videos in one place
        </p>
      </div>

      {/* Category Filter */}
      {videos.length > 0 && (
        <div className="mb-6 flex gap-3 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading your favorites...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchFavorites}
            className="mt-2 text-red-600 hover:text-red-800 font-medium"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Videos Grid */}
      {!loading && !error && (
        <>
          {filteredVideos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video) => (
                <div key={video.id} className="relative">
                  <VideoCard video={video} />
                  <button
                    onClick={() => handleRemoveFavorite(video.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition shadow-lg"
                    title="Remove from favorites"
                  >
                    ❌
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-2xl mb-2">📌</p>
              <p className="text-gray-600 mb-4">
                {filterCategory === 'all'
                  ? "You haven't saved any favorites yet"
                  : `No ${filterCategory} videos in your favorites`
                }
              </p>
              <p className="text-sm text-gray-500">
                Browse Exercise Library, Recipe Hub, or Wellness pages to save videos
              </p>
            </div>
          )}
        </>
      )}

      {/* Stats */}
      {videos.length > 0 && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Your Collection
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{videos.length}</p>
              <p className="text-sm text-blue-800">Total Favorites</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {videos.filter(v => v.category === 'exercise').length}
              </p>
              <p className="text-sm text-blue-800">Exercise</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {videos.filter(v => v.category === 'recipe').length}
              </p>
              <p className="text-sm text-blue-800">Recipes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {videos.filter(v => v.category === 'wellness').length}
              </p>
              <p className="text-sm text-blue-800">Wellness</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
