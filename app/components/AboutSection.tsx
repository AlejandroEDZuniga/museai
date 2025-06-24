"use client"

import { useCallback } from "react"
import Particles from "react-tsparticles"
import { loadSlim } from "tsparticles-slim"
import type { Engine } from "tsparticles-engine"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Camera, Upload, Volume2, Sparkles, ArrowRight, MessageCircle, Mic, Zap } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"

export default function AboutSection() {
  const router = useRouter()

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2,
      },
    },
  }

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
  }

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1] as const,
      },
    },
  }

  const mockupVariants = {
    hidden: { opacity: 0, scale: 0.8, rotateY: -15 },
    visible: {
      opacity: 1,
      scale: 1,
      rotateY: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.1, 0.25, 1] as const,
      },
    },
  }

  const featureVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
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
  }

  const floatingVariants = {
    animate: {
      y: [0, -10, 0],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  }

  return (
    <section
      className="relative min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 text-white flex items-center justify-center"
      style={{ isolation: "isolate" }}
    >
      {/* Enhanced background particles */}
      <div className="absolute inset-0 overflow-hidden">
        <Particles
          id="about-particles"
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

      <motion.main
        className="relative z-10 text-center p-4 sm:p-6 max-w-7xl mx-auto space-y-16 sm:space-y-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Image - Person taking photo of sculpture */}
        <motion.div className="relative mx-auto max-w-4xl" variants={imageVariants}>
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-sm">
            <Image
              src="/images/Piedad.png"
              alt="Person taking a photo of a sculpture in a museum"
              width={800}
              height={600}
              className="w-full h-auto object-cover"
              priority
            />

            {/* Enhanced overlay with gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/40 via-transparent to-teal-900/20"></div>

            {/* Floating camera icon with enhanced animation */}
            <motion.div
              className="absolute top-4 right-4 sm:top-6 sm:right-6"
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            >
              <div className="bg-gradient-to-br from-emerald-500/30 to-teal-500/30 backdrop-blur-md rounded-full p-3 border border-white/40 shadow-lg">
                <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-lg" />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Enhanced App mockup */}
        <motion.div className="relative mx-auto w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96" variants={mockupVariants}>
          <div className="relative rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-md border border-emerald-400/30 shadow-2xl overflow-hidden">
            {/* Enhanced glassmorphism overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-green-500/10 backdrop-blur-sm"></div>

            {/* Animated background orbs */}
            <motion.div
              className="absolute top-1/4 left-1/4 w-16 h-16 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-xl"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute bottom-1/4 right-1/4 w-20 h-20 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-xl"
              animate={{
                scale: [1.2, 0.8, 1.2],
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{
                duration: 4,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: 1,
              }}
            />

            {/* Enhanced floating sparkles */}
            <motion.div
              className="absolute top-4 right-4"
              animate={{
                rotate: 360,
                scale: [1, 1.3, 1],
              }}
              transition={{
                rotate: { duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                scale: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
              }}
            >
              <Sparkles className="w-6 h-6 text-emerald-400 drop-shadow-lg" />
            </motion.div>

            <div className="relative h-full flex items-center justify-center p-6 sm:p-8">
              <div className="text-center space-y-6">
                <motion.div
                  className="flex justify-center space-x-4 sm:space-x-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                >
                  {[
                    { Icon: Camera, gradient: "from-emerald-400 to-teal-400" },
                    { Icon: Upload, gradient: "from-green-400 to-emerald-400" },
                    { Icon: Volume2, gradient: "from-teal-400 to-green-400" },
                  ].map(({ Icon, gradient }, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.2, rotate: 10 }}
                      whileTap={{ scale: 0.9 }}
                      animate={{
                        y: [0, -6, 0],
                      }}
                      transition={{
                        y: {
                          duration: 2.5,
                          repeat: Number.POSITIVE_INFINITY,
                          delay: index * 0.4,
                          ease: "easeInOut",
                        },
                      }}
                      className={`p-2 sm:p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}
                    >
                      <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-md" />
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1, duration: 0.6 }}
                >
                  <div className="text-white text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 bg-clip-text text-transparent drop-shadow-lg">
                    MuseAI
                  </div>
                  <div className="text-gray-200 text-sm sm:text-base italic mt-2 font-light drop-shadow-sm">
                    Art meets Intelligence
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* About content */}
        <motion.div className="space-y-12" variants={itemVariants}>
          <motion.h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 bg-clip-text text-transparent leading-tight drop-shadow-lg"
            variants={itemVariants}
          >
            Discover Art Like Never Before
          </motion.h2>

          <motion.p
            className="text-lg sm:text-xl md:text-2xl text-gray-200 leading-relaxed max-w-4xl mx-auto font-light drop-shadow-sm"
            variants={itemVariants}
          >
            MuseAI transforms your museum visits into immersive, intelligent journeys. Simply capture any artwork with your camera — our advanced AI instantly reveals its fascinating story, historical context, and cultural significance. Whether you're an art novice or connoisseur, MuseAI creates meaningful connections with creativity through cutting-edge technology.
          </motion.p>

          {/* Enhanced Features Grid */}
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mt-16" variants={containerVariants}>
            {[
              {
                icon: Camera,
                title: "Capture",
                description: "Instantly photograph any artwork with smart recognition",
                gradient: "from-emerald-500 via-emerald-600 to-teal-500",
                shadowColor: "shadow-emerald-500/25",
                borderColor: "border-emerald-400/30",
              },
              {
                icon: Upload,
                title: "Upload",
                description: "Share images from your gallery for instant analysis",
                gradient: "from-green-500 via-green-600 to-emerald-500",
                shadowColor: "shadow-green-500/25",
                borderColor: "border-green-400/30",
              },
              {
                icon: Volume2,
                title: "Listen",
                description: "Enjoy immersive AI-narrated stories and insights",
                gradient: "from-teal-500 via-teal-600 to-green-500",
                shadowColor: "shadow-teal-500/25",
                borderColor: "border-teal-400/30",
              },
              {
                icon: MessageCircle,
                title: "Chat",
                description: "Ask questions and have conversations about art",
                gradient: "from-purple-500 via-purple-600 to-pink-500",
                shadowColor: "shadow-purple-500/25",
                borderColor: "border-purple-400/30",
              },
            ].map((feature, index) => (
              <motion.div 
                key={index} 
                className="group relative" 
                variants={featureVariants} 
                whileHover="hover"
              >
                <div className={`relative flex flex-col items-center space-y-4 p-6 rounded-2xl bg-white/10 backdrop-blur-md border ${feature.borderColor} hover:border-white/40 transition-all duration-500 ${feature.shadowColor} hover:shadow-xl`}>
                  {/* Enhanced icon with vibrant gradient */}
                  <motion.div 
                    className={`relative p-4 rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg group-hover:shadow-xl transition-all duration-300`}
                    whileHover={{ rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <feature.icon className="w-8 h-8 text-white drop-shadow-md" />
                    
                    {/* Glow effect */}
                    <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-300`}></div>
                  </motion.div>

                  <h3 className="text-xl font-semibold text-white group-hover:text-gray-100 transition-colors duration-300">
                    {feature.title}
                  </h3>

                  <p className="text-sm text-gray-300 text-center leading-relaxed group-hover:text-gray-200 transition-colors duration-300">
                    {feature.description}
                  </p>

                  {/* Enhanced hover glow effect */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* New Chat Feature Highlight Section */}
          <motion.div 
            className="relative mt-20 p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-md border border-emerald-400/30 shadow-2xl"
            variants={itemVariants}
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-br from-green-400/10 to-emerald-400/10 rounded-full blur-3xl"></div>

            <div className="relative z-10 text-center space-y-8">
              <motion.div
                className="flex justify-center space-x-4"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <motion.div
                  className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                >
                  <MessageCircle className="w-8 h-8 text-white" />
                </motion.div>
                <motion.div
                  className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg"
                  animate={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.5 }}
                >
                  <Mic className="w-8 h-8 text-white" />
                </motion.div>
                <motion.div
                  className="p-4 rounded-2xl bg-gradient-to-br from-teal-500 to-green-500 shadow-lg"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 1 }}
                >
                  <Zap className="w-8 h-8 text-white" />
                </motion.div>
              </motion.div>

              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 bg-clip-text text-transparent">
                Converse with Art Intelligence
              </h3>

              <p className="text-lg sm:text-xl text-gray-200 leading-relaxed max-w-3xl mx-auto">
                Go beyond static descriptions. Ask questions, explore deeper meanings, and engage in natural conversations about any artwork. Use text or voice input to unlock personalized insights and discover connections you never knew existed.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
                <div className="flex items-center space-x-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-emerald-400/20">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
                    <MessageCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-white">Text Chat</h4>
                    <p className="text-sm text-gray-300">Type your questions naturally</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-green-400/20">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                    <Mic className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-white">Voice Input</h4>
                    <p className="text-sm text-gray-300">Speak and get audio responses</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Enhanced Call to Action */}
        <motion.div className="pt-12" variants={itemVariants}>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => router.push("/auth")}
              size="lg"
              className="group relative bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-4 px-8 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-0"
            >
              {/* Enhanced button glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-teal-400/20 to-green-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>

              <span className="relative flex items-center space-x-3">
                <span className="text-lg">Start Your Art Journey</span>
                <motion.div
                  animate={{ x: [0, 6, 0] }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </span>
            </Button>
          </motion.div>
        </motion.div>
      </motion.main>
    </section>
  )
}