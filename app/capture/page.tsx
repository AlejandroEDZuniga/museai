'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Upload, ArrowLeft, Loader2, AlertCircle, LogOut, Sparkles, RefreshCw, X, CheckCircle, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { compressImage } from '@/lib/utils';
import { motion, AnimatePresence, easeInOut } from 'framer-motion';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import type { Engine } from 'tsparticles-engine';
import Image from 'next/image';
import { handleGlobalSignOut } from '@/lib/auth/signOut';

export default function CapturePage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [cameraError, setCameraError] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  useEffect(() => {
    checkAuth();
    return () => stopCamera(); // Cleanup on unmount
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }
      setUser(session.user);
    } catch (err) {
      console.error('❌ Auth error:', err);
      router.push('/auth');
    }
  };



const handleSignOut = async () => {
  if (isLoggingOut) return;

  setIsLoggingOut(true);
  await handleGlobalSignOut({
    stopCamera,
    router,
    toast,
    setUser
  });
  setIsLoggingOut(false);
};

  const startCamera = async () => {
    try {
      setCameraError('');
      
      if (!videoRef.current) {
        console.warn('⚠️ videoRef.current is not available');
        return;
      }

      console.log('📸 Requesting camera access...');
      
      // Try environment camera first (back camera on mobile)
      let constraints = {
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      };

      let mediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
        // Fallback to any available camera
        console.log('Environment camera not available, trying any camera...');
        constraints = {
          video: { 
            facingMode: 'user',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        };
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      }

      videoRef.current.srcObject = mediaStream;
      setStream(mediaStream);
      setIsCameraActive(true);
      console.log('✅ Camera started successfully');
      
      // Add event listener for video loaded
      videoRef.current.addEventListener('loadedmetadata', () => {
        if (videoRef.current) {
          videoRef.current.play();
        }
      });
      
    } catch (err: any) {
      console.error('❌ Error accessing camera:', err);
      let errorMessage = 'Could not access camera. ';
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera permissions and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage += 'Camera not supported on this browser.';
      } else {
        errorMessage += 'Please check your camera and try again.';
      }
      
      setCameraError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setIsCameraActive(false);
    setCameraError('');
    console.log('🛑 Camera stopped');
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    try {
      const context = canvas.getContext('2d');
      if (!context) return;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the video frame to canvas
      context.drawImage(video, 0, 0);
      
      // Get image data with high quality
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(imageData);
      stopCamera();
      
      console.log('📷 Photo captured successfully');
      toast.success('Photo captured! Ready for analysis.');
      
    } catch (err) {
      console.error('❌ Error capturing photo:', err);
      toast.error('Failed to capture photo. Please try again.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image too large. Please select an image under 10MB.');
      return;
    }

    setIsProcessingImage(true);
    
    try {
      const compressedBase64 = await compressImage(file, 0.8);
      setCapturedImage(`data:image/jpeg;base64,${compressedBase64}`);
      toast.success('Image uploaded successfully!');
    } catch (err) {
      console.error('❌ Error processing image:', err);
      toast.error('Error processing image. Please try again.');
    } finally {
      setIsProcessingImage(false);
    }
  };


  const analyzeImage = async () => {
  if (!capturedImage || !user) return;

  setIsLoading(true);

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      throw new Error("Invalid session or missing token");
    }

    const base64Data = capturedImage.split(',')[1];

    const response = await fetch('/api/describe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        image: base64Data,
        language: 'en',
        location: localStorage.getItem('userLocation') || undefined,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err?.error || 'Server response failed');
    }

    const result = await response.json();

    fetch('/api/generate-audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        scanId: result.scanId,
        description: result.description,
        language: 'en',
      }),
    }).catch((err) => {
      console.error('⚠️ Error generating audio:', err);
    });

    toast.success('Analysis complete! Redirecting to results...');

    setTimeout(() => {
      router.push(`/result?scanId=${result.scanId}`);
    }, 1000);

  } catch (err: any) {
    console.error('❌ Analysis error:', err);
    toast.error(err.message || 'Failed to analyze image. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

  const resetCapture = () => {
    setCapturedImage('');
    setCameraError('');
    stopCamera();
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
        duration: 4,
        repeat: Infinity,
        ease: easeInOut,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 relative overflow-hidden">
      {/* Background Particles */}
      <div className="absolute inset-0">
        <Particles
          id="capture-particles"
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
                value: ["#10b981", "#34d399", "#6ee7b7", "#059669", "#047857"] 
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
          className="absolute top-20 left-4 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-2xl"
          variants={floatingVariants}
          animate="animate"
        />
        <motion.div
          className="absolute top-32 right-8 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-2xl"
          variants={floatingVariants}
          animate="animate"
          style={{ animationDelay: '2s' }}
        />
        <motion.div
          className="absolute bottom-24 left-8 w-28 h-28 bg-gradient-to-br from-teal-500/10 to-green-500/10 rounded-full blur-2xl"
          variants={floatingVariants}
          animate="animate"
          style={{ animationDelay: '4s' }}
        />
      </div>

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
                onClick={() => router.push('/dashboard')}
                disabled={isLoading || isLoggingOut}
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
              <motion.h1 
                className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 bg-clip-text text-transparent"
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                Capture Artwork
              </motion.h1>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                disabled={isLoading || isLoggingOut}
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
        className="relative z-10 max-w-4xl mx-auto px-4 py-6 sm:py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.div className="text-center mb-8 space-y-4" variants={itemVariants}>
          <motion.div
            className="flex justify-center"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-2xl shadow-xl">
              <Camera className="h-8 w-8 text-white" />
            </div>
          </motion.div>
          
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 bg-clip-text text-transparent">
            Capture Artwork Magic
          </h2>
          
          <p className="text-gray-200 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Point your camera at any artwork or upload an image to unlock AI-powered insights and immersive audio stories
          </p>
        </motion.div>

        {/* Main Capture Card */}
        <motion.div variants={cardVariants}>
          <Card className="bg-white/10 backdrop-blur-md shadow-2xl border-0 overflow-hidden border border-white/20">
            <CardContent className="p-0">
              <AnimatePresence mode="wait">
                {/* Captured Image Display */}
                {capturedImage ? (
                  <motion.div 
                    key="captured"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6 p-6"
                  >
                    <div className="relative rounded-2xl overflow-hidden bg-gray-900">
                      <img
                        src={capturedImage}
                        alt="Captured artwork"
                        className="w-full h-auto max-h-[60vh] object-contain"
                      />
                      
                      {/* Success Overlay */}
                      <motion.div
                        className="absolute top-4 right-4 bg-emerald-500 text-white p-2 rounded-full shadow-lg"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                      >
                        <CheckCircle className="h-5 w-5" />
                      </motion.div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Button 
                        onClick={resetCapture} 
                        variant="outline" 
                        disabled={isLoading || isLoggingOut}
                        className="h-12 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-200 backdrop-blur-sm"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Take Another
                      </Button>
                      
                      <Button 
                        onClick={analyzeImage} 
                        disabled={isLoading || isLoggingOut} 
                        className="h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                            Analyzing artwork...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Analyze Artwork
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="capture"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-6 p-6"
                  >
                    {/* Camera Preview */}
                    <div className="relative rounded-2xl overflow-hidden bg-black min-h-[300px] sm:min-h-[400px] flex items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover transition-opacity duration-500 ${
                          isCameraActive ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                      
                      {/* Camera Overlay */}
                      {isCameraActive && (
                        <motion.div
                          className="absolute inset-0 pointer-events-none"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                        >
                          {/* Viewfinder Grid */}
                          <div className="absolute inset-4 border-2 border-white/30 rounded-xl">
                            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                              {Array.from({ length: 9 }).map((_, i) => (
                                <div key={i} className="border border-white/10"></div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Corner Brackets */}
                          <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-white/60 rounded-tl-lg"></div>
                          <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-white/60 rounded-tr-lg"></div>
                          <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-white/60 rounded-bl-lg"></div>
                          <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-white/60 rounded-br-lg"></div>
                        </motion.div>
                      )}
                      
                      {/* Camera Controls */}
                      {isCameraActive && (
                        <motion.div
                          className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-4"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 }}
                        >
                          <Button
                            onClick={stopCamera}
                            variant="secondary"
                            size="sm"
                            disabled={isLoading || isLoggingOut}
                            className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 transition-all duration-200"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              onClick={capturePhoto}
                              size="lg"
                              disabled={isLoading || isLoggingOut}
                              className="bg-white text-gray-900 hover:bg-gray-100 rounded-full w-16 h-16 p-0 shadow-xl"
                            >
                              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                                <Camera className="h-6 w-6 text-white" />
                              </div>
                            </Button>
                          </motion.div>
                          
                          <div className="w-8"></div> {/* Spacer for symmetry */}
                        </motion.div>
                      )}
                      
                      {/* Placeholder when camera is not active */}
                      {!isCameraActive && !cameraError && (
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center text-center text-white/80 space-y-4"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <div className="flex flex-col items-center space-y-4">
                            <Camera className="h-16 w-16 opacity-50" />
                            <div>
                              <p className="text-lg font-medium">Camera Ready</p>
                              <p className="text-sm opacity-75">Tap "Open Camera" to start</p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                      
                      {/* Camera Error Display */}
                      {cameraError && (
                        <motion.div
                          className="absolute inset-0 flex items-center justify-center text-center text-white space-y-4 p-6"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <div className="flex flex-col items-center space-y-4">
                            <AlertCircle className="h-16 w-16 text-red-400" />
                            <div>
                              <p className="text-lg font-medium text-red-300 mb-2">Camera Access Issue</p>
                              <p className="text-sm text-gray-300 leading-relaxed max-w-sm">{cameraError}</p>
                            </div>
                            <Button
                              onClick={startCamera}
                              variant="secondary"
                              className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Try Again
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Button
                        onClick={() => {
                          setIsCameraActive(true);
                          setTimeout(() => startCamera(), 100);
                        }}
                        disabled={isLoading || isLoggingOut || isCameraActive}
                        className="h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        {isCameraActive ? 'Camera Active' : 'Open Camera'}
                      </Button>
                      
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        disabled={isLoading || isLoggingOut || isProcessingImage}
                        className="h-12 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-200 backdrop-blur-sm"
                      >
                        {isProcessingImage ? (
                          <>
                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Image
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pro Tips Section - FIXED with High Contrast and Readability */}
        <motion.div variants={itemVariants} className="mt-8">
          <Card className="bg-slate-800/90 backdrop-blur-md border border-emerald-400/50 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <motion.div
                  className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl shadow-lg flex-shrink-0"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Sparkles className="h-6 w-6 text-white drop-shadow-md" />
                </motion.div>
                
                <div className="space-y-4 flex-1">
                  <h3 className="font-bold text-white text-xl">Pro Tips for Perfect Captures</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {[
                      "Ensure good lighting and avoid shadows",
                      "Capture the entire artwork if possible", 
                      "Avoid reflections and glare",
                      "Get close enough for clear details"
                    ].map((tip, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full flex-shrink-0"></div>
                        <span className="text-white font-medium leading-relaxed">{tip}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-slate-700/80 backdrop-blur-sm rounded-lg p-4 mt-4 border border-emerald-400/30">
                    <p className="text-sm text-white leading-relaxed font-medium">
                      <span className="text-emerald-300 font-bold">Supported formats:</span> JPG, PNG, WebP • <span className="text-emerald-300 font-bold">Max size:</span> 10MB • <span className="text-emerald-300 font-bold">Best quality:</span> High resolution images
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        {/* Hidden Canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </motion.main>
    </div>
  );
}