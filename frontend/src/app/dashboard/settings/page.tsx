'use client';

import { useAuth } from '@/lib/auth-context';
import VoiceSettingsForm from '@/components/settings/VoiceSettingsForm';
import PageHeader from '@/components/dashboard/PageHeader';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '@/components/motion/MotionWrappers';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Settings"
          description="Manage your account and preferences"
          icon="⚙️"
        />

      {/* Account Information */}
      <FadeIn delay={0.1}>
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Account Information</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-semibold text-slate-800">{user?.name || 'Not available'}</p>
              <p className="text-sm text-slate-500">{user?.email || 'Not available'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Member Since</p>
              <p className="text-base font-semibold text-slate-800 mt-1">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Account Status</p>
              <p className="text-base font-semibold text-emerald-600 mt-1">Active</p>
            </div>
          </div>
        </div>
      </div>
      </FadeIn>

      {/* Voice Settings */}
      <FadeIn delay={0.2}>
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Voice Preferences</h2>
        <VoiceSettingsForm />
      </div>
      </FadeIn>
    </div>
    </PageTransition>
  );
}
