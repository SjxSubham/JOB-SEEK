import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/* ─────────────────────────────────────────────
   OrbitSphere — A unique 3D orbital animation
   for the OrbitSphere / Job-Seek landing hero.
   Pure CSS 3D transforms + framer-motion + 
   mouse parallax. No canvas/WebGL needed.
   ───────────────────────────────────────────── */

const RING_CONFIG = [
  { radius: 120, tiltX: 65, tiltY: 20, duration: 18, particles: 3, color: "rgba(56,189,248,0.7)" },
  { radius: 170, tiltX: 50, tiltY: -35, duration: 25, particles: 3, color: "rgba(192,132,252,0.65)" },
  { radius: 220, tiltX: 72, tiltY: 55, duration: 32, particles: 2, color: "rgba(94,234,212,0.6)" },
];

const Particle = ({ angle, radius, color, size = 6, delay = 0 }) => {
  const x = Math.cos((angle * Math.PI) / 180) * radius;
  const y = Math.sin((angle * Math.PI) / 180) * radius;

  return (
    <motion.div
      className="orbit-particle"
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 ${size * 2}px ${color}, 0 0 ${size * 4}px ${color}`,
        transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
      }}
      animate={{
        scale: [1, 1.5, 1],
        opacity: [0.7, 1, 0.7],
      }}
      transition={{
        duration: 2.5,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
    />
  );
};

const OrbitalRing = ({ radius, tiltX, tiltY, duration, particles, color, mouseOffset }) => {
  const particleAngles = Array.from({ length: particles }, (_, i) => (360 / particles) * i);

  return (
    <div
      className="orbit-ring-wrapper"
      style={{
        position: "absolute",
        inset: 0,
        transform: `perspective(800px) rotateX(${tiltX + mouseOffset.y * 0.06}deg) rotateY(${tiltY + mouseOffset.x * 0.06}deg)`,
        transformStyle: "preserve-3d",
        transition: "transform 0.3s ease-out",
      }}
    >
      {/* The ring path */}
      <div
        className="orbit-ring-path"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: radius * 2,
          height: radius * 2,
          borderRadius: "50%",
          border: `1px solid ${color.replace(/[\d.]+\)$/, "0.2)")}`,
          transform: "translate(-50%, -50%)",
          animation: `orbit-spin ${duration}s linear infinite`,
        }}
      >
        {particleAngles.map((angle, i) => (
          <Particle
            key={i}
            angle={angle}
            radius={radius}
            color={color}
            size={5 + Math.random() * 3}
            delay={i * 0.8}
          />
        ))}
      </div>
    </div>
  );
};

const OrbitSphere = ({ className = "" }) => {
  const containerRef = useRef(null);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      setMouseOffset({
        x: (e.clientX - centerX) / (rect.width / 2),
        y: (e.clientY - centerY) / (rect.height / 2),
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`orbit-sphere-container ${className}`}
      aria-hidden="true"
    >
      {/* Central core glow */}
      <motion.div
        className="orbit-core"
        animate={{
          scale: [1, 1.08, 1],
          opacity: [0.85, 1, 0.85],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Inner halo */}
      <div className="orbit-core-halo" />

      {/* Orbital rings + particles */}
      {RING_CONFIG.map((ring, i) => (
        <OrbitalRing key={i} {...ring} mouseOffset={mouseOffset} />
      ))}

      {/* Ambient floating motes */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`mote-${i}`}
          className="orbit-mote"
          style={{
            position: "absolute",
            width: 3,
            height: 3,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.3)",
            left: `${20 + Math.random() * 60}%`,
            top: `${20 + Math.random() * 60}%`,
          }}
          animate={{
            y: [0, -20 - Math.random() * 30, 0],
            x: [0, 10 - Math.random() * 20, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: i * 1.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export default OrbitSphere;
