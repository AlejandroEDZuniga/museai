"use client";

import { useScroll, useTransform, motion } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";

export default function ZoomParallaxSection() {
  const container = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"],
  });

  const scale4 = useTransform(scrollYProgress, [0, 1], [1, 4]);
  const scale5 = useTransform(scrollYProgress, [0, 1], [1, 5]);
  const scale6 = useTransform(scrollYProgress, [0, 1], [1, 6]);
  const scale8 = useTransform(scrollYProgress, [0, 1], [1, 8]);
  const scale9 = useTransform(scrollYProgress, [0, 1], [1, 9]);

  const pictures = [
    {
      src: "/images/art3.jpg?height=400&width=600",
      scale: scale4,
      className: "w-[25vw] h-[25vh]", 
    },
    {
      src: "/images/art2.jpg?height=480&width=700",
      scale: scale5,
      className: "w-[35vw] h-[30vh] -top-[30vh] left-[5vw]",
    },
    {
      src: "/images/art7.jpg?height=720&width=400",
      scale: scale6,
      className: "w-[20vw] h-[45vh] -top-[10vh] -left-[25vw]", 
    },
    {
      src: "/images/art4.jpg?height=400&width=600",
      scale: scale5,
      className: "w-[25vw] h-[25vh] left-[27.5vw]", 
    },
    {
      src: "/images/art5.jpg?height=820&width=480",
      scale: scale6,
      className: "w-[20vw] h-[45vh] top-[37.5vh] left-[5vw]", 
    },
    {
      src: "/images/art6.jpg?height=400&width=720",
      scale: scale8,
      className: "w-[30vw] h-[25vh] top-[27.5vh] -left-[22.5vw]", 
    },
    {
      src: "/images/art1.jpg?height=820&width=400",
      scale: scale9,
      className: "w-[15vw] h-[45vh] top-[38.5vh] left-[25vw]", 
    },
  ];

  return (
    <section ref={container} className="relative h-[300vh] bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Background overlay to match auth page style */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/80 via-emerald-900/80 to-slate-900/80"></div>
        
        {pictures.map(({ src, scale, className }, index) => (
          <motion.div
            key={index}
            style={{ scale }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className={`relative ${className} rounded-2xl overflow-hidden shadow-2xl border border-emerald-400/30`}>
              <Image
                src={src || "/placeholder.svg"}
                alt={`Gallery image ${index + 1}`}
                fill
                className="object-cover"
                priority={index < 3}
              />
              {/* Subtle overlay to match auth page aesthetic */}
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/20 via-transparent to-teal-900/10"></div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}