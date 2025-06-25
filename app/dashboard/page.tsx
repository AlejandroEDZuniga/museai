'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, History, LogOut, User, Sparkles, ArrowRight, Zap, Brain, Palette, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, easeInOut } from 'framer-motion';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import type { Engine } from 'tsparticles-engine';
import Image from 'next/image';
import BoltBadge from '@/components/BoltBadge';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [recentScans, setRecentScans] = useState<any[]>([]);

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  useEffect(() => {
    checkAuth();
    fetchRecentScans();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
        return;
      }
      setUser(session.user);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/auth');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentScans = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('scans')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setRecentScans(data || []);
    } catch (error) {
      console.error('Error fetching recent scans:', error);
    }
  };

  const handleSignOut = async () => {
    if (isLoggingOut) return; // Prevent double clicks
    
    setIsLoggingOut(true);
    
    try {
      // Clear all local storage data
      const keysToRemove = [
        'hasSeenLocationPrompt',
        'userLocation',
        'userCoords',
        'supabase.auth.token',
        'sb-auth-token'
      ];
      
      keysToRemove.forEach(key => {
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
        console.warn('Failed to clear sessionStorage:', error);
      }

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase signOut error:', error);
        // Even if Supabase signOut fails, we should still redirect
        // as we've cleared local data
        toast.error('There was an issue signing out, but you have been logged out locally.');
      } else {
        toast.success('Successfully signed out. See you next time!');
      }

      // Clear user state
      setUser(null);
      setRecentScans([]);
      
      // Small delay to show the toast message
      setTimeout(() => {
        router.push('/auth');
      }, 1000);

    } catch (error: any) {
      console.error('Logout error:', error);
      
      // Even if there's an error, we should still try to redirect
      // after clearing what we can locally
      toast.error('An error occurred during logout, but you have been signed out.');
      
      setTimeout(() => {
        router.push('/auth');
      }, 1500);
    } finally {
      setIsLoggingOut(false);
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
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
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
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1] as const,
      },
    },
    hover: {
      y: -8,
      scale: 1.02,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1] as const,
      },
    },
  };

  const floatingVariants = {
    animate: {
      y: [0, -10, 0],
      rotate: [0, 3, -3, 0],
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
          <p className="text-emerald-100 font-medium">Loading your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 relative overflow-hidden">
      {/* Background Particles */}
      <div className="absolute inset-0">
        <Particles
          id="dashboard-particles"
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
          className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl"
          variants={floatingVariants}
          animate="animate"
        />
        <motion.div
          className="absolute top-40 right-20 w-40 h-40 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-3xl"
          variants={floatingVariants}
          animate="animate"
          style={{ animationDelay: '1s' }}
        />
        <motion.div
          className="absolute bottom-32 left-20 w-36 h-36 bg-gradient-to-br from-teal-500/10 to-green-500/10 rounded-full blur-3xl"
          variants={floatingVariants}
          animate="animate"
          style={{ animationDelay: '2s' }}
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
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Image
                src="/images/LogoMuseAI.png"
                alt="MuseAI Logo"
                width={32}
                height={32}
                className="h-8 w-8 object-contain filter drop-shadow-lg"
                priority
                quality={95}
              />
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 bg-clip-text text-transparent">
                MuseAI
              </h1>
            </motion.div>          
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                disabled={isLoggingOut}
                className="text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Sign out"
              >
                {isLoggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
              </Button>

                {/* Bolt badge inline in header */}
              <BoltBadge variant="inline" />
             
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Welcome Section */}
          <motion.div className="text-center space-y-6" variants={itemVariants}>
            <div className="space-y-4">
              <motion.div
                className="flex justify-center"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-2xl shadow-xl">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
              </motion.div>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 bg-clip-text text-transparent leading-tight">
                Welcome to MuseAI
              </h2>
              
              <p className="text-lg sm:text-xl text-gray-200 leading-relaxed max-w-3xl mx-auto">
                Ready to discover amazing artworks? Point your camera and let AI be your guide through the world of art and culture.
              </p>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8" variants={itemVariants}>
            <motion.div
              variants={cardVariants}
              whileHover="hover"
              className="cursor-pointer"
              onClick={() => !isLoggingOut && router.push('/capture')}
            >
              <Card className="group h-full border-0 bg-white/10 backdrop-blur-md shadow-2xl hover:shadow-emerald-500/25 transition-all duration-500 overflow-hidden relative border border-white/20">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <CardHeader className="text-center pb-6 relative z-10">
                  <motion.div 
                    className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300"
                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Camera className="h-10 w-10 text-white" />
                  </motion.div>
                  
                  <CardTitle className="text-2xl font-bold text-white group-hover:text-emerald-300 transition-colors duration-300">
                    Capture Artwork
                  </CardTitle>
                  
                  <CardDescription className="text-gray-300 text-base leading-relaxed">
                    Take a photo of any artwork to get instant AI analysis and immersive audio narration
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="text-center relative z-10">
                  <motion.div
                    className="flex items-center justify-center text-emerald-400 font-medium group-hover:text-emerald-300 transition-colors duration-300"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <span className="mr-2">Start Exploring</span>
                    <ArrowRight className="h-4 w-4" />
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              variants={cardVariants}
              whileHover="hover"
              className="cursor-pointer"
              onClick={() => !isLoggingOut && router.push('/history')}
            >
              <Card className="group h-full border-0 bg-white/10 backdrop-blur-md shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 overflow-hidden relative border border-white/20">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <CardHeader className="text-center pb-6 relative z-10">
                  <motion.div 
                    className="bg-gradient-to-br from-purple-500 to-pink-600 p-6 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300"
                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <History className="h-10 w-10 text-white" />
                  </motion.div>
                  
                  <CardTitle className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors duration-300">
                    Scan History
                  </CardTitle>
                  
                  <CardDescription className="text-gray-300 text-base leading-relaxed">
                    Browse through your previously scanned artworks and revisit your discoveries
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="text-center relative z-10">
                  <motion.div
                    className="flex items-center justify-center text-purple-400 font-medium group-hover:text-purple-300 transition-colors duration-300"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  >
                    <span className="mr-2">View Collection</span>
                    <ArrowRight className="h-4 w-4" />
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Recent Scans */}
          {recentScans.length > 0 && (
            <motion.div className="space-y-6" variants={itemVariants}>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">Recent Discoveries</h3>
                <Button
                  variant="ghost"
                  onClick={() => !isLoggingOut && router.push('/history')}
                  disabled={isLoggingOut}
                  className="text-emerald-400 hover:text-emerald-300 hover:bg-white/10 disabled:opacity-50 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 transition-all duration-300"
                >
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentScans.map((scan, index) => (
                  <motion.div
                    key={scan.id}
                    variants={cardVariants}
                    whileHover="hover"
                    className="cursor-pointer"
                    onClick={() => !isLoggingOut && router.push(`/result?scanId=${scan.id}`)}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <Card className="group border-0 bg-white/10 backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-white/20">
                      <div className="relative">
                        <img
                          src={scan.image_url}
                          alt={scan.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-emerald-300 transition-colors duration-300">
                          {scan.title}
                        </h4>
                        <p className="text-sm text-gray-300 line-clamp-2 mb-3">
                          {scan.description}
                        </p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">
                            {new Date(scan.created_at).toLocaleDateString()}
                          </span>
                          <span className="bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full font-medium border border-emerald-400/30">
                            EN
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Features Showcase - FIXED with High Contrast and Readability */}
          <motion.div className="space-y-8" variants={itemVariants}>
            <h3 className="text-2xl sm:text-3xl font-bold text-white text-center">Powered by AI Intelligence</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8">
              {[
                {
                  icon: Brain,
                  title: "Deep Analysis",
                  description: "Advanced AI understands art history, techniques, and cultural context",
                  gradient: "from-emerald-500 to-teal-500",
                  iconBg: "bg-gradient-to-br from-emerald-500 to-teal-500",
                  cardBg: "bg-slate-800/80",
                  borderColor: "border-emerald-400/40",
                  shadowColor: "shadow-emerald-500/20"
                },
                {
                  icon: Palette,
                  title: "Rich Stories",
                  description: "Immersive narratives that bring artworks to life with audio",
                  gradient: "from-purple-500 to-pink-500",
                  iconBg: "bg-gradient-to-br from-purple-500 to-pink-500",
                  cardBg: "bg-slate-800/80",
                  borderColor: "border-purple-400/40",
                  shadowColor: "shadow-purple-500/20"
                },
                {
                  icon: Zap,
                  title: "Instant Magic",
                  description: "Point, capture, and discover – art knowledge in seconds",
                  gradient: "from-orange-500 to-red-500",
                  iconBg: "bg-gradient-to-br from-orange-500 to-red-500",
                  cardBg: "bg-slate-800/80",
                  borderColor: "border-orange-400/40",
                  shadowColor: "shadow-orange-500/20"
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  variants={cardVariants}
                  whileHover="hover"
                  className="group h-full"
                >
                  <Card className={`border-0 ${feature.cardBg} backdrop-blur-md ${feature.shadowColor} hover:shadow-xl transition-all duration-300 h-full border ${feature.borderColor} hover:border-white/50`}>
                    <CardContent className="p-6 text-center space-y-4 h-full flex flex-col justify-between">
                      {/* Icon with Strong Background */}
                      <motion.div
                        className={`w-16 h-16 rounded-2xl ${feature.iconBg} flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl transition-all duration-300`}
                        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                      >
                        <feature.icon className="w-8 h-8 text-white drop-shadow-md" />
                      </motion.div>
                      
                      {/* Content with High Contrast Text */}
                      <div className="space-y-3 flex-1 flex flex-col justify-center">
                        <h4 className="text-xl font-bold text-white group-hover:text-gray-100 transition-colors duration-300">
                          {feature.title}
                        </h4>
                        <p className="text-sm text-gray-200 leading-relaxed group-hover:text-gray-100 transition-colors duration-300 font-medium">
                          {feature.description}
                        </p>
                      </div>

                      {/* Subtle hover glow effect */}
                      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none`}></div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* User Info */}
          <motion.div variants={itemVariants}>
            <Card className="bg-white/10 backdrop-blur-md border-0 shadow-lg border border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center text-white">
                  <User className="h-5 w-5 mr-3 text-emerald-400" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-400">Email</p>
                    <p className="text-sm text-white">{user?.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-400">Member Since</p>
                    <p className="text-sm text-white">{new Date(user?.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}