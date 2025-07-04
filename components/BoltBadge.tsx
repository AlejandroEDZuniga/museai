'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

export default function BoltBadge() {
  return (
    <motion.a
      href="https://bolt.new"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed top-14 right-2 z-50 group"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="relative">
        {/* Subtle glow effect on hover */}
        <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md scale-110" />
        
        {/* Badge Image - Doubled in size */}
        <Image
          src="/images/black_circle_360x360.png"
          alt="Made in Bolt.new"
          width={128}
          height={128}
          className="h-24 w-24 sm:h-32 sm:w-32 object-contain transition-all duration-300 drop-shadow-lg"
          priority
          quality={95}
        />
      </div>
    </motion.a>
  );
}