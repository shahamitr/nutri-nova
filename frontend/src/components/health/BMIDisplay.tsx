'use client';

interface BMIData {
  bmi_value: number;
  category: 'UNDERWEIGHT' | 'NORMAL' | 'OVERWEIGHT' | 'OBESE';
  calculated_at: string;
}

interface BMIDisplayProps {
  bmiData: BMIData | null;
}

export default function BMIDisplay({ bmiData }: BMIDisplayProps) {
  if (!bmiData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">BMI Information</h2>
        <p className="text-gray-600">No BMI data available. Calculate your BMI to see results.</p>
      </div>
    );
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'UNDERWEIGHT':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'NORMAL':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'OVERWEIGHT':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'OBESE':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getHealthInterpretation = (category: string) => {
    switch (category) {
      case 'UNDERWEIGHT':
        return 'Your BMI indicates you are underweight. Consider consulting with a healthcare provider about healthy weight gain strategies.';
      case 'NORMAL':
        return 'Your BMI is in the healthy range. Maintain your current lifestyle with balanced nutrition and regular exercise.';
      case 'OVERWEIGHT':
        return 'Your BMI indicates you are overweight. Consider adopting a balanced diet and increasing physical activity.';
      case 'OBESE':
        return 'Your BMI indicates obesity. We recommend consulting with a healthcare provider for personalized guidance.';
      default:
        return '';
    }
  };

  const getBMIGaugePosition = (bmi: number) => {
    // Map BMI to percentage (15-40 range mapped to 0-100%)
    const minBMI = 15;
    const maxBMI = 40;
    const percentage = ((bmi - minBMI) / (maxBMI - minBMI)) * 100;
    return Math.max(0, Math.min(100, percentage));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">BMI Information</h2>

      {/* BMI Value */}
      <div className="text-center mb-6">
        <p className="text-gray-600 mb-2">Your BMI</p>
        <p className="text-5xl font-bold text-blue-600">{bmiData.bmi_value.toFixed(1)}</p>
      </div>

      {/* BMI Category */}
      <div className={`p-4 rounded-lg border-2 mb-6 ${getCategoryColor(bmiData.category)}`}>
        <p className="text-center font-semibold text-lg">
          {bmiData.category.charAt(0) + bmiData.category.slice(1).toLowerCase()}
        </p>
      </div>

      {/* BMI Gauge */}
      <div className="mb-6">
        <div className="relative h-8 bg-gradient-to-r from-yellow-400 via-green-400 via-orange-400 to-red-400 rounded-full">
          <div
            className="absolute top-0 w-1 h-full bg-gray-800"
            style={{ left: `${getBMIGaugePosition(bmiData.bmi_value)}%` }}
          >
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-transparent border-t-gray-800" />
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-2">
          <span>15</span>
          <span>18.5</span>
          <span>25</span>
          <span>30</span>
          <span>40</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Underweight</span>
          <span>Normal</span>
          <span>Overweight</span>
          <span>Obese</span>
        </div>
      </div>

      {/* Health Interpretation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-900">
          {getHealthInterpretation(bmiData.category)}
        </p>
      </div>

      {/* Calculation Date */}
      <p className="text-sm text-gray-500 text-center">
        Calculated on {formatDate(bmiData.calculated_at)}
      </p>
    </div>
  );
}
