'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

interface VoiceSettings {
  accent: 'US_ENGLISH' | 'UK_ENGLISH' | 'AUSTRALIAN_ENGLISH' | 'INDIAN_ENGLISH';
  voice_gender: 'MALE' | 'FEMALE';
  speech_speed: number;
}

export default function VoiceSettingsForm() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<VoiceSettings>({
    accent: 'US_ENGLISH',
    voice_gender: 'MALE',
    speech_speed: 1.0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/voice/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setSettings(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch voice settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/voice/save-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Voice settings saved successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save voice settings. Please try again.' });
      }
    } catch (error) {
      console.error('Failed to save voice settings:', error);
      setMessage({ type: 'error', text: 'An error occurred while saving settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const previewText = 'Hello! This is a preview of your voice settings. Your personalized diet plan is ready.';
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/voice/generate-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: previewText }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data.audioUrl) {
          const audio = new Audio(data.data.audioUrl);
          await audio.play();
        }
      }
    } catch (error) {
      console.error('Failed to preview voice:', error);
    } finally {
      setPreviewing(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading settings...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Accent Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Accent
        </label>
        <select
          value={settings.accent}
          onChange={(e) => setSettings({ ...settings, accent: e.target.value as VoiceSettings['accent'] })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="US_ENGLISH">US English</option>
          <option value="UK_ENGLISH">UK English</option>
          <option value="AUSTRALIAN_ENGLISH">Australian English</option>
          <option value="INDIAN_ENGLISH">Indian English</option>
        </select>
      </div>

      {/* Voice Gender */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Voice Gender
        </label>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              value="MALE"
              checked={settings.voice_gender === 'MALE'}
              onChange={(e) => setSettings({ ...settings, voice_gender: e.target.value as VoiceSettings['voice_gender'] })}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">Male</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              value="FEMALE"
              checked={settings.voice_gender === 'FEMALE'}
              onChange={(e) => setSettings({ ...settings, voice_gender: e.target.value as VoiceSettings['voice_gender'] })}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700">Female</span>
          </label>
        </div>
      </div>

      {/* Speech Speed */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Speech Speed: {settings.speech_speed.toFixed(2)}x
        </label>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={settings.speech_speed}
          onChange={(e) => setSettings({ ...settings, speech_speed: parseFloat(e.target.value) })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0.5x (Slower)</span>
          <span>1.0x (Normal)</span>
          <span>2.0x (Faster)</span>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Buttons */}
      <div className="flex space-x-4">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        <button
          type="button"
          onClick={handlePreview}
          disabled={previewing}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {previewing ? '🔊 Playing...' : '🔊 Preview Voice'}
        </button>
      </div>
    </form>
  );
}
