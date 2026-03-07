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
}: VideoCardProps) {
  const [favorite, setFavorite] = useState(isFavorite);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorite(!favorite);
    if (onFavoriteToggle) {
      onFavoriteToggle(id);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gray-200">
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {duration && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
              {duration}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Title */}
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 min-h-[3rem]">
            {title}
          </h3>

          {/* Channel */}
          <p className="text-sm text-gray-600 mb-1">{channelTitle}</p>

          {/* Views */}
          {viewCount && (
            <p className="text-xs text-gray-500">{viewCount}</p>
          )}

          {/* Favorite Button */}
          <div className="mt-3 flex items-center justify-between">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Watch on YouTube →
            </a>

            {onFavoriteToggle && (
              <button
                onClick={handleFavoriteClick}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <svg
                  className={`w-5 h-5 ${favorite ? 'fill-red-500' : 'fill-none stroke-gray-400'}`}
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </a>
    </div>
  );
}
