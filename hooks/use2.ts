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
  const isStoppedManuallyRef = useRef(false);

  const updateProgress = useCallback(() => {
    if (audioRef.current) {
      setProgress(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  }, []);

  const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    progressIntervalRef.current = setInterval(updateProgress, 100);
  }, [updateProgress]);

  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const playAudio = useCallback(async (track: AudioTrack) => {
    try {
      isStoppedManuallyRef.current = false;

      // Stop and reset previous audio if any
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
        audioRef.current.load(); // reset
        audioRef.current = null;

        // Small delay to avoid AbortError from racing calls
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      // Create new audio instance
      const audio = new Audio(track.url);
      audioRef.current = audio;
      setCurrentTrack(track);

      // Event listeners
      const handleLoadedMetadata = () => setDuration(audio.duration);
      const handleEnded = () => {
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

      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      setCurrentTrack(null);
    }
  }, [updateProgress, startProgressTracking, stopProgressTracking]);

  const pauseAudio = useCallback(() => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const resumeAudio = useCallback(async () => {
    if (audioRef.current && !isPlaying) {
      try {
        await audioRef.current.play();
      } catch (error) {
        console.error('Error resuming audio:', error);
      }
    }
  }, [isPlaying]);

  const stopAudio = useCallback(() => {
    isStoppedManuallyRef.current = true;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.removeEventListener('timeupdate', updateProgress);
      audioRef.current.src = '';
      audioRef.current.load();
      audioRef.current = null;
    }

    setIsPlaying(false);
    setProgress(0);
    setCurrentTrack(null);
    stopProgressTracking();
  }, [stopProgressTracking, updateProgress]);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(audioRef.current.muted);
    }
  }, []);

  const cleanup = useCallback(() => {
    isStoppedManuallyRef.current = true;
    stopProgressTracking();

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.removeEventListener('timeupdate', updateProgress);
      audioRef.current.src = '';
      audioRef.current.load();
      audioRef.current = null;
    }

    setCurrentTrack(null);
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
  }, [stopProgressTracking, updateProgress]);

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
    cleanup,
  };
}
