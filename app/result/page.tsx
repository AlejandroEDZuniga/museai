"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  MessageCircle,
  Play,
  Pause,
  Volume2,
  LogOut,
  Loader2,
  Send,
  Heart,
  Bookmark,
  MoreVertical,
  Sparkles,
  Zap,
  Mic,
  MicOff,
  Square,
  VolumeX,
  Bell,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import EnhancedVoiceRecorder from "@/components/EnhancedVoiceRecorder";
import VoiceWaveAnimation from "@/components/VoiceWaveAnimation";
import DraggableAudioController from "@/components/DraggableAudioController";
import { useAudioManager } from "@/hooks/useAudioManager";
import { motion, AnimatePresence, easeInOut } from "framer-motion";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import type { Engine } from "tsparticles-engine";
import Image from "next/image";

export default function ResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // const scanId = searchParams.get('scanId');
  const scanId = searchParams?.get("scanId") ?? "";

  const [scan, setScan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  // Voice conversation states
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceConversationActive, setVoiceConversationActive] = useState(false);
  const [generatingChatAudioId, setGeneratingChatAudioId] = useState<
    string | null
  >(null);

  // New message notification
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [lastChatCount, setLastChatCount] = useState(0);

  // Auto-play control
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);

  // Refs for voice recording and chat container
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  // Audio manager
  const {
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
    cleanup: cleanupAudio,
  } = useAudioManager();

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  useEffect(() => {
    if (scanId) {
      fetchScanData();
      fetchChatHistory();
    } else {
      router.push("/dashboard");
    }
  }, [scanId]);

  useEffect(() => {
    if (!scanId || scan?.audio_url) return;

    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from("scans")
          .select("*")
          .eq("id", scanId)
          .single();

        if (error) {
          console.error("Polling error:", error);
          return;
        }

        if (data?.audio_url) {
          setScan(data);
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Polling fetch failed:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [scanId, scan?.audio_url]);

  // Monitor chat history for new messages and auto-scroll
  useEffect(() => {
    if (chatHistory.length > lastChatCount && lastChatCount > 0) {
      setHasNewMessage(true);

      // Auto-scroll to the new message after a short delay
      setTimeout(() => {
        scrollToNewMessage();
      }, 300);
    }
    setLastChatCount(chatHistory.length);
  }, [chatHistory.length, lastChatCount]);

  // Auto-play description when scan loads (only once)
  useEffect(() => {
    if (scan?.audio_url && !currentTrack && !isVoiceMode && !hasAutoPlayed) {
      const descriptionTrack = {
        id: `description-${scan.id}`,
        url: scan.audio_url,
        title: scan.title,
        type: "description" as const,
      };

      // Small delay to ensure UI is ready
      setTimeout(() => {
        playAudio(descriptionTrack);
        setHasAutoPlayed(true); // Mark as auto-played to prevent loops
      }, 1000);
    }
  }, [scan, currentTrack, isVoiceMode, hasAutoPlayed, playAudio]);

  // Cleanup audio and streams on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cleanupAudio]);

  useEffect(() => {
    // Si hay audio nuevo en el historial, refrescamos
    if (chatHistory.some((chat) => chat.audio_url)) {
      setChatHistory([...chatHistory]);
    }
  }, [chatHistory.map((chat) => chat.audio_url).join(",")]);

  const fetchScanData = async () => {
    try {
      const { data, error } = await supabase
        .from("scans")
        .select("*")
        .eq("id", scanId)
        .single();

      if (error) throw error;
      setScan(data);
    } catch (error) {
      console.error("Error fetching scan:", error);
      toast.error("Error loading artwork data");
      router.push("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChatHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("scan_id", scanId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setChatHistory(data || []);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  };

  const handleSignOut = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      // Stop all audio and voice activities
      cleanupAudio();
      stopVoiceRecording();

      // Clear local storage
      const keysToRemove = [
        "hasSeenLocationPrompt",
        "userLocation",
        "userCoords",
        "supabase.auth.token",
        "sb-auth-token",
      ];

      keysToRemove.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`Failed to remove ${key} from localStorage:`, error);
        }
      });

      // Clear session storage
      try {
        sessionStorage.clear();
      } catch (error) {
        console.warn("Failed to clear sessionStorage:", error);
      }

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Supabase signOut error:", error);
        toast.error(
          "There was an issue signing out, but you have been logged out locally."
        );
      } else {
        toast.success("Successfully signed out. See you next time!");
      }

      setTimeout(() => {
        router.push("/auth");
      }, 1000);
    } catch (error: any) {
      console.error("Logout error:", error);
      toast.error(
        "An error occurred during logout, but you have been signed out."
      );

      setTimeout(() => {
        router.push("/auth");
      }, 1500);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const playResponseAudio = (audioUrl: string, responseText: string) => {
    const responseTrack = {
      id: `response-${Date.now()}`,
      url: audioUrl,
      title: responseText.substring(0, 50) + "...",
      type: "response" as const,
    };

    playAudio(responseTrack);
  };

  // const handleChatSubmit = async (
  //   message: string,
  //   isVoice: boolean = false
  // ) => {
  //   if (!message.trim() || !scan || isChatLoading || isLoggingOut) return;

  //   setIsChatLoading(true);

  //   try {
  //     const {
  //       data: { session },
  //       error: sessionError,
  //     } = await supabase.auth.getSession();

  //     if (sessionError || !session?.access_token) {
  //       throw new Error("Authentication required");
  //     }

  //     const response = await fetch("/api/chat", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${session.access_token}`,
  //       },
  //       body: JSON.stringify({
  //         scanId: scan.id,
  //         message: message,
  //         language: scan.language,
  //       }),
  //     });

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(errorData.error || "Chat request failed");
  //     }

  //     const result = await response.json();

  //     await fetchChatHistory();
  //     setChatMessage("");

  //     // If voice mode and response has audio, play it automatically
  //     if (isVoice && result.audioUrl && voiceConversationActive) {
  //       setTimeout(() => {
  //         playResponseAudio(result.audioUrl, result.response);
  //       }, 500);
  //     }

  //     toast.success(isVoice ? "Voice message sent!" : "Message sent!");
  //   } catch (error: any) {
  //     console.error("Chat error:", error);
  //     toast.error(error.message || "Failed to send message. Please try again.");
  //   } finally {
  //     setIsChatLoading(false);
  //   }
  // };

  // const handleChatSubmit = async (
  //   message: string,
  //   isVoice: boolean = false
  // ) => {
  //   if (!message.trim() || !scan || isChatLoading || isLoggingOut) return;

  //   setIsChatLoading(true);

  //   try {
  //     const {
  //       data: { session },
  //       error: sessionError,
  //     } = await supabase.auth.getSession();

  //     if (sessionError || !session?.access_token) {
  //       throw new Error("Authentication required");
  //     }

  //     // Enviar mensaje y obtener respuesta AI
  //     const response = await fetch("/api/chat", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${session.access_token}`,
  //       },
  //       body: JSON.stringify({
  //         scanId: scan.id,
  //         message,
  //         language: scan.language,
  //       }),
  //     });

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       throw new Error(errorData.error || "Chat request failed");
  //     }

  //     const result = await response.json();

  //     // Activar animación de generación de audio
  //     setGeneratingChatAudioId(result.id);

  //     // Llamar al endpoint que genera el audio (en segundo plano)
  //     fetch("/api/chat-generate-audio", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${session.access_token}`,
  //       },
  //       body: JSON.stringify({
  //         chatId: result.id,
  //         text: result.response,
  //         language: scan.language,
  //       }),
  //     })
  //       .catch((err) => {
  //         console.error("⚠️ Error generating chat audio:", err);
  //       })
  //       .finally(() => {
  //         // Desactivar animación una vez que termine
  //         setGeneratingChatAudioId(null);
  //       });

  //     // Actualizar chat
  //     await fetchChatHistory();
  //     setChatMessage("");

  //     toast.success(isVoice ? "Voice message sent!" : "Message sent!");
  //   } catch (error: any) {
  //     console.error("❌ Chat error:", error);
  //     toast.error(error.message || "Failed to send message. Please try again.");
  //   } finally {
  //     setIsChatLoading(false);
  //   }
  // };


  const handleChatSubmit = async (message: string, isVoice: boolean = false) => {
  if (!message.trim() || !scan || isChatLoading || isLoggingOut) return;

  setIsChatLoading(true);

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      throw new Error("Authentication required");
    }

    // 1. Enviar mensaje al endpoint /api/chat
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        scanId: scan.id,
        message,
        language: scan.language,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Chat request failed");
    }

    const result = await response.json();

    // 2. Agregar mensaje de respuesta al chatHistory
    const newMessage = {
      id: result.id,
      message: result.message,
      response: result.response,
      created_at: result.createdAt,
      audio_url: null,
    };

    setChatHistory((prev) => [...prev, newMessage]);

    // 3. Mostrar animación "Generating audio..."
    setGeneratingChatAudioId(result.id);

    // 4. Generar el audio en segundo plano
    fetch("/api/chat-generate-audio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        chatId: result.id,
        text: result.response,
        language: scan.language,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Audio generation failed");
        }
        const data = await res.json();

        console.log("✅ Audio URL generado:", data.audioUrl);

        // 5. Actualizar el chatHistory con el audio_url generado
        setChatHistory((prev) =>
          prev.map((chat) =>
            chat.id === result.id ? { ...chat, audio_url: data.audioUrl } : chat
          )
        );
      })
      .catch((err) => {
        console.error("⚠️ Error generating chat audio:", err);
      })
      .finally(() => {
        setGeneratingChatAudioId(null);
      });

    // 6. Limpiar input
    setChatMessage("");
    toast.success(isVoice ? "Voice message sent!" : "Message sent!");

  } catch (error: any) {
    console.error("❌ Chat error:", error);
    toast.error(error.message || "Failed to send message. Please try again.");
  } finally {
    setIsChatLoading(false);
  }
};


  const startVoiceRecording = async () => {
    try {
      setIsListening(true);
      setIsProcessingVoice(false);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsListening(false);
        setIsProcessingVoice(true);

        const audioBlob = new Blob(chunksRef.current, {
          type: "audio/webm;codecs=opus",
        });
        await processVoiceInput(audioBlob);

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      toast.success("Listening... speak now!");
    } catch (error: any) {
      console.error("Error starting voice recording:", error);
      setIsListening(false);

      if (error.name === "NotAllowedError") {
        toast.error(
          "Microphone access denied. Please enable microphone permissions."
        );
      } else {
        toast.error("Unable to access microphone. Please try again.");
      }
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isListening) {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsListening(false);
    setIsProcessingVoice(false);
  };

  const processVoiceInput = async (audioBlob: Blob) => {
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(",")[1];

        // Call transcription API
        const response = await fetch("/api/transcribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            audio: base64Audio,
            language: scan.language,
          }),
        });

        if (!response.ok) {
          throw new Error("Transcription failed");
        }

        const result = await response.json();

        if (result.text && result.text.trim()) {
          // Send transcribed text to chat
          await handleChatSubmit(result.text.trim(), true);
        } else {
          toast.error("No speech detected. Please try again.");

          // If in voice conversation mode, restart listening
          if (voiceConversationActive) {
            setTimeout(() => {
              startVoiceRecording();
            }, 1000);
          }
        }
      };

      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error("Error processing voice input:", error);
      toast.error("Failed to process voice message. Please try again.");
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const toggleVoiceConversation = () => {
    if (voiceConversationActive) {
      // Stop voice conversation
      setVoiceConversationActive(false);
      setIsVoiceMode(false);
      stopVoiceRecording();
      stopAudio();
      toast.info("Voice conversation ended");
    } else {
      // Start voice conversation
      setVoiceConversationActive(true);
      setIsVoiceMode(true);
      startVoiceRecording();
      toast.success(
        "Voice conversation started! Ask me anything about this artwork."
      );
    }
  };

  const scrollToNewMessage = () => {
    // Find the chat container and the last AI response
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    // Find all AI response elements
    const aiResponses = chatContainer.querySelectorAll("[data-ai-response]");
    const lastAiResponse = aiResponses[aiResponses.length - 1];

    if (lastAiResponse) {
      // Scroll to the beginning of the AI response with smooth animation
      lastAiResponse.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });

      // Clear the new message notification after scrolling
      setTimeout(() => {
        setHasNewMessage(false);
      }, 1000);

      // Show a subtle toast to indicate new response
      toast.success("New AI response", {
        duration: 2000,
        style: {
          background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
          color: "white",
          border: "none",
        },
      });
    }
  };

  const handlePlayDescription = () => {
    const descriptionTrack = {
      id: `description-${scan.id}`,
      url: scan.audio_url,
      title: scan.title,
      type: "description" as const,
    };

    if (currentTrack?.id === descriptionTrack.id && isPlaying) {
      pauseAudio();
    } else {
      playAudio(descriptionTrack);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1] as const,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1] as const,
      },
    },
  };

  const floatingVariants = {
    animate: {
      y: [0, -8, 0],
      rotate: [0, 2, -2, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: easeInOut,
      },
    },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
        <motion.div
          className="flex flex-col items-center space-y-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-300/30 border-t-emerald-400"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-400/20 to-teal-400/20 blur-xl"></div>
          </div>
          <p className="text-emerald-100 font-medium">
            Loading artwork analysis...
          </p>
        </motion.div>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-2xl font-bold text-white mb-2">
            Artwork not found
          </h2>
          <p className="text-gray-300 mb-6">
            The artwork you're looking for doesn't exist or has been removed.
          </p>
          <Button
            onClick={() => router.push("/dashboard")}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Return to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 relative overflow-hidden">
      {/* Background Particles */}
      <div className="absolute inset-0">
        <Particles
          id="result-particles"
          init={particlesInit}
          options={{
            background: {
              color: { value: "transparent" },
            },
            fullScreen: { enable: false },
            fpsLimit: 120,
            interactivity: {
              events: {
                onClick: { enable: true, mode: "push" },
                onHover: { enable: true, mode: "repulse" },
                resize: true,
              },
              modes: {
                push: { quantity: 3 },
                repulse: { distance: 150, duration: 0.4 },
              },
            },
            particles: {
              color: {
                value: ["#10b981", "#34d399", "#6ee7b7", "#059669", "#047857"],
              },
              links: {
                color: "#10b981",
                distance: 120,
                enable: true,
                opacity: 0.2,
                width: 1,
              },
              move: {
                direction: "none",
                enable: true,
                outModes: { default: "bounce" },
                random: false,
                speed: 1,
                straight: false,
              },
              number: {
                density: { enable: true, area: 800 },
                value: 60,
              },
              opacity: { value: 0.3 },
              shape: { type: "circle" },
              size: { value: { min: 1, max: 3 } },
            },
            detectRetina: true,
          }}
          className="w-full h-full"
        />
      </div>

      {/* Floating Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl"
          variants={floatingVariants}
          animate="animate"
        />
        <motion.div
          className="absolute top-40 right-20 w-40 h-40 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-3xl"
          variants={floatingVariants}
          animate="animate"
          style={{ animationDelay: "1s" }}
        />
        <motion.div
          className="absolute bottom-32 left-20 w-36 h-36 bg-gradient-to-br from-teal-500/10 to-green-500/10 rounded-full blur-3xl"
          variants={floatingVariants}
          animate="animate"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Enhanced Voice Processing Overlay */}
      <AnimatePresence>
        {isProcessingVoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-md border border-yellow-400/30 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
            >
              {/* Enhanced Loading Animation */}
              <div className="mb-6 relative">
                <motion.div
                  className="w-20 h-20 mx-auto relative"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <div className="absolute inset-0 border-4 border-yellow-400/30 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-transparent border-t-yellow-400 rounded-full"></div>
                </motion.div>

                {/* Pulsing rings */}
                <motion.div
                  className="absolute inset-0 w-20 h-20 mx-auto border-2 border-orange-400/40 rounded-full"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0.3, 0.7] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className="absolute inset-0 w-20 h-20 mx-auto border-2 border-yellow-400/40 rounded-full"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.1, 0.5] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.3,
                  }}
                />
              </div>

              {/* Enhanced Status Text */}
              <div className="mb-6">
                <motion.h3
                  className="text-2xl font-bold text-yellow-300 mb-3"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  🎤 Processing your voice...
                </motion.h3>

                <motion.p
                  className="text-orange-200 text-lg"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                >
                  Converting speech to text
                </motion.p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-700/50 rounded-full h-2 mb-4">
                <motion.div
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full"
                  animate={{ width: ["0%", "70%", "100%", "0%"] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>

              <p className="text-sm text-gray-300">
                Please wait while we process your message...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Conversation Overlay */}
      <AnimatePresence>
        {isVoiceMode && (isListening || isProcessingVoice) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
            >
              {/* Voice Wave Animation */}
              <div className="mb-6">
                <VoiceWaveAnimation
                  isListening={isListening}
                  isProcessing={isProcessingVoice}
                  className="h-20"
                />
              </div>

              {/* Status Text */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-white mb-2">
                  {isListening
                    ? "Listening..."
                    : isProcessingVoice
                    ? "Processing..."
                    : "Voice Mode"}
                </h3>

                <p className="text-gray-300">
                  {isListening
                    ? "Speak clearly about the artwork"
                    : isProcessingVoice
                    ? "Converting speech to text..."
                    : "Voice conversation active"}
                </p>
              </div>

              {/* Control Buttons */}
              <div className="flex justify-center space-x-4">
                {isListening && (
                  <Button
                    onClick={stopVoiceRecording}
                    size="lg"
                    className="bg-red-500 hover:bg-red-600 text-white rounded-full px-6"
                  >
                    <Square className="h-4 w-4 mr-2 fill-current" />
                    Stop
                  </Button>
                )}

                <Button
                  onClick={toggleVoiceConversation}
                  variant="outline"
                  size="lg"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full px-6 backdrop-blur-sm"
                >
                  Exit Voice Mode
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Message Notification */}
      <AnimatePresence>
        {hasNewMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-20 right-4 z-30"
          >
            <Button
              onClick={scrollToNewMessage}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3"
            >
              <Bell className="h-4 w-4 mr-2 animate-pulse" />
              New Response
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Draggable Audio Controller */}
      <DraggableAudioController
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlay={resumeAudio}
        onPause={pauseAudio}
        onStop={stopAudio}
        onToggleMute={toggleMute}
        isMuted={isMuted}
        progress={progress}
        duration={duration}
      />

      {/* Header */}
      <motion.header
        className="relative z-10 bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
                disabled={isLoggingOut}
                className="text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 transition-all duration-300"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              <Image
                src="/images/LogoMuseAI.png"
                alt="MuseAI Logo"
                width={24}
                height={24}
                className="h-6 w-6 object-contain filter drop-shadow-lg"
                priority
                quality={95}
              />
              <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 bg-clip-text text-transparent">
                Artwork Analysis
              </h1>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 transition-all duration-300 disabled:opacity-50"
                aria-label="Sign out"
              >
                {isLoggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <motion.main
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="space-y-6 lg:space-y-8">
          {/* Artwork Image and Basic Info */}
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8"
            variants={itemVariants}
          >
            {/* Image Section */}
            <motion.div variants={cardVariants}>
              <Card className="bg-white/10 backdrop-blur-md border-0 shadow-2xl overflow-hidden border border-white/20">
                <CardContent className="p-0">
                  <div className="relative group">
                    <img
                      src={scan.image_url}
                      alt={scan.title}
                      className="w-full h-auto max-h-[70vh] object-contain bg-gray-900"
                    />

                    {/* Image Overlay with Actions */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                        <div className="text-white">
                          <p className="text-sm font-medium">Scanned on</p>
                          <p className="text-xs opacity-90">
                            {formatDate(scan.created_at)}
                          </p>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setIsFavorited(!isFavorited)}
                            className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                          >
                            <Heart
                              className={`h-4 w-4 ${
                                isFavorited ? "fill-current text-red-400" : ""
                              }`}
                            />
                          </Button>

                          <Button
                            size="sm"
                            variant="secondary"
                            className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                          >
                            <Bookmark className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Content Section */}
            <div className="space-y-6">
              {/* Title and Description */}
              <motion.div variants={cardVariants}>
                <Card className="bg-white/10 backdrop-blur-md border-0 shadow-2xl border border-white/20">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-3">
                          {scan.title}
                        </CardTitle>

                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full font-medium border border-emerald-400/30">
                            {scan.language.toUpperCase()}
                          </span>
                          <span>{formatDate(scan.created_at)}</span>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white/80 hover:text-white hover:bg-white/10"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <p
                        className={`text-gray-200 leading-relaxed ${
                          !showFullDescription && scan.description.length > 300
                            ? "line-clamp-4"
                            : ""
                        }`}
                      >
                        {scan.description}
                      </p>

                      {scan.description.length > 300 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setShowFullDescription(!showFullDescription)
                          }
                          className="mt-2 text-emerald-400 hover:text-emerald-300 p-0 h-auto"
                        >
                          {showFullDescription ? "Show less" : "Read more"}
                        </Button>
                      )}
                    </div>

                    {/* Listen to Description Button */}
                    {/* {scan.audio_url && (
                      <div className="mt-6 pt-4 border-t border-white/20">
                        <div className="flex items-center justify-between">
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              onClick={handlePlayDescription}
                              disabled={isLoggingOut}
                              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              {currentTrack?.type === "description" &&
                              isPlaying ? (
                                <>
                                  <Pause className="h-4 w-4 mr-2" />
                                  Pause
                                </>
                              ) : (
                                <>
                                  <Volume2 className="h-4 w-4 mr-2" />
                                  Listen
                                </>
                              )}
                            </Button>
                          </motion.div>

                          {currentTrack?.type === "description" &&
                            isPlaying && (
                              <motion.div
                                className="flex items-center space-x-2 text-sm text-emerald-400"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                              >
                                <VoiceWaveAnimation
                                  isListening={true}
                                  isProcessing={false}
                                  className="h-4"
                                />
                                <span className="font-medium">
                                  Playing description...
                                </span>
                              </motion.div>
                            )}
                        </div>

                        <p className="text-xs text-gray-400 mt-2">
                          Listen to an AI-narrated description of this artwork
                        </p>
                      </div>
                    )} */}

                    <div className="mt-6 pt-4 border-t border-white/20">
                      <div className="flex items-center justify-between">
                        {scan.audio_url ? (
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Button
                              onClick={handlePlayDescription}
                              disabled={isLoggingOut}
                              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              {currentTrack?.type === "description" &&
                              isPlaying ? (
                                <>
                                  <Pause className="h-4 w-4 mr-2" />
                                  Pause
                                </>
                              ) : (
                                <>
                                  <Volume2 className="h-4 w-4 mr-2" />
                                  Listen
                                </>
                              )}
                            </Button>
                          </motion.div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                          >
                            <div className="relative">
                              {/* Botón de espera con animación */}
                              <Button
                                disabled
                                className="bg-white/10 border border-white/20 text-white flex items-center space-x-2 rounded-full px-6 py-3 shadow-md backdrop-blur-md relative overflow-hidden"
                              >
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span className="text-sm font-medium">
                                  Generating audio...
                                </span>
                              </Button>

                              {/* Efecto pulsante */}
                              <motion.div
                                className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md"
                                animate={{
                                  scale: [1, 1.2, 1],
                                  opacity: [0.4, 0.2, 0.4],
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                              />
                            </div>
                          </motion.div>
                        )}

                        {/* Visual indicador si se está reproduciendo */}
                        {scan.audio_url &&
                          currentTrack?.type === "description" &&
                          isPlaying && (
                            <motion.div
                              className="flex items-center space-x-2 text-sm text-emerald-400"
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                            >
                              <VoiceWaveAnimation
                                isListening={true}
                                isProcessing={false}
                                className="h-4"
                              />
                              <span className="font-medium">
                                Playing description...
                              </span>
                            </motion.div>
                          )}
                      </div>

                      <p className="text-xs text-gray-400 mt-2 text-center sm:text-left">
                        {scan.audio_url
                          ? "Listen to an AI-narrated description of this artwork"
                          : "Please wait while the AI prepares the narrated description."}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Voice Conversation Quick Start */}
              <motion.div variants={cardVariants}>
                <Card className="bg-slate-800/90 backdrop-blur-md border border-purple-400/50 shadow-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <motion.div
                          className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-xl"
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          <Mic className="h-6 w-6 text-white" />
                        </motion.div>

                        <div>
                          <h4 className="font-semibold text-white mb-1">
                            Voice Conversation
                          </h4>
                          <p className="text-sm text-gray-200 font-medium">
                            {voiceConversationActive
                              ? "Voice mode is active"
                              : "Talk naturally with AI about this artwork"}
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={toggleVoiceConversation}
                        disabled={isLoggingOut || isChatLoading}
                        className={`rounded-full px-6 transition-all duration-300 ${
                          voiceConversationActive
                            ? "bg-red-500 hover:bg-red-600 text-white"
                            : "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white"
                        }`}
                      >
                        {voiceConversationActive ? (
                          <>
                            <MicOff className="h-4 w-4 mr-2" />
                            End Voice Chat
                          </>
                        ) : (
                          <>
                            <Mic className="h-4 w-4 mr-2" />
                            Start Voice Chat
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>

          {/* Chat Section */}
          <motion.div variants={itemVariants}>
            <Card className="bg-white/10 backdrop-blur-md border-0 shadow-2xl border border-white/20">
              <CardHeader className="border-b border-white/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-2 rounded-xl">
                      <MessageCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-white">
                        Ask the AI Assistant
                      </CardTitle>
                      <p className="text-sm text-gray-200 mt-1 font-medium">
                        Have questions about this artwork? Start a conversation!
                      </p>
                    </div>
                  </div>

                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Sparkles className="h-6 w-6 text-purple-400" />
                  </motion.div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Chat History */}
                <AnimatePresence>
                  {chatHistory.length > 0 && (
                    <motion.div
                      ref={chatContainerRef}
                      className="space-y-4 max-h-96 overflow-y-auto"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      {chatHistory.map((chat, index) => (
                        <motion.div
                          key={chat.id}
                          className="space-y-3"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          {/* User Message */}
                          <div className="flex justify-end">
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-4 rounded-2xl rounded-br-md max-w-xs sm:max-w-md shadow-lg">
                              <p className="text-sm leading-relaxed">
                                {chat.message}
                              </p>
                            </div>
                          </div>

                          {/* AI Response */}
                          <div className="flex justify-start">
                            <div
                              className="bg-slate-800/80 backdrop-blur-sm border border-emerald-400/30 p-4 rounded-2xl rounded-bl-md max-w-xs sm:max-w-md shadow-sm"
                              data-ai-response
                            >
                              <div className="flex items-start space-x-2 mb-2">
                                <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-1 rounded-full">
                                  <Zap className="h-3 w-3 text-white" />
                                </div>
                                <span className="text-xs font-medium text-gray-300">
                                  AI Assistant
                                </span>
                              </div>

                              <p className="text-sm text-white leading-relaxed mb-3 font-medium">
                                {chat.response}
                              </p>
                              {generatingChatAudioId === chat.id && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.5 }}
                                  className="mt-4"
                                >
                                  <div className="relative">
                                    <Button
                                      disabled
                                      className="bg-white/10 border border-white/20 text-white flex items-center space-x-2 rounded-full px-6 py-3 shadow-md backdrop-blur-md relative overflow-hidden"
                                    >
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      <span className="text-sm font-medium">
                                        Generating audio...
                                      </span>
                                    </Button>

                                    {/* Efecto pulsante */}
                                    <motion.div
                                      className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md"
                                      animate={{
                                        scale: [1, 1.2, 1],
                                        opacity: [0.4, 0.2, 0.4],
                                      }}
                                      transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                      }}
                                    />
                                  </div>
                                </motion.div>
                              )}

                              {chat.audio_url && (
                                <div className="flex items-center space-x-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={isLoggingOut}
                                    className="text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 p-2 h-auto"
                                    onClick={() => {
                                      if (!isLoggingOut) {
                                        playResponseAudio(
                                          chat.audio_url,
                                          chat.response
                                        );
                                      }
                                    }}
                                  >
                                    <Play className="h-3 w-3 mr-1" />
                                    Play Response
                                  </Button>

                                  {currentTrack?.type === "response" &&
                                    isPlaying &&
                                    currentTrack?.url === chat.audio_url && (
                                      <div className="flex items-center text-xs text-purple-400">
                                        <VoiceWaveAnimation
                                          isListening={true}
                                          isProcessing={false}
                                          className="h-3 mr-1"
                                        />
                                        <span>Playing...</span>
                                      </div>
                                    )}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Chat Input */}
                <div className="space-y-4">
                  {/* Text Input */}
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Ask anything about this artwork..."
                      disabled={
                        isChatLoading || isLoggingOut || voiceConversationActive
                      }
                      className="flex-1 px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent disabled:opacity-50 transition-all duration-200"
                      onKeyPress={(e) => {
                        if (
                          e.key === "Enter" &&
                          !isChatLoading &&
                          !isLoggingOut &&
                          chatMessage.trim() &&
                          !voiceConversationActive
                        ) {
                          handleChatSubmit(chatMessage);
                        }
                      }}
                    />

                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        onClick={() => handleChatSubmit(chatMessage)}
                        disabled={
                          isChatLoading ||
                          !chatMessage.trim() ||
                          isLoggingOut ||
                          voiceConversationActive
                        }
                        className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {isChatLoading ? (
                          <Loader2 className="animate-spin h-4 w-4" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </motion.div>
                  </div>

                  {/* Voice Input - Only show if not in voice conversation mode */}
                  {!voiceConversationActive && (
                    <EnhancedVoiceRecorder
                      onTranscription={(text) =>
                        !isLoggingOut && handleChatSubmit(text, true)
                      }
                      language={scan.language}
                      disabled={isLoggingOut}
                    />
                  )}
                </div>

                {/* Quick Questions */}
                {chatHistory.length === 0 && (
                  <motion.div
                    className="space-y-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <p className="text-sm font-medium text-gray-200">
                      Quick questions to get started:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        "What's the historical significance?",
                        "Who created this artwork?",
                        "What techniques were used?",
                        "What's the cultural context?",
                      ].map((question, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            !isLoggingOut &&
                            !voiceConversationActive &&
                            handleChatSubmit(question)
                          }
                          disabled={
                            isChatLoading ||
                            isLoggingOut ||
                            voiceConversationActive
                          }
                          className="text-left justify-start text-xs p-3 h-auto bg-slate-800/80 border-emerald-400/30 text-white hover:bg-slate-700/80 hover:border-emerald-400/50 transition-all duration-200 backdrop-blur-sm font-medium"
                        >
                          {question}
                        </Button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
}
