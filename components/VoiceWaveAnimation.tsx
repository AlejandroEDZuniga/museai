'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface VoiceWaveAnimationProps {
  isListening: boolean;
  isProcessing: boolean;
  className?: string;
}

export default function VoiceWaveAnimation({ isListening, isProcessing, className = '' }: VoiceWaveAnimationProps) {
  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    if (isListening) {
      // Simulate audio level changes for visual effect
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 100);
      
      return () => clearInterval(interval);
    } else {
      setAudioLevel(0);
    }
  }, [isListening]);

  const waveVariants = {
    listening: {
      scaleY: [0.5, 1.5, 0.8, 1.2, 0.6, 1.8, 0.9],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    processing: {
      scaleY: [1, 1.2, 1, 1.1, 1],
      opacity: [0.7, 1, 0.7, 1, 0.7],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    idle: {
      scaleY: 1,
      opacity: 0.3,
      transition: {
        duration: 0.3
      }
    }
  };

  const getAnimationState = () => {
    if (isProcessing) return 'processing';
    if (isListening) return 'listening';
    return 'idle';
  };

  return (
    <div className={`flex items-center justify-center space-x-1 ${className}`}>
      {/* Central wave bars */}
      {Array.from({ length: 5 }).map((_, i) => (
        <motion.div
          key={i}
          className={`w-1 rounded-full ${
            isListening 
              ? 'bg-gradient-to-t from-sky-400 to-blue-500' 
              : isProcessing 
                ? 'bg-gradient-to-t from-purple-400 to-pink-500'
                : 'bg-gray-300'
          }`}
          style={{
            height: isListening ? `${20 + (audioLevel * 0.3)}px` : '20px',
          }}
          variants={waveVariants}
          animate={getAnimationState()}
          custom={i}
        />
      ))}
      
      {/* Outer wave bars */}
      {Array.from({ length: 2 }).map((_, i) => (
        <motion.div
          key={`outer-${i}`}
          className={`w-0.5 rounded-full ${
            isListening 
              ? 'bg-gradient-to-t from-sky-300 to-blue-400' 
              : isProcessing 
                ? 'bg-gradient-to-t from-purple-300 to-pink-400'
                : 'bg-gray-200'
          }`}
          style={{
            height: isListening ? `${15 + (audioLevel * 0.2)}px` : '15px',
          }}
          variants={waveVariants}
          animate={getAnimationState()}
          custom={i + 5}
        />
      ))}
    </div>
  );
}