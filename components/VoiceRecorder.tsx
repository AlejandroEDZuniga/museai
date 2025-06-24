'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Square } from 'lucide-react';
import { toast } from 'sonner';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  language: string;
}

export default function VoiceRecorder({ onTranscription, language }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        await processAudio(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Unable to access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
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
            language: language
          }),
        });

        if (!response.ok) {
          throw new Error('Transcription failed');
        }

        const result = await response.json();
        onTranscription(result.text);
        toast.success('Voice message transcribed!');
      };
      
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Error processing audio:', error);
      toast.error('Failed to process voice message');
    } finally {
      setIsProcessing(false);
    }
  };

  const getRecordingText = () => {
    const texts = {
      en: {
        start: 'Hold to record',
        recording: 'Recording...',
        processing: 'Processing...'
      },
      es: {
        start: 'Mantener para grabar',
        recording: 'Grabando...',
        processing: 'Procesando...'
      },
      fr: {
        start: 'Maintenir pour enregistrer',
        recording: 'Enregistrement...',
        processing: 'Traitement...'
      },
      pt: {
        start: 'Segurar para gravar',
        recording: 'Gravando...',
        processing: 'Processando...'
      },
      zh: {
        start: '按住录音',
        recording: '录音中...',
        processing: '处理中...'
      }
    };
    
    return texts[language as keyof typeof texts] || texts.en;
  };

  const text = getRecordingText();

  return (
    <div className="flex items-center space-x-2">
      <Button
        type="button"
        variant="outline"
        className={`${
          isRecording 
            ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100' 
            : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
        } transition-all duration-200`}
        disabled={isProcessing}
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onMouseLeave={stopRecording}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2" />
            {text.processing}
          </>
        ) : isRecording ? (
          <>
            <Square className="h-4 w-4 mr-2 fill-current" />
            {text.recording}
          </>
        ) : (
          <>
            <Mic className="h-4 w-4 mr-2" />
            {text.start}
          </>
        )}
      </Button>
    </div>
  );
}