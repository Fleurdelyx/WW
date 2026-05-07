import { motion } from 'framer-motion';
import { useMemo } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

export default function ParticleBackground({ count = 30, color = 'rgba(212,168,67,0.15)' }: { count?: number; color?: string }) {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.5 + 0.1,
    }));
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: color,
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -30, 0, 20, 0],
            x: [0, 15, -15, 10, 0],
            opacity: [p.opacity, p.opacity * 1.5, p.opacity * 0.5, p.opacity],
            scale: [1, 1.2, 0.8, 1],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export function FogLayer() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <motion.div
        className="absolute w-[200%] h-[200%] -left-1/2 -top-1/2"
        style={{
          background: 'radial-gradient(ellipse at 30% 50%, rgba(75,60,110,0.15) 0%, transparent 50%)',
        }}
        animate={{ x: [0, 50, 0], y: [0, -30, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[200%] h-[200%] -left-1/2 -top-1/2"
        style={{
          background: 'radial-gradient(ellipse at 70% 60%, rgba(139,58,58,0.08) 0%, transparent 50%)',
        }}
        animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

export function LightningFlash({ trigger }: { trigger: boolean }) {
  return (
    <motion.div
      className="absolute inset-0 bg-white pointer-events-none z-50"
      initial={{ opacity: 0 }}
      animate={trigger ? { opacity: [0, 0.3, 0, 0.15, 0] } : { opacity: 0 }}
      transition={{ duration: 0.4, times: [0, 0.1, 0.3, 0.5, 1] }}
    />
  );
}

export function BloodSplatter({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-werewolf-red"
          style={{
            width: Math.random() * 20 + 5,
            height: Math.random() * 20 + 5,
            left: `${Math.random() * 80 + 10}%`,
            top: `${Math.random() * 80 + 10}%`,
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: [0, 1.5, 1], opacity: [1, 0.8, 0] }}
          transition={{ duration: 0.8, delay: i * 0.05 }}
        />
      ))}
    </div>
  );
}
