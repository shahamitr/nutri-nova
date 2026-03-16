'use client';

import { useState, useEffect } from 'react';
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
  publishedAt: string;
  url: string;
}

export default function WellnessPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<'meditation' | 'sleep' | 'stress'>('meditation');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(0);
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set());
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  useEffect(() => { fetchVideos(); }, [category]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/content/wellness?topic=${category}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
      });
      if (!response.ok) throw new Error('Failed to fetch wellness videos');
      const data = await response.json();
      setVideos(data.data?.videos ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoWatch = async (videoId: string, videoTitle: string) => {
    const token = localStorage.getItem('auth_token');
    const video = videos.find(v => v.id === videoId);
    if (video) setActiveVideo(video);
    if (!token || watchedVideos.has(videoId)) return;
    const result = await logActivityWithToast(token, ACTIVITY_TYPES.VIDEO_WATCHED, {
      video_id: videoId, video_title: videoTitle, category: 'wellness',
    });
    if (result.level_up && result.new_level) {
      setNewLevel(result.new_level);
      setShowLevelUp(true);
    }
    setWatchedVideos(prev => new Set(prev).add(videoId));
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <LevelUpModal show={showLevelUp} newLevel={newLevel} onClose={() => setShowLevelUp(false)} />
        {activeVideo && <VideoPlayerModal videoId={activeVideo.id} title={activeVideo.title} onClose={() => setActiveVideo(null)} />}

        <PageHeader
          title="Wellness Content"
          description="Discover meditation, sleep improvement, and stress management videos"
          icon="🧘"
        />

        {/* Category Tabs */}
        <FadeIn delay={0.1}>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'meditation', label: '🧘 Meditation' },
              { key: 'sleep', label: '😴 Sleep' },
              { key: 'stress', label: '🌿 Stress Management' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setCategory(tab.key as any)}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                  category === tab.key
                    ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200/60 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </FadeIn>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            <p className="mt-4 text-slate-500">Loading wellness videos...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-red-800">{error}</p>
            <button onClick={fetchVideos} className="mt-2 text-red-600 hover:text-red-800 font-medium">Try Again</button>
          </div>
        )}

        <FadeIn delay={0.2}>
          {!loading && !error && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <div key={video.id} className="relative">
                    <VideoCard
                      id={video.id} title={video.title} thumbnail={video.thumbnail} channelTitle={video.channelTitle}
                      duration={video.duration} viewCount={video.viewCount} url={video.url || `https://www.youtube.com/watch?v=${video.id}`}
                      onPlay={(id) => handleVideoWatch(id, video.title)}
                    />
                    <button
                      onClick={() => handleVideoWatch(video.id, video.title)}
                      disabled={watchedVideos.has(video.id)}
                      className={`mt-3 w-full px-4 py-2.5 rounded-xl font-medium transition-all ${
                        watchedVideos.has(video.id)
                          ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-500 to-violet-600 text-white hover:from-purple-600 hover:to-violet-700 shadow-sm'
                      }`}
                    >
                      {watchedVideos.has(video.id) ? '✓ Watched (+5 pts)' : '▶ Watch Video (+5 pts)'}
                    </button>
                  </div>
                ))}
              </div>
              {videos.length === 0 && (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/60">
                  <p className="text-slate-500">No videos found for this category.</p>
                </div>
              )}
            </>
          )}
        </FadeIn>

        {/* Info Box */}
        <FadeIn delay={0.3}>
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">Why Wellness Matters</h3>
            <p className="text-purple-800 text-sm leading-relaxed">
              Mental wellness is just as important as physical health. Regular meditation, quality sleep,
              and stress management techniques can significantly improve your overall health outcomes,
              boost your immune system, and enhance your weight management journey.
            </p>
          </div>
        </FadeIn>
      </div>
    </PageTransition>
  );
}
