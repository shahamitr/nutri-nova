'use client';

import VoiceInterface from '@/components/voice/VoiceInterface';

export default function DietPlanningPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Start Diet Planning</h1>
      <p className="text-gray-600 mb-6">
        Have a conversation with our AI nutritionist to create your personalized diet plan.
        Use the microphone button to speak, or type your responses.
      </p>
      <VoiceInterface />
    </div>
  );
}
