'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface VideoCardProps {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  duration?: string;
  viewCount?: string;
  url: string;
  isFavorite?: boolean;
  onFavoriteToggle?: (videoId: string) => void;
  onPlay?: (videoId: string) => void;
}

export default function VideoCard({
  id,
  title,
  thumbnail,
  channelTitle,
  duration,
  viewCount,
  url,
  isFavorite = false,
  onFavoriteToggle,
  onPlay,
}: VideoCardProps) {
  const [favorite, setFavorite] = useState(isFavorite);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorite(!favorite);
    if (onFavoriteToggle) onFavoriteToggle(id);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
      {/* Thumbnail */}
      <div
        className="relative aspect-video bg-slate-200 cursor-pointer group"
        onClick={() => onPlay ? onPlay(id) : window.open(url, '_blank')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') onPlay ? onPlay(id) : window.open(url, '_blank'); }}
      >
        <Image src={thumbnail} alt={title} fill className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            <svg className="w-6 h-6 text-slate-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        {duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-lg">
            {duration}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-slate-800 line-clamp-2 mb-2 min-h-[3rem]">{title}</h3>
        <p className="text-sm text-slate-500 mb-1">{channelTitle}</p>
        {viewCount && <p className="text-xs text-slate-400">{viewCount}</p>}

        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={() => onPlay ? onPlay(id) : window.open(url, '_blank')}
            className="text-sm text-teal-600 hover:text-teal-700 font-medium"
          >
            Play Video →
          </button>
          {onFavoriteToggle && (
            <button
              onClick={handleFavoriteClick}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg
                className={`w-5 h-5 ${favorite ? 'fill-red-500' : 'fill-none stroke-slate-400'}`}
                viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
