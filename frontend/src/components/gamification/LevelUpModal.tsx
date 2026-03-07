'use client';

import { useEffect, useState } from 'react';

interface LevelUpModalProps {
  show: boolean;
  newLevel: number;
  onClose: () => void;
}

export default function LevelUpModal({ show, newLevel, onClose }: LevelUpModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
    }
  }, [show]);

  if (!show) return null;

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div
        className={`relative bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl p-8 max-w-md w-full mx-4 text-white shadow-2xl transform transition-all duration-300 ${
          isVisible ? 'scale-100' : 'scale-95'
        }`}
      >
        {/* Confetti Effect */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              {['🎉', '⭐', '✨', '🎊'][Math.floor(Math.random() * 4)]}
            </div>
          ))}
        </div>

        <div className="relative text-center">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h2 className="text-3xl font-bold mb-2">Level Up!</h2>
          <div className="text-6xl font-bold mb-4">{newLevel}</div>
          <p className="text-lg mb-6 opacity-90">
            Congratulations! You've reached level {newLevel}!
          </p>
          <p className="text-sm mb-6 opacity-75">
            Keep up the great work on your health journey!
          </p>
          <button
            onClick={handleClose}
            className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Awesome!
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(500px) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear infinite;
        }
      `}</style>
    </div>
  );
}
