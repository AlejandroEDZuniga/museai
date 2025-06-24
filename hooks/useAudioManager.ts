'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface AudioTrack {
  id: string;
  url: string;
  title: string;
  type: 'description' | 'response';
}

interface UseAudioManagerReturn {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  isMuted: boolean;
  progress: number;
  duration: number;
  playAudio: (track: AudioTrack) => Promise<void>;
  pauseAudio: () => void;
  resumeAudio: () => void;
  stopAudio: () => void;
  toggleMute: () => void;
  cleanup: () => void;
}

export function useAudioManager(): UseAudioManagerReturn {
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isStoppedManuallyRef = useRef(false); // Track if user manually stopped

  // Update progress
  const updateProgress = useCallback(() => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  }, []);

  // Start progress tracking
  const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    progressIntervalRef.current = setInterval(updateProgress, 100);
  }, [updateProgress]);

  // Stop progress tracking
  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Play audio
  const playAudio = useCallback(async (track: AudioTrack) => {
    try {
      // Reset manual stop flag when starting new audio
      isStoppedManuallyRef.current = false;
      
      // Stop any existing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        // Remove old event listeners
        audioRef.current.removeEventListener('ended', () => {});
        audioRef.current.removeEventListener('error', () => {});
        audioRef.current.removeEventListener('play', () => {});
        audioRef.current.removeEventListener('pause', () => {});
      }

      // Create new audio instance
      const audio = new Audio(track.url);
      audioRef.current = audio;
      setCurrentTrack(track);

      // Set up event listeners
      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
      };

      const handleEnded = () => {
        // Only clear state if not manually stopped
        if (!isStoppedManuallyRef.current) {
          setIsPlaying(false);
          setProgress(0);
          stopProgressTracking();
          setCurrentTrack(null);
        }
      };

      const handleError = (e: Event) => {
        console.error('Audio playback error:', e);
        setIsPlaying(false);
        setCurrentTrack(null);
        stopProgressTracking();
      };

      const handlePlay = () => {
        setIsPlaying(true);
        startProgressTracking();
      };

      const handlePause = () => {
        setIsPlaying(false);
        stopProgressTracking();
      };

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('timeupdate', updateProgress);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);

      // Start playback
      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      setCurrentTrack(null);
    }
  }, [updateProgress, startProgressTracking, stopProgressTracking]);

  // Pause audio
  const pauseAudio = useCallback(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Resume audio
  const resumeAudio = useCallback(async () => {
    if (audioRef.current && !isPlaying) {
      try {
        await audioRef.current.play();
      } catch (error) {
        console.error('Error resuming audio:', error);
      }
    }
  }, [isPlaying]);

  // Stop audio
  const stopAudio = useCallback(() => {
    // Mark as manually stopped to prevent auto-restart
    isStoppedManuallyRef.current = true;
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      
      // Remove all event listeners to prevent any callbacks
      audioRef.current.removeEventListener('ended', () => {});
      audioRef.current.removeEventListener('error', () => {});
      audioRef.current.removeEventListener('play', () => {});
      audioRef.current.removeEventListener('pause', () => {});
      audioRef.current.removeEventListener('timeupdate', updateProgress);
      
      // Clear the audio reference
      audioRef.current = null;
    }
    
    setIsPlaying(false);
    setProgress(0);
    setCurrentTrack(null);
    stopProgressTracking();
  }, [stopProgressTracking, updateProgress]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(audioRef.current.muted);
    }
  }, []);

  // Cleanup
  const cleanup = useCallback(() => {
    isStoppedManuallyRef.current = true; // Prevent any restart
    stopProgressTracking();
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      
      // Remove all event listeners
      audioRef.current.removeEventListener('ended', () => {});
      audioRef.current.removeEventListener('error', () => {});
      audioRef.current.removeEventListener('play', () => {});
      audioRef.current.removeEventListener('pause', () => {});
      audioRef.current.removeEventListener('timeupdate', updateProgress);
      
      audioRef.current = null;
    }
    
    setCurrentTrack(null);
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
  }, [stopProgressTracking, updateProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    currentTrack,
    isPlaying,
    isMuted,
    progress,
    duration,
    playAudio,
    pauseAudio,
    resumeAudio,
    stopAudio,
    toggleMute,
    cleanup
  };
}