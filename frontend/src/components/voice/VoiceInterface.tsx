'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import AudioVisualizer from './AudioVisualizer';
import ConversationDisplay from './ConversationDisplay';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function VoiceInterface() {
  const { token } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialize session on mount
  useEffect(() => {
    startSession();
    return () => {
      // Cleanup: stop audio stream
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startSession = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conversation/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.data.sessionId);

        // Add initial greeting
        if (data.data.initialQuestion) {
          setMessages([{
            role: 'assistant',
            content: data.data.initialQuestion,
            timestamp: new Date(),
          }]);
        }
      } else {
        setError('Failed to start conversation session');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Session start error:', err);
    }
  };

  const startRecording = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      setError(null);

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTranscript('Listening...');
    } catch (err) {
      setError('Microphone access denied. Please allow microphone permissions.');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setTranscript('Processing...');

      // Stop audio stream
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
      }
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    if (!sessionId) {
      setError('No active session');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Step 1: Speech-to-Text
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const sttResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/voice/stt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!sttResponse.ok) {
        throw new Error('Speech-to-text failed');
      }

      const sttData = await sttResponse.json();
      const userText = sttData.data.transcript;
      setTranscript(userText);

      // Add user message to conversation
      const userMessage: Message = {
        role: 'user',
        content: userText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Step 2: Process message through conversation manager
      const messageResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conversation/message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          message: userText,
        }),
      });

      if (!messageResponse.ok) {
        throw new Error('Failed to process message');
      }

      const messageData = await messageResponse.json();
      const aiResponse = messageData.data.response;

      // Add AI response to conversation
      const aiMessage: Message = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);

      // Step 3: Text-to-Speech
      const ttsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/voice/tts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: aiResponse,
        }),
      });

      if (ttsResponse.ok) {
        const ttsData = await ttsResponse.json();
        // Play audio
        if (ttsData.data.audioUrl) {
          const audio = new Audio(ttsData.data.audioUrl);
          audio.play();
        }
      }

      setTranscript('');
    } catch (err) {
      setError('Failed to process voice input. Please try again.');
      console.error('Audio processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Voice Consultation</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Conversation Display */}
        <div className="mb-6">
          <ConversationDisplay messages={messages} />
        </div>

        {/* Recording Controls */}
        <div className="flex flex-col items-center space-y-4">
          {/* Audio Visualizer */}
          {isRecording && audioStream && (
            <AudioVisualizer stream={audioStream} />
          )}

          {/* Recording Status */}
          {transcript && (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                {isRecording ? 'Listening...' : isProcessing ? 'Processing...' : 'Transcript:'}
              </p>
              <p className="text-lg font-medium">{transcript}</p>
            </div>
          )}

          {/* Record Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing || !sessionId}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
          >
            {isRecording ? '⏹️' : '🎤'}
          </button>

          <p className="text-sm text-gray-600">
            {isRecording ? 'Click to stop recording' : 'Click to start recording'}
          </p>
        </div>
      </div>
    </div>
  );
}
