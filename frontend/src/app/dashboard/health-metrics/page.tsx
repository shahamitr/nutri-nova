'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import HealthProfileForm from '@/components/health/HealthProfileForm';
import BMIDisplay from '@/components/health/BMIDisplay';
import PageHeader from '@/components/dashboard/PageHeader';
import { PageTransition, FadeIn } from '@/components/motion/MotionWrappers';

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

  useEffect(() => { fetchBMIData(); }, []);

  const fetchBMIData = async () => {
    try {
      const historyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/health/bmi/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setBmiHistory(historyData.data || []);
        if (historyData.data && historyData.data.length > 0) setCurrentBMI(historyData.data[0]);
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/health/bmi`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (response.ok) await fetchBMIData();
      else alert('Failed to calculate BMI. Please ensure your health profile is complete.');
    } catch (error) {
      console.error('Failed to calculate BMI:', error);
      alert('Failed to calculate BMI. Please try again.');
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-slate-500 font-medium">Loading health data...</p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
    <div className="space-y-8">
      <PageHeader
        title="Health Metrics"
        description="Track your BMI and manage your health profile"
        icon="📊"
      />

      <FadeIn delay={0.1}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Profile Form */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <HealthProfileForm onSaveSuccess={fetchBMIData} />
        </div>

        {/* BMI Display */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
            <BMIDisplay bmiData={currentBMI} />
            <button
              onClick={calculateBMI}
              disabled={calculating}
              className="w-full mt-4 px-6 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg shadow-teal-500/20"
            >
              {calculating ? 'Calculating...' : 'Calculate BMI'}
            </button>
          </div>
        </div>
      </div>
      </FadeIn>

      {/* BMI History */}
      {bmiHistory.length > 1 && (
        <FadeIn delay={0.2}>
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">BMI History</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">BMI</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Category</th>
                </tr>
              </thead>
              <tbody>
                {bmiHistory.map((record, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-slate-700">
                      {new Date(record.calculated_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-sm font-semibold text-slate-800">{record.bmi_value.toFixed(1)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        record.category === 'NORMAL' ? 'bg-emerald-100 text-emerald-800' :
                        record.category === 'UNDERWEIGHT' ? 'bg-amber-100 text-amber-800' :
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
        </FadeIn>
      )}
    </div>
    </PageTransition>
  );
}
