'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VoiceWaveAnimation from './VoiceWaveAnimation';

interface AudioTrack {
  id: string;
  url: string;
  title: string;
  type: 'description' | 'response';
}

interface GlobalAudioControllerProps {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
  progress: number;
  duration: number;
  className?: string;
}

export default function GlobalAudioController({
  currentTrack,
  isPlaying,
  onPlay,
  onPause,
  onStop,
  onToggleMute,
  isMuted,
  progress,
  duration,
  className = ''
}: GlobalAudioControllerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Show controller when there's a track
  useEffect(() => {
    if (currentTrack) {
      setIsVisible(true);
      setIsMinimized(false);
      
      // Clear any existing timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      
      // Auto-minimize after 5 seconds of inactivity
      if (isPlaying) {
        hideTimeoutRef.current = setTimeout(() => {
          setIsMinimized(true);
        }, 5000);
      }
    } else {
      setIsVisible(false);
      setIsMinimized(false);
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [currentTrack, isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;

  if (!currentTrack) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: isMinimized ? 0.85 : 1,
            height: isMinimized ? 60 : 'auto'
          }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            duration: 0.4
          }}
          className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 ${className}`}
          onMouseEnter={() => {
            setIsMinimized(false);
            if (hideTimeoutRef.current) {
              clearTimeout(hideTimeoutRef.current);
            }
          }}
          onMouseLeave={() => {
            if (isPlaying) {
              hideTimeoutRef.current = setTimeout(() => {
                setIsMinimized(true);
              }, 3000);
            }
          }}
        >
          <div className="bg-slate-900/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl overflow-hidden max-w-sm w-full">
            {/* Progress Bar */}
            <div className="h-1 bg-gray-700 relative">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>

            <div className="p-4">
              {/* Track Info */}
              <AnimatePresence>
                {!isMinimized && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`p-2 rounded-lg ${
                        currentTrack.type === 'description' 
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-500' 
                          : 'bg-gradient-to-br from-purple-500 to-pink-500'
                      }`}>
                        <Volume2 className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {currentTrack.title}
                        </p>
                        <p className="text-xs text-gray-400 capitalize">
                          {currentTrack.type === 'description' ? 'Artwork Description' : 'AI Response'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Play/Pause Button */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={isPlaying ? onPause : onPlay}
                      size="sm"
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-full w-10 h-10 p-0 shadow-lg"
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4 fill-current" />
                      ) : (
                        <Play className="h-4 w-4 fill-current ml-0.5" />
                      )}
                    </Button>
                  </motion.div>

                  {/* Stop Button */}
                  <Button
                    onClick={onStop}
                    variant="ghost"
                    size="sm"
                    className="text-white/80 hover:text-white hover:bg-white/10 rounded-full w-8 h-8 p-0"
                  >
                    <Square className="h-3 w-3 fill-current" />
                  </Button>

                  {/* Mute Button */}
                  <Button
                    onClick={onToggleMute}
                    variant="ghost"
                    size="sm"
                    className="text-white/80 hover:text-white hover:bg-white/10 rounded-full w-8 h-8 p-0"
                  >
                    {isMuted ? (
                      <VolumeX className="h-3 w-3" />
                    ) : (
                      <Volume2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>

                {/* Wave Animation & Time */}
                <div className="flex items-center space-x-3">
                  {isPlaying && (
                    <VoiceWaveAnimation 
                      isListening={true} 
                      isProcessing={false}
                      className="h-6"
                    />
                  )}
                  
                  {!isMinimized && (
                    <div className="text-xs text-gray-400 font-mono">
                      {formatTime(progress)} / {formatTime(duration)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}