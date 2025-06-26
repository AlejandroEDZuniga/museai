// lib/auth/signOut.ts

import { supabase } from '@/lib/supabase';

interface SignOutOptions {
  stopCamera?: () => void;
  cleanupAudio?: () => void;
  stopVoiceRecording?: () => void;
  setUser?: (user: any) => void;
  setRecentScans?: (scans: any[]) => void;
  router: any;
  toast: any;
}

export async function handleGlobalSignOut({
  stopCamera,
  cleanupAudio,
  stopVoiceRecording,
  setUser,
  setRecentScans,
  router,
  toast
}: SignOutOptions) {
  try {
    stopCamera?.();
    cleanupAudio?.();
    stopVoiceRecording?.();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Supabase signOut error:', error);
      toast.error('There was an issue signing out, but you have been logged out locally.');
    } else {
      toast.success('Successfully signed out. See you next time!');
    }

    // Clear localStorage keys
    const keysToRemove = [
      'hasSeenLocationPrompt',
      'userLocation',
      'userCoords',
      'supabase.auth.token',
      'sb-auth-token'
    ];

    keysToRemove.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (err) {
        console.warn(`Failed to remove ${key} from localStorage:`, err);
      }
    });

    try {
      sessionStorage.clear();
    } catch (err) {
      console.warn('Failed to clear sessionStorage:', err);
    }

    setUser?.(null);
    setRecentScans?.([]);

    setTimeout(() => {
      router.push('/auth');
    }, 1000);

  } catch (err: any) {
    console.error('Logout error:', err);
    toast.error('An error occurred during logout, but you have been signed out.');
    setTimeout(() => {
      router.push('/auth');
    }, 1500);
  }
}
