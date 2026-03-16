'use client';

import { useState, useEffect } from 'react';
import VideoCard from '@/components/content/VideoCard';
import VideoPlayerModal from '@/components/content/VideoPlayerModal';
import PageHeader from '@/components/dashboard/PageHeader';
import { PageTransition, FadeIn } from '@/components/motion/MotionWrappers';

interface Video {
  id: string;
  video_id?: string;
  title: string;
  thumbnail: string;
  channelTitle?: string;
  duration?: string;
  viewCount?: string;
  publishedAt?: string;
  category: string;
  url?: string;
}

export default function FavoritesPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  useEffect(() => { fetchFavorites(); }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/content/favorites`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch favorite videos');
      const data = await response.json();
      setVideos(data.data?.favorites ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (videoId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/content/favorites/${videoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      if (!response.ok) throw new Error('Failed to remove favorite');
      setVideos(videos.filter(v => (v.video_id || v.id) !== videoId));
    } catch (err) {
      console.error('Error removing favorite:', err);
    }
  };

  const filteredVideos = filterCategory === 'all' ? videos : videos.filter(v => v.category === filterCategory);
  const categories = ['all', ...Array.from(new Set(videos.map(v => v.category)))];

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="My Favorites"
          description="All your saved videos in one place"
          icon="📌"
        />

        {activeVideo && (
          <VideoPlayerModal videoId={activeVideo.video_id || activeVideo.id} title={activeVideo.title} onClose={() => setActiveVideo(null)} />
        )}

          {/* Category Filter */}
        <FadeIn delay={0.1}>
          {videos.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    filterCategory === cat
                      ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200/60 hover:bg-slate-50'
                  }`}
                >
                  {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          )}
        </FadeIn>

        {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          <p className="mt-4 text-slate-500">Loading your favorites...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
          <p className="text-red-800">{error}</p>
          <button onClick={fetchFavorites} className="mt-2 text-red-600 hover:text-red-800 font-medium">Try Again</button>
        </div>
      )}

        <FadeIn delay={0.2}>
          {!loading && !error && (
            <>
              {filteredVideos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredVideos.map((video) => (
                    <div key={video.id || video.video_id} className="relative">
                      <VideoCard
                        id={video.video_id || video.id}
                        title={video.title}
                        thumbnail={video.thumbnail}
                        channelTitle={video.channelTitle || ''}
                        duration={video.duration}
                        viewCount={video.viewCount}
                        url={video.url || `https://www.youtube.com/watch?v=${video.video_id || video.id}`}
                        onPlay={(id) => { const v = filteredVideos.find(fv => (fv.video_id || fv.id) === id); if (v) setActiveVideo(v); }}
                      />
                      <button
                        onClick={() => handleRemoveFavorite(video.video_id || video.id)}
                        className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-red-500 p-2 rounded-xl hover:bg-red-50 transition-all shadow-sm border border-slate-200/60"
                        title="Remove from favorites"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/60">
                  <p className="text-3xl mb-3">📌</p>
                  <p className="text-slate-600 mb-2">
                    {filterCategory === 'all' ? "You haven't saved any favorites yet" : `No ${filterCategory} videos in your favorites`}
                  </p>
                  <p className="text-sm text-slate-400">Browse Exercise Library, Recipe Hub, or Wellness pages to save videos</p>
                </div>
              )}
            </>
          )}
        </FadeIn>

        {/* Stats */}
        <FadeIn delay={0.3}>
          {videos.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Your Collection</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {[
                  { label: 'Total Favorites', count: videos.length, color: 'text-teal-600' },
                  { label: 'Exercise', count: videos.filter(v => v.category === 'exercise').length, color: 'text-orange-600' },
                  { label: 'Recipes', count: videos.filter(v => v.category === 'recipe').length, color: 'text-emerald-600' },
                  { label: 'Wellness', count: videos.filter(v => v.category === 'wellness').length, color: 'text-purple-600' },
                ].map((stat) => (
                  <div key={stat.label} className="p-3 bg-slate-50 rounded-xl">
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </FadeIn>
      </div>
    </PageTransition>
  );
}
