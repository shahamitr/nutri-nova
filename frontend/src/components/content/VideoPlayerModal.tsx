'use client';

import React, { useEffect, useCallback } from 'react';

interface VideoPlayerModalProps {
  videoId: string;
  title: string;
  onClose: () => void;
}

export default function VideoPlayerModal({ videoId, title, onClose }: VideoPlayerModalProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Playing: ${title}`}
    >
      <div
        className="relative w-full max-w-4xl mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 text-sm flex items-center gap-1"
          aria-label="Close video player"
          data-testid="video-player-close"
        >
          Close (Esc) ✕
        </button>

        {/* Title */}
        <p className="text-white text-sm mb-2 truncate">{title}</p>

        {/* YouTube Embed */}
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full rounded-lg"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
