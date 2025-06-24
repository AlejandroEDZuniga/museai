'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, Volume2, VolumeX, GripVertical } from 'lucide-react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import VoiceWaveAnimation from './VoiceWaveAnimation';

interface AudioTrack {
  id: string;
  url: string;
  title: string;
  type: 'description' | 'response';
}

interface DraggableAudioControllerProps {
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

export default function DraggableAudioController({
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
}: DraggableAudioControllerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState({ x: 0, y: 0 });
  
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dragControls = useDragControls();
  const constraintsRef = useRef<HTMLDivElement>(null);

  // Calculate initial position (bottom center)
  useEffect(() => {
    const updateInitialPosition = () => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const controllerWidth = 320; // Approximate width
      const controllerHeight = 120; // Approximate height
      
      const initialX = (windowWidth - controllerWidth) / 2;
      const initialY = windowHeight - controllerHeight - 24; // 24px from bottom
      
      setInitialPosition({ x: initialX, y: initialY });
      
      // Only set position if not dragged yet
      if (position.x === 0 && position.y === 0) {
        setPosition({ x: initialX, y: initialY });
      }
    };

    updateInitialPosition();
    window.addEventListener('resize', updateInitialPosition);
    
    return () => {
      window.removeEventListener('resize', updateInitialPosition);
    };
  }, [position.x, position.y]);

  // Show controller when there's a track
  useEffect(() => {
    if (currentTrack) {
      setIsVisible(true);
      setIsMinimized(false);
      
      // Clear any existing timeout
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      
      // Auto-minimize after 5 seconds of inactivity (only if not dragging)
      if (isPlaying && !isDragging) {
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
  }, [currentTrack, isPlaying, isDragging]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;

  const handleDragStart = useCallback(() => {
    setIsDragging(true);
    setIsMinimized(false);
    
    // Clear auto-hide timeout when dragging
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  }, []);

  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    setIsDragging(false);
    
    // Update position based on drag
    const newX = Math.max(0, Math.min(window.innerWidth - 320, position.x + info.offset.x));
    const newY = Math.max(0, Math.min(window.innerHeight - 120, position.y + info.offset.y));
    
    setPosition({ x: newX, y: newY });
    
    // Restart auto-hide timer if playing
    if (isPlaying) {
      hideTimeoutRef.current = setTimeout(() => {
        setIsMinimized(true);
      }, 3000);
    }
  }, [position.x, position.y, isPlaying]);

  const handleMouseEnter = useCallback(() => {
    if (!isDragging) {
      setIsMinimized(false);
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    }
  }, [isDragging]);

  const handleMouseLeave = useCallback(() => {
    if (isPlaying && !isDragging) {
      hideTimeoutRef.current = setTimeout(() => {
        setIsMinimized(true);
      }, 3000);
    }
  }, [isPlaying, isDragging]);

  // Prevent drag on control buttons
  const preventDrag = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
  }, []);

  if (!currentTrack) return null;

  return (
    <>
      {/* Drag constraints container */}
      <div 
        ref={constraintsRef} 
        className="fixed inset-0 pointer-events-none z-30"
        style={{ 
          width: '100vw', 
          height: '100vh',
          top: 0,
          left: 0
        }} 
      />

      <AnimatePresence>
        {isVisible && (
          <motion.div
            drag
            dragControls={dragControls}
            dragConstraints={constraintsRef}
            dragElastic={0.1}
            dragMomentum={false}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            initial={{ 
              opacity: 0, 
              scale: 0.8,
              x: initialPosition.x,
              y: initialPosition.y
            }}
            animate={{ 
              opacity: 1, 
              scale: isDragging ? 1.05 : (isMinimized ? 0.9 : 1),
              x: position.x,
              y: position.y,
              height: isMinimized ? 80 : 'auto'
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.8,
              transition: { duration: 0.3 }
            }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.4
            }}
            className={`fixed z-40 cursor-move select-none ${className}`}
            style={{
              width: '320px',
              maxWidth: '90vw',
              touchAction: 'none'
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            whileHover={{ 
              scale: isDragging ? 1.05 : 1.02,
              transition: { duration: 0.2 }
            }}
          >
            <div className={`bg-slate-900/95 backdrop-blur-md border-2 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
              isDragging 
                ? 'border-emerald-400/60 shadow-emerald-500/25' 
                : 'border-white/20 hover:border-white/30'
            }`}>
              
              {/* Drag Handle */}
              <div 
                className="flex items-center justify-center py-2 bg-white/5 border-b border-white/10 cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                  <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                  <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                </div>
                <GripVertical className="h-4 w-4 text-white/40 mx-2" />
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                  <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                  <div className="w-1 h-1 bg-white/40 rounded-full"></div>
                </div>
              </div>

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
                        onPointerDown={preventDrag}
                        size="sm"
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-full w-10 h-10 p-0 shadow-lg cursor-pointer"
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
                      onPointerDown={preventDrag}
                      variant="ghost"
                      size="sm"
                      className="text-white/80 hover:text-white hover:bg-white/10 rounded-full w-8 h-8 p-0 cursor-pointer"
                    >
                      <Square className="h-3 w-3 fill-current" />
                    </Button>

                    {/* Mute Button */}
                    <Button
                      onClick={onToggleMute}
                      onPointerDown={preventDrag}
                      variant="ghost"
                      size="sm"
                      className="text-white/80 hover:text-white hover:bg-white/10 rounded-full w-8 h-8 p-0 cursor-pointer"
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

                {/* Drag Indicator */}
                {isDragging && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full"
                  >
                    Dragging...
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}