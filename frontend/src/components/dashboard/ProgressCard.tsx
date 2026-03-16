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
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4">Your Progress</h2>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-slate-600">Completion</span>
          <span className="text-sm font-bold text-teal-600">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-teal-500 to-emerald-500 h-3 rounded-full transition-all duration-700"
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
              className={`flex items-center justify-between p-3 rounded-xl transition-all ${
                isCompleted
                  ? 'bg-emerald-50 border border-emerald-200'
                  : 'bg-slate-50 border border-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{stage.icon}</span>
                <div>
                  <p className={`font-medium text-sm ${isCompleted ? 'text-emerald-700' : 'text-slate-600'}`}>
                    {stage.label}
                  </p>
                  <p className="text-xs text-slate-400">+{stage.points} points</p>
                </div>
              </div>
              {isCompleted && (
                <svg className="w-6 h-6 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          );
        })}
      </div>

      {/* Points and Badges */}
      <div className="border-t border-slate-200 pt-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-base font-semibold text-slate-700">Total Points</span>
          <span className="text-2xl font-black text-teal-600">{progress.points}</span>
        </div>
        {progress.badges.length > 0 && (
          <div>
            <p className="text-sm font-medium text-slate-600 mb-2">Earned Badges</p>
            <div className="flex flex-wrap gap-2">
              {progress.badges.map((badge, index) => (
                <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 text-xs font-medium rounded-full border border-amber-200">
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
