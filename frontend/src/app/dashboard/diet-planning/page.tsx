'use client';

import VoiceInterface from '@/components/voice/VoiceInterface';
import PageHeader from '@/components/dashboard/PageHeader';
import { PageTransition, FadeIn } from '@/components/motion/MotionWrappers';

export default function DietPlanningPage() {
  return (
    <PageTransition>
      <div className="space-y-6">
        <PageHeader
          title="Start Diet Planning"
          description="Have a conversation with Dr. Nova to create your personalized diet plan."
          icon="🎯"
        />
        <FadeIn delay={0.1}>
          <VoiceInterface />
        </FadeIn>
      </div>
    </PageTransition>
  );
}
