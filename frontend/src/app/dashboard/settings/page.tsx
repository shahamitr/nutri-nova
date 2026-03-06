'use client';

import { useAuth } from '@/lib/auth-context';
import VoiceSettingsForm from '@/components/settings/VoiceSettingsForm';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>

      {/* Account Information */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="text-lg font-medium">{user?.name || 'Not available'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="text-lg font-medium">{user?.email || 'Not available'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Member Since</p>
            <p className="text-lg font-medium">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Not available'}
            </p>
          </div>
        </div>
      </div>

      {/* Voice Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Voice Preferences</h2>
        <VoiceSettingsForm />
      </div>
    </div>
  );
}

