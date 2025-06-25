'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Mail, Lock, User, ArrowLeft, Sparkles, Palette, Brain, Globe, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, easeInOut } from 'framer-motion';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import type { Engine } from 'tsparticles-engine';
import Image from 'next/image';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const validateForm = () => {
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return false;
    }

    if (!formData.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return false;
    }

    if (!formData.password.trim()) {
      toast.error('Password is required');
      return false;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return false;
    }

    if (!isLogin) {
      if (!formData.confirmPassword.trim()) {
        toast.error('Please confirm your password');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email.trim(),
          password: formData.password
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password. Please check your credentials and try again.');
          } else if (error.message.includes('Email not confirmed')) {
            toast.error('Please check your email and confirm your account before signing in.');
          } else if (error.message.includes('Too many requests')) {
            toast.error('Too many login attempts. Please wait a moment and try again.');
          } else {
            toast.error(error.message || 'Failed to sign in. Please try again.');
          }
          return;
        }

        if (data.user) {
          toast.success('Welcome back! Redirecting to your dashboard...');
          setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            
            emailRedirectTo: `${window.location.origin}/auth/callback`,

            data: {
              email_confirm: true
            }
          }
        });

        if (error) {
          if (error.message.includes('User already registered')) {
            toast.error('An account with this email already exists. Please sign in instead.');
          } else if (error.message.includes('Password should be at least')) {
            toast.error('Password is too weak. Please choose a stronger password.');
          } else if (error.message.includes('Invalid email')) {
            toast.error('Please enter a valid email address.');
          } else if (error.message.includes('Signup is disabled')) {
            toast.error('Account registration is currently disabled. Please contact support.');
          } else {
            toast.error(error.message || 'Failed to create account. Please try again.');
          }
          return;
        }

        if (data.user) {
          if (!data.session) {
            toast.success('Account created successfully! Please check your email and click the confirmation link to activate your account.', {
              duration: 8000,
              style: {
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                border: 'none'
              }
            });
            
            setTimeout(() => {
              toast.info('Check your spam folder if you don\'t see the confirmation email within a few minutes.', {
                duration: 6000
              });
            }, 2000);
          } else {
            toast.success('Account created successfully! Redirecting to your dashboard...');
            setTimeout(() => {
              router.push('/dashboard');
            }, 1000);
          }
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error('An unexpected error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!formData.email.trim()) {
      toast.error('Please enter your email address first');
      return;
    }

    if (!formData.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) {
        if (error.message.includes('rate limit')) {
          toast.error('Too many requests. Please wait a moment before requesting another magic link.');
        } else {
          toast.error(error.message || 'Failed to send magic link');
        }
        return;
      }
      
      toast.success('Magic link sent! Check your email and click the link to sign in.');
    } catch (error: any) {
      console.error('Magic link error:', error);
      toast.error('Failed to send magic link. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
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
    hidden: { opacity: 0, scale: 0.95, y: 30 },
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
      y: [0, -10, 0],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: easeInOut,
      },
    },
  };

  const logoVariants = {
    hidden: { opacity: 0, scale: 0.8, x: -20 },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1] as const,
      },
    },
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 overflow-hidden">
      {/* Enhanced Background Particles */}
      <div className="absolute inset-0">
        <Particles
          id="auth-particles"
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

      {/* Header with Back Button */}
      <motion.header 
        className="relative z-10 p-4 sm:p-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/')}
          className="text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 transition-all duration-300"
          disabled={isLoading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </motion.header>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] p-4">
        <motion.div 
          className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left Side - Branding & Features */}
          <motion.div className="text-center lg:text-left space-y-8" variants={itemVariants}>
            {/* Logo and Title */}
            <div className="space-y-4">
              <motion.header 
                className="flex items-center justify-center lg:justify-start space-x-3"
                variants={logoVariants}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                {/* MuseAI Logo */}
                <div className="relative">
                  <Image
                    src="/images/LogoMuseAI.png"
                    alt="MuseAI Logo"
                    width={48}
                    height={48}
                    className="h-10 w-10 sm:h-12 sm:w-12 object-contain filter drop-shadow-lg"
                    priority
                    quality={95}
                  />
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                
                {/* Title */}
                <div className="flex flex-col">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 bg-clip-text text-transparent">
                    MuseAI
                  </h1>
                  <p className="text-sm sm:text-base text-emerald-300/80 font-light -mt-1">
                    Your art tour guide
                  </p>
                </div>
              </motion.header>
              
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
                {isLogin ? 'Welcome Back to Your' : 'Begin Your'} 
                <span className="block bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  Art Discovery Journey
                </span>
              </h2>
              
              <p className="text-lg text-gray-300 leading-relaxed max-w-md mx-auto lg:mx-0">
                {isLogin 
                  ? 'Continue exploring the world of art with AI-powered insights and immersive storytelling.'
                  : 'Join thousands of art enthusiasts discovering masterpieces through intelligent conversations and audio narratives.'
                }
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
              {[
                {
                  icon: Brain,
                  title: "AI Insights",
                  description: "Deep artwork analysis",
                  gradient: "from-emerald-500 to-teal-500"
                },
                {
                  icon: Palette,
                  title: "Art Stories",
                  description: "Rich cultural context",
                  gradient: "from-green-500 to-emerald-500"
                },
                {
                  icon: Globe,
                  title: "Global Access",
                  description: "Museums worldwide",
                  gradient: "from-teal-500 to-green-500"
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="group p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300"
                  variants={itemVariants}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-3 mx-auto lg:mx-0 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-white text-sm">{feature.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{feature.description}</p>
                </motion.div>
              ))}
            </div>

            {/* Testimonial or Stats */}
            <motion.div 
              className="p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/20"
              variants={itemVariants}
            >
              <div className="flex items-center space-x-3 mb-3">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-medium text-white">Trusted by Art Lovers</span>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                "MuseAI transformed how I experience museums. Every artwork now tells its story in ways I never imagined possible."
              </p>
              <div className="flex items-center mt-3 space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-400"></div>
                <div>
                  <p className="text-white text-xs font-medium">Sarah Chen</p>
                  <p className="text-gray-400 text-xs">Art Enthusiast</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side - Auth Form */}
          <motion.div className="flex justify-center" variants={cardVariants}>
            <Card className="w-full max-w-md shadow-2xl border-0 bg-white/10 backdrop-blur-md">
              <CardHeader className="text-center space-y-4 pb-6">
                <motion.div 
                  className="flex justify-center"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-4 rounded-2xl shadow-lg">
                    <User className="h-8 w-8 text-white" />
                  </div>
                </motion.div>
                
                <div>
                  <CardTitle className="text-2xl font-bold text-white">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                  </CardTitle>
                  <CardDescription className="text-gray-300 mt-2">
                    {isLogin 
                      ? 'Sign in to continue your art discovery journey'
                      : 'Join the community of art enthusiasts worldwide'
                    }
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <motion.div 
                    className="space-y-2"
                    variants={itemVariants}
                  >
                    <Label htmlFor="email" className="text-sm font-medium text-gray-200">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-emerald-400 focus:ring-emerald-400/20 backdrop-blur-sm"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </motion.div>

                  <motion.div 
                    className="space-y-2"
                    variants={itemVariants}
                  >
                    <Label htmlFor="password" className="text-sm font-medium text-gray-200">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="pl-10 pr-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-emerald-400 focus:ring-emerald-400/20 backdrop-blur-sm"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-200 transition-colors"
                        disabled={isLoading}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </motion.div>

                  {!isLogin && (
                    <motion.div 
                      className="space-y-2"
                      variants={itemVariants}
                    >
                      <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-200">
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          className="pl-10 pr-10 h-12 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-emerald-400 focus:ring-emerald-400/20 backdrop-blur-sm"
                          required
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={toggleConfirmPasswordVisibility}
                          className="absolute right-3 top-3 h-4 w-4 text-gray-400 hover:text-gray-200 transition-colors"
                          disabled={isLoading}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  <motion.div variants={itemVariants}>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <Loader2 className="animate-spin h-4 w-4 mr-2" />
                          {isLogin ? 'Signing In...' : 'Creating Account...'}
                        </div>
                      ) : (
                        isLogin ? 'Sign In' : 'Create Account'
                      )}
                    </Button>
                  </motion.div>
                </form>

                <motion.div className="relative" variants={itemVariants}>
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="bg-white/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-2 text-gray-400">Or</span>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleMagicLink}
                    disabled={isLoading}
                    className="w-full h-12 bg-white/5 border-white/20 hover:bg-white/10 text-white font-medium rounded-lg transition-all duration-300 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <Loader2 className="animate-spin h-4 w-4 mr-2" />
                        Sending...
                      </div>
                    ) : (
                      <>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Magic Link
                      </>
                    )}
                  </Button>
                </motion.div>

                <motion.div className="text-center" variants={itemVariants}>
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    disabled={isLoading}
                    className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLogin 
                      ? "Don't have an account? Sign up"
                      : "Already have an account? Sign in"
                    }
                  </button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}