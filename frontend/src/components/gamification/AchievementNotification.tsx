'use client';

import { useEffect, useState } from 'react';

interface AchievementNotificationProps {
  show: boolean;
  achievement: {
    name: string;
    description: string;
    icon: string;
    points: number;
  };
  onClose: () => void;
}

export default function AchievementNotification({
  show,
  achievement,
  onClose,
}: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg shadow-2xl p-6 max-w-sm">
        <div className="flex items-start">
          <div className="text-6xl mr-4">{achievement.icon}</div>
          <div className="flex-1">
            <div className="text-sm font-semibold uppercase tracking-wide mb-1">
              🎉 Achievement Unlocked!
            </div>
            <div className="text-xl font-bold mb-1">{achievement.name}</div>
            <div className="text-sm opacity-90 mb-2">{achievement.description}</div>
            <div className="text-sm font-semibold">+{achievement.points} points</div>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            className="text-white hover:text-gray-200 ml-2"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
