'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import HealthProfileForm from '@/components/health/HealthProfileForm';
import BMIDisplay from '@/components/health/BMIDisplay';

interface BMIRecord {
  bmi_value: number;
  category: string;
  calculated_at: string;
}

export default function HealthMetricsPage() {
  const { token } = useAuth();
  const [currentBMI, setCurrentBMI] = useState<BMIRecord | null>(null);
  const [bmiHistory, setBmiHistory] = useState<BMIRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetchBMIData();
  }, []);

  const fetchBMIData = async () => {
    try {
      // Fetch BMI history
      const historyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/health/bmi-history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setBmiHistory(historyData.data || []);

        // Set current BMI as the most recent one
        if (historyData.data && historyData.data.length > 0) {
          setCurrentBMI(historyData.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch BMI data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateBMI = async () => {
    setCalculating(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/health/calculate-bmi`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        await fetchBMIData();
      } else {
        alert('Failed to calculate BMI. Please ensure your health profile is complete.');
      }
    } catch (error) {
      console.error('Failed to calculate BMI:', error);
      alert('Failed to calculate BMI. Please try again.');
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Health Metrics</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Health Profile Form */}
        <div>
          <HealthProfileForm onSaveSuccess={fetchBMIData} />
        </div>

        {/* BMI Display */}
        <div>
          <BMIDisplay bmiData={currentBMI} />

          <button
            onClick={calculateBMI}
            disabled={calculating}
            className="w-full mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium"
          >
            {calculating ? 'Calculating...' : 'Calculate BMI'}
          </button>
        </div>
      </div>

      {/* BMI History Chart */}
      {bmiHistory.length > 1 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">BMI History</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">BMI</th>
                  <th className="text-left py-2">Category</th>
                </tr>
              </thead>
              <tbody>
                {bmiHistory.map((record, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">
                      {new Date(record.calculated_at).toLocaleDateString()}
                    </td>
                    <td className="py-2 font-medium">{record.bmi_value.toFixed(1)}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-sm ${
                        record.category === 'NORMAL' ? 'bg-green-100 text-green-800' :
                        record.category === 'UNDERWEIGHT' ? 'bg-yellow-100 text-yellow-800' :
                        record.category === 'OVERWEIGHT' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {record.category}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
