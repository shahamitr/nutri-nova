'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

interface HealthProfile {
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  height_cm: number;
  weight_kg: number;
  diet_preference: 'VEGETARIAN' | 'EGGETARIAN' | 'NON_VEGETARIAN';
  activity_level?: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';
  sleep_hours?: number;
  stress_level?: 'LOW' | 'MODERATE' | 'HIGH';
  medical_conditions?: string;
}

interface HealthProfileFormProps {
  onSaveSuccess?: () => void;
}

export default function HealthProfileForm({ onSaveSuccess }: HealthProfileFormProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [profile, setProfile] = useState<HealthProfile>({
    age: 25,
    gender: 'MALE',
    height_cm: 170,
    weight_kg: 70,
    diet_preference: 'NON_VEGETARIAN',
    activity_level: 'MODERATE',
    sleep_hours: 7,
    stress_level: 'MODERATE',
    medical_conditions: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof HealthProfile, string>>>({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/health/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setProfile(data.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof HealthProfile, string>> = {};

    if (profile.age < 1 || profile.age > 120) {
      newErrors.age = 'Age must be between 1 and 120';
    }
    if (profile.height_cm < 50 || profile.height_cm > 250) {
      newErrors.height_cm = 'Height must be between 50 and 250 cm';
    }
    if (profile.weight_kg < 20 || profile.weight_kg > 300) {
      newErrors.weight_kg = 'Weight must be between 20 and 300 kg';
    }
    if (profile.sleep_hours && (profile.sleep_hours < 0 || profile.sleep_hours > 24)) {
      newErrors.sleep_hours = 'Sleep hours must be between 0 and 24';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/health/save-profile`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        setSuccess(true);
        if (onSaveSuccess) {
          onSaveSuccess();
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save profile');
      }
    } catch (err) {
      setError('Failed to save profile. Please try again.');
      console.error('Save profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof HealthProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Health Profile</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          Profile saved successfully!
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Age */}
        <div>
          <label className="block text-sm font-medium mb-2">Age *</label>
          <input
            type="number"
            value={profile.age}
            onChange={(e) => handleChange('age', parseInt(e.target.value))}
            className={`w-full p-2 border rounded-lg ${errors.age ? 'border-red-500' : 'border-gray-300'}`}
            required
          />
          {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium mb-2">Gender *</label>
          <select
            value={profile.gender}
            onChange={(e) => handleChange('gender', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Height */}
        <div>
          <label className="block text-sm font-medium mb-2">Height (cm) *</label>
          <input
            type="number"
            value={profile.height_cm}
            onChange={(e) => handleChange('height_cm', parseFloat(e.target.value))}
            className={`w-full p-2 border rounded-lg ${errors.height_cm ? 'border-red-500' : 'border-gray-300'}`}
            required
          />
          {errors.height_cm && <p className="text-red-500 text-sm mt-1">{errors.height_cm}</p>}
        </div>

        {/* Weight */}
        <div>
          <label className="block text-sm font-medium mb-2">Weight (kg) *</label>
          <input
            type="number"
            step="0.1"
            value={profile.weight_kg}
            onChange={(e) => handleChange('weight_kg', parseFloat(e.target.value))}
            className={`w-full p-2 border rounded-lg ${errors.weight_kg ? 'border-red-500' : 'border-gray-300'}`}
            required
          />
          {errors.weight_kg && <p className="text-red-500 text-sm mt-1">{errors.weight_kg}</p>}
        </div>

        {/* Diet Preference */}
        <div>
          <label className="block text-sm font-medium mb-2">Diet Preference *</label>
          <select
            value={profile.diet_preference}
            onChange={(e) => handleChange('diet_preference', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg"
            required
          >
            <option value="VEGETARIAN">Vegetarian</option>
            <option value="EGGETARIAN">Eggetarian</option>
            <option value="NON_VEGETARIAN">Non-Vegetarian</option>
          </select>
        </div>

        {/* Activity Level */}
        <div>
          <label className="block text-sm font-medium mb-2">Activity Level</label>
          <select
            value={profile.activity_level || ''}
            onChange={(e) => handleChange('activity_level', e.target.value || undefined)}
            className="w-full p-2 border border-gray-300 rounded-lg"
          >
            <option value="">Select activity level</option>
            <option value="SEDENTARY">Sedentary (little or no exercise)</option>
            <option value="LIGHT">Light (exercise 1-3 days/week)</option>
            <option value="MODERATE">Moderate (exercise 3-5 days/week)</option>
            <option value="ACTIVE">Active (exercise 6-7 days/week)</option>
            <option value="VERY_ACTIVE">Very Active (intense exercise daily)</option>
          </select>
        </div>

        {/* Sleep Hours */}
        <div>
          <label className="block text-sm font-medium mb-2">Sleep Hours (per day)</label>
          <input
            type="number"
            step="0.5"
            value={profile.sleep_hours || ''}
            onChange={(e) => handleChange('sleep_hours', e.target.value ? parseFloat(e.target.value) : undefined)}
            className={`w-full p-2 border rounded-lg ${errors.sleep_hours ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="e.g., 7.5"
          />
          {errors.sleep_hours && <p className="text-red-500 text-sm mt-1">{errors.sleep_hours}</p>}
        </div>

        {/* Stress Level */}
        <div>
          <label className="block text-sm font-medium mb-2">Stress Level</label>
          <select
            value={profile.stress_level || ''}
            onChange={(e) => handleChange('stress_level', e.target.value || undefined)}
            className="w-full p-2 border border-gray-300 rounded-lg"
          >
            <option value="">Select stress level</option>
            <option value="LOW">Low</option>
            <option value="MODERATE">Moderate</option>
            <option value="HIGH">High</option>
          </select>
        </div>
      </div>

      {/* Medical Conditions */}
      <div className="mt-6">
        <label className="block text-sm font-medium mb-2">Medical Conditions (optional)</label>
        <textarea
          value={profile.medical_conditions || ''}
          onChange={(e) => handleChange('medical_conditions', e.target.value || undefined)}
          className="w-full p-2 border border-gray-300 rounded-lg"
          rows={3}
          placeholder="List any medical conditions, allergies, or dietary restrictions..."
        />
      </div>

      {/* Submit Button */}
      <div className="mt-6">
        <button
          type="submit"
          disabled={loading}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
}
