'use client';

interface ProgressCardProps {
  progress: {
    profile_completed: boolean;
    bmi_calculated: boolean;
    routine_completed: boolean;
    diet_generated: boolean;
    points: number;
    badges: string[];
  };
  completionPercentage: number;
}

export default function ProgressCard({ progress, completionPercentage }: ProgressCardProps) {
  const stages = [
    { key: 'profile_completed', label: 'Health Profile Created', icon: '📋', points: 20 },
    { key: 'bmi_calculated', label: 'Health Baseline Ready', icon: '⚖️', points: 30 },
    { key: 'routine_completed', label: 'Routine Established', icon: '🏃', points: 30 },
    { key: 'diet_generated', label: 'Personalized Diet Ready', icon: '🍽️', points: 50 },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Your Progress</h2>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">Completion</span>
          <span className="text-sm font-medium">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-blue-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Stages */}
      <div className="space-y-3 mb-6">
        {stages.map((stage) => {
          const isCompleted = progress[stage.key as keyof typeof progress] as boolean;
          return (
            <div
              key={stage.key}
              className={`flex items-center justify-between p-3 rounded-lg ${
                isCompleted ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{stage.icon}</span>
                <div>
                  <p className={`font-medium ${isCompleted ? 'text-green-700' : 'text-gray-600'}`}>
                    {stage.label}
                  </p>
                  <p className="text-xs text-gray-500">+{stage.points} points</p>
                </div>
              </div>
              {isCompleted && (
                <span className="text-green-600 text-xl">✓</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Points and Badges */}
      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold">Total Points</span>
          <span className="text-2xl font-bold text-blue-600">{progress.points}</span>
        </div>

        {progress.badges.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Earned Badges</p>
            <div className="flex flex-wrap gap-2">
              {progress.badges.map((badge, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full"
                >
                  🏆 {badge}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
