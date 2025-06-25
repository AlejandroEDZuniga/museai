'use client';

import { useCallback } from 'react';
import Particles from 'react-tsparticles';
import { loadSlim } from 'tsparticles-slim';
import type { Engine } from 'tsparticles-engine';
import { Button } from '@/components/ui/button';
import { Typewriter } from 'react-simple-typewriter';
import { useRouter } from 'next/navigation';
import { motion, easeInOut, easeOut } from 'framer-motion';
import { ChevronDown, ArrowRight } from 'lucide-react';
import Image from 'next/image';

export default function Hero() {
  const router = useRouter();

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const scrollIndicatorVariants = {
    animate: {
      y: [0, 8, 0],
      opacity: [0.5, 1, 0.5],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: easeInOut
      }
    }
  };

  const buttonVariants = {
    initial: { scale: 1 },
    hover: { 
      scale: 1.05,
      transition: {
        duration: 0.2,
        ease: easeOut
      }
    },
    tap: { 
      scale: 0.95,
      transition: {
        duration: 0.1
      }
    }
  };

const logoVariants = {
  initial: { opacity: 0, scale: 0.8, y: 20 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      duration: 0.8,
      delay: 1.4,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number]
    }
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.3,
      ease: easeInOut
    }
  }
};
  const floatingVariants = {
    animate: {
      y: [0, -10, 0],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: easeInOut,
      },
    },
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 text-white flex flex-col overflow-hidden">
      {/* Background Particles */}
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          background: {
            color: { value: 'transparent' },
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
        className="absolute inset-0 z-0"
      />

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

      {/* Main Content Container */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Hero Content */}
        {/* <main className="flex-1 flex flex-col justify-center text-center px-4 sm:px-6 py-12 sm:py-16 max-w-6xl mx-auto w-full"> */}
          {/* Title */}
          <main className="flex-1 flex flex-col justify-center text-center px-4 sm:px-6 py-8 sm:pt-16 max-w-6xl mx-auto w-full">

          <motion.h1 
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-8 sm:mb-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Typewriter
              words={['MuseAI - Your art tour guide']}
              typeSpeed={80}
              cursor
              cursorStyle="|"
            />
          </motion.h1>

          {/* MuseAI Logo */}
          <motion.div
            className="flex justify-center mb-8 sm:mb-10"
            variants={logoVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
          >
            <div className="relative">
              {/* Subtle glow effect behind logo */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-teal-400/30 to-green-400/20 rounded-full blur-xl scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Logo container with elegant styling */}
              <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-2xl group hover:border-white/30 transition-all duration-300">
                <Image
                  src="/images/LogoMuseAI.png"
                  alt="MuseAI Logo"
                  width={120}
                  height={120}
                  className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 object-contain filter drop-shadow-lg"
                  priority
                  quality={95}
                />
                
                {/* Subtle inner glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>
          </motion.div>

          {/* Description */}
          <motion.p 
            className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed mb-10 sm:mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Upload or capture art, let AI narrate its story.
          </motion.p>

          {/* Get Started Button - Fixed for full clickability */}
          <motion.div
            className="mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            <motion.div
              variants={buttonVariants}
              initial="initial"
              whileHover="hover"
              whileTap="tap"
              className="inline-block"
            >
              <Button
                onClick={() => router.push('/auth')}
                size="lg"
                className="group relative bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-4 px-8 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 border-0 text-lg sm:text-xl cursor-pointer overflow-hidden"
              >
                {/* Glow effect - positioned BEHIND content with pointer-events-none */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-teal-400/20 to-green-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl pointer-events-none -z-10" />
                
                {/* Button content - fully interactive with proper z-index */}
                <span className="relative z-20 flex items-center justify-center space-x-3 pointer-events-auto">
                  <span>Get Started</span>
                  <motion.div
                    animate={{ x: [0, 6, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                </span>
              </Button>
            </motion.div>
          </motion.div>
        </main>

        {/* Scroll Indicators - Positioned BELOW the button content */}
        <motion.div 
          className="relative z-10 flex flex-col items-center space-y-3 pb-8 sm:pb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.5 }}
        >
          {/* Scroll text */}
          <motion.p 
            className="text-xs sm:text-sm text-gray-400 font-light tracking-wide"
            animate={{ 
              opacity: [0.5, 1, 0.5] 
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          >
            Scroll to explore
          </motion.p>

          {/* Double arrow indicators */}
          <div className="flex flex-col items-center space-y-1">
            <motion.div
              variants={scrollIndicatorVariants}
              animate="animate"
              className="text-white/70 hover:text-white transition-colors duration-300"
            >
              <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.div>
            <motion.div
              variants={scrollIndicatorVariants}
              animate="animate"
              style={{ animationDelay: '0.3s' }}
              className="text-white/50 hover:text-white transition-colors duration-300"
            >
              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.div>
          </div>

          {/* Subtle glow line */}
          <motion.div
            className="w-px h-6 sm:h-8 bg-gradient-to-b from-white/30 to-transparent"
            animate={{ 
              opacity: [0.3, 0.8, 0.3],
              scaleY: [0.8, 1, 0.8]
            }}
            transition={{ 
              duration: 2.5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}