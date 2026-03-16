'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import AudioVisualizer from './AudioVisualizer';
import ConversationDisplay from './ConversationDisplay';
import { logActivityWithToast, ACTIVITY_TYPES } from '@/lib/gamification';
import LevelUpModal from '@/components/gamification/LevelUpModal';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

export default function VoiceInterface() {
  const { token, authFetch } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(0);
  const [textInput, setTextInput] = useState('');

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');
  const greetingSpokenRef = useRef(false);


  useEffect(() => {
    startSession();
    return () => { stopRecording(); };
  }, []);

  const startSession = async () => {
    try {
      const response = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conversation/start`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setSessionId(data.data.session_id);
        if (data.data.greeting) {
          setMessages([{ role: 'assistant', content: data.data.greeting, timestamp: new Date() }]);
        }
      } else {
        setError('Failed to start conversation session');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Session start error:', err);
    }
  };

  const sendMessage = useCallback(async (userText: string) => {
    if (!sessionId || !userText.trim()) return;
    setIsProcessing(true);
    setError(null);
    setMessages(prev => [...prev, { role: 'user', content: userText, timestamp: new Date() }]);

    try {
      const messageResponse = await authFetch(`${process.env.NEXT_PUBLIC_API_URL}/api/conversation/message`, {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId, message: userText }),
      });
      if (!messageResponse.ok) throw new Error('Failed to process message');
      const messageData = await messageResponse.json();
      const aiResponse = messageData.data.ai_response;
      const isComplete = messageData.data.conversation_complete;

      if (isComplete && token) {
        const result = await logActivityWithToast(token, ACTIVITY_TYPES.DIET_PLAN_CREATED);
        if (result.level_up && result.new_level) { setNewLevel(result.new_level); setShowLevelUp(true); }
      }

      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse, timestamp: new Date() }]);
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(aiResponse);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      setError('Failed to process message. Please try again.');
      console.error('Message processing error:', err);
    } finally {
      setIsProcessing(false);
      setTranscript('');
    }
  }, [sessionId, authFetch, token]);


  const startRecording = async () => {
    try {
      if (!greetingSpokenRef.current && messages.length > 0 && messages[0].role === 'assistant') {
        greetingSpokenRef.current = true;
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(messages[0].content);
          utterance.rate = 1.0;
          utterance.pitch = 1.0;
          window.speechSynthesis.speak(utterance);
        }
      }
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setError('Speech recognition is not supported in this browser. Please use Chrome or Edge, or type your message below.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      setError(null);

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      finalTranscriptRef.current = '';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) final += result[0].transcript;
          else interim += result[0].transcript;
        }
        if (final) finalTranscriptRef.current += final;
        setTranscript(finalTranscriptRef.current + interim);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') setError('Microphone access denied. Please allow microphone permissions.');
      };

      recognition.onend = () => {
        const text = finalTranscriptRef.current.trim();
        if (text) sendMessage(text);
        else setTranscript('');
        setIsRecording(false);
        if (stream) stream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
      setTranscript('Listening...');
    } catch (err) {
      setError('Microphone access denied. Please allow microphone permissions.');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setTranscript('Processing...');
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim() && !isProcessing) { sendMessage(textInput.trim()); setTextInput(''); }
  };


  return (
    <div className="max-w-4xl mx-auto">
      <LevelUpModal show={showLevelUp} newLevel={newLevel} onClose={() => setShowLevelUp(false)} />

      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-lg">
            🩺
          </div>
          <div>
            <h2 className="text-white font-bold text-lg">Dr. Nova</h2>
            <p className="text-teal-100 text-xs">AI Nutrition Specialist</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${sessionId ? 'bg-emerald-300 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-teal-100 text-xs">{sessionId ? 'Connected' : 'Connecting...'}</span>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Conversation Display */}
        <div className="p-6">
          <ConversationDisplay messages={messages} />
        </div>

        {/* Recording Controls */}
        <div className="border-t border-slate-200/60 bg-slate-50/50 p-6">
          <div className="flex flex-col items-center space-y-4">
            {isRecording && audioStream && <AudioVisualizer stream={audioStream} />}

            {transcript && (
              <div className="text-center px-4 py-3 bg-white rounded-xl border border-slate-200 w-full max-w-lg">
                <p className="text-xs text-slate-500 mb-1">
                  {isRecording ? 'Listening...' : isProcessing ? 'Processing...' : 'You said:'}
                </p>
                <p className="text-base font-medium text-slate-800">{transcript}</p>
              </div>
            )}

            {/* Record Button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing || !sessionId}
              data-testid="voice-record-button"
              className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all duration-200 ${
                isRecording
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/30'
                  : 'bg-gradient-to-br from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 shadow-lg shadow-teal-500/30'
              } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            >
              {isRecording ? '⏹️' : '🎤'}
            </button>
            <p className="text-sm text-slate-500">
              {isRecording ? 'Tap to stop' : 'Tap to speak'}
            </p>

            {/* Text Input Fallback */}
            <form onSubmit={handleTextSubmit} className="w-full max-w-lg flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Or type your message..."
                disabled={isProcessing || !sessionId}
                data-testid="voice-text-input"
                className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent disabled:opacity-50 text-slate-800 placeholder-slate-400 transition-all"
              />
              <button
                type="submit"
                disabled={isProcessing || !sessionId || !textInput.trim()}
                data-testid="voice-text-submit"
                className="px-5 py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl hover:from-teal-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all shadow-sm"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
