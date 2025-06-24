'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Square, X, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceWaveAnimation from './VoiceWaveAnimation';

interface EnhancedVoiceRecorderProps {
  onTranscription: (text: string) => void;
  language: string;
  disabled?: boolean;
}

export default function EnhancedVoiceRecorder({ onTranscription, language, disabled = false }: EnhancedVoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVoiceUI, setShowVoiceUI] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      stopRecording();
    };
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setPermissionDenied(false);
      return true;
    } catch (error: any) {
      console.error('Microphone permission error:', error);
      
      if (error.name === 'NotAllowedError') {
        setPermissionDenied(true);
        toast.error('Microphone access denied. Please enable microphone permissions in your browser settings.');
      } else if (error.name === 'NotFoundError') {
        toast.error('No microphone found. Please connect a microphone and try again.');
      } else {
        toast.error('Unable to access microphone. Please check your device settings.');
      }
      
      return false;
    }
  };

  const startRecording = async () => {
    if (disabled) return;
    
    const hasPermission = await checkMicrophonePermission();
    if (!hasPermission) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        await processAudio(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setShowVoiceUI(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast.success('Recording started - speak now!');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording. Please try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(false);
      setShowVoiceUI(false);
      setRecordingTime(0);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      toast.info('Recording cancelled');
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(',')[1];
        
        // Call OpenAI Whisper API for transcription
        const response = await fetch('/api/transcribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audio: base64Audio,
            language: 'en'
          }),
        });

        if (!response.ok) {
          throw new Error('Transcription failed');
        }

        const result = await response.json();
        
        if (result.text && result.text.trim()) {
          onTranscription(result.text.trim());
          toast.success('Voice message transcribed successfully!');
        } else {
          toast.error('No speech detected. Please try again.');
        }
      };
      
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error('Failed to process voice message. Please try again.');
    } finally {
      setIsProcessing(false);
      setShowVoiceUI(false);
      setRecordingTime(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (permissionDenied) {
    return (
      <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <MicOff className="h-5 w-5 text-red-400 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-red-300">Microphone Access Required</p>
            <p className="text-red-200 mt-1">
              Please enable microphone permissions in your browser settings to use voice input.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Voice Recording UI Overlay */}
      <AnimatePresence>
        {showVoiceUI && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            >
              {/* Voice Wave Animation */}
              <div className="mb-6">
                <VoiceWaveAnimation 
                  isListening={isRecording} 
                  isProcessing={isProcessing}
                  className="h-20"
                />
              </div>
              
              {/* Status Text */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">
                  {isProcessing ? 'Processing...' : 'Listening...'}
                </h3>
                
                {isRecording && (
                  <div className="space-y-2">
                    <p className="text-gray-300">Speak clearly into your microphone</p>
                    <div className="text-2xl font-mono text-emerald-400">
                      {formatTime(recordingTime)}
                    </div>
                  </div>
                )}
                
                {isProcessing && (
                  <p className="text-gray-300">Converting speech to text...</p>
                )}
              </div>
              
              {/* Control Buttons */}
              {isRecording && (
                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={cancelRecording}
                    variant="outline"
                    size="lg"
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full px-6 backdrop-blur-sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  
                  <Button
                    onClick={stopRecording}
                    size="lg"
                    className="bg-red-500 hover:bg-red-600 text-white rounded-full px-6"
                  >
                    <Square className="h-4 w-4 mr-2 fill-current" />
                    Stop
                  </Button>
                </div>
              )}
              
              {isProcessing && (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Input Button */}
      <Button
        type="button"
        variant="outline"
        onClick={startRecording}
        disabled={disabled || isRecording || isProcessing}
        className={`w-full h-12 ${
          isRecording 
            ? 'bg-red-500/20 border-red-400/30 text-red-300 hover:bg-red-500/30' 
            : 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300 hover:bg-emerald-500/30'
        } backdrop-blur-sm transition-all duration-200 disabled:opacity-50`}
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-400 mr-2" />
            Processing...
          </>
        ) : isRecording ? (
          <>
            <div className="w-4 h-4 bg-red-400 rounded-full mr-2 animate-pulse" />
            Listening...
          </>
        ) : (
          <>
            <Mic className="h-4 w-4 mr-2" />
            Tap to speak
          </>
        )}
      </Button>
    </div>
  );
}