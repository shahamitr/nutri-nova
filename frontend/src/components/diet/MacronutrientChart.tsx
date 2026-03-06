'use client';

interface MacronutrientChartProps {
  protein: number;
  carbs: number;
  fats: number;
}

export default function MacronutrientChart({ protein, carbs, fats }: MacronutrientChartProps) {
  const total = protein + carbs + fats;
  const proteinPercent = (protein / total) * 100;
  const carbsPercent = (carbs / total) * 100;
  const fatsPercent = (fats / total) * 100;

  return (
    <div className="space-y-4">
      {/* Bar Chart Visualization */}
      <div className="flex h-12 rounded-lg overflow-hidden shadow-sm">
        <div
          className="bg-blue-500 flex items-center justify-center text-white text-sm font-medium transition-all"
          style={{ width: `${proteinPercent}%` }}
          title={`Protein: ${protein}%`}
        >
          {protein}%
        </div>
        <div
          className="bg-green-500 flex items-center justify-center text-white text-sm font-medium transition-all"
          style={{ width: `${carbsPercent}%` }}
          title={`Carbs: ${carbs}%`}
        >
          {carbs}%
        </div>
        <div
          className="bg-yellow-500 flex items-center justify-center text-white text-sm font-medium transition-all"
          style={{ width: `${fatsPercent}%` }}
          title={`Fats: ${fats}%`}
        >
          {fats}%
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-4">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <div>
            <div className="text-sm font-medium text-gray-700">Protein</div>
            <div className="text-lg font-bold text-blue-600">{protein}%</div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <div>
            <div className="text-sm font-medium text-gray-700">Carbs</div>
            <div className="text-lg font-bold text-green-600">{carbs}%</div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <div>
            <div className="text-sm font-medium text-gray-700">Fats</div>
            <div className="text-lg font-bold text-yellow-600">{fats}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
