import { motion, useAnimation } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { Role } from '@/types/game';
import { Shield, Eye, Skull, Sword, Crosshair, FlaskConical, Crown, Wand2, VenetianMask } from 'lucide-react';

interface WheelSegment {
  role: Role;
  label: string;
  color: string;
  darkColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SEGMENTS: WheelSegment[] = [
  { role: 'villager', label: 'Villager', color: '#60a5fa', darkColor: '#1e3a5f', icon: Shield },
  { role: 'seer', label: 'Seer', color: '#a78bfa', darkColor: '#3b2164', icon: Eye },
  { role: 'bodyguard', label: 'Bodyguard', color: '#22d3ee', darkColor: '#164e63', icon: Sword },
  { role: 'hunter', label: 'Hunter', color: '#fb923c', darkColor: '#7c2d12', icon: Crosshair },
  { role: 'witch', label: 'Witch', color: '#34d399', darkColor: '#064e3b', icon: FlaskConical },
  { role: 'werewolf', label: 'Werewolf', color: '#ef4444', darkColor: '#450a0a', icon: Skull },
  { role: 'alphaWolf', label: 'Alpha', color: '#dc2626', darkColor: '#450a0a', icon: Crown },
  { role: 'sorcerer', label: 'Sorcerer', color: '#818cf8', darkColor: '#312e81', icon: Wand2 },
  { role: 'minion', label: 'Minion', color: '#f472b6', darkColor: '#831843', icon: VenetianMask },
];

const WHEEL_SIZE = 400;
const CENTER = WHEEL_SIZE / 2;
const RADIUS = 180;
const INNER_RADIUS = 70;
const ICON_RADIUS = 130;
const LABEL_RADIUS = 95;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = (angleDeg - 90) * Math.PI / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    'M', cx, cy,
    'L', start.x, start.y,
    'A', r, r, 0, largeArcFlag, 0, end.x, end.y,
    'Z',
  ].join(' ');
}

interface SpinningWheelProps {
  targetRole: Role;
  onComplete?: () => void;
  spinning?: boolean;
}

export default function SpinningWheel({ targetRole, onComplete, spinning = false }: SpinningWheelProps) {
  const controls = useAnimation();
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showGlow, setShowGlow] = useState(false);
  const targetSettled = useRef(false);

  const numSegments = SEGMENTS.length;
  const arc = 360 / numSegments;

  const getSegmentIndex = useCallback((role: Role) => {
    return SEGMENTS.findIndex(s => s.role === role);
  }, []);

  const spin = useCallback(async () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setShowGlow(false);
    targetSettled.current = false;

    const targetIndex = getSegmentIndex(targetRole);
    const segmentCenter = (targetIndex + 0.5) * arc;
    const fullSpins = 5 + Math.floor(Math.random() * 3); // 5-7 full spins
    const targetRotation = fullSpins * 360 - segmentCenter;

    // Start fast spin
    await controls.start({
      rotate: targetRotation - 180,
      transition: { duration: 2.5, ease: 'circOut' },
    });

    // Slow down to target
    await controls.start({
      rotate: targetRotation,
      transition: { duration: 1.5, ease: [0.25, 1, 0.5, 1] },
    });

    setRotation(targetRotation);
    setIsSpinning(false);
    setShowGlow(true);
    targetSettled.current = true;

    setTimeout(() => {
      onComplete?.();
    }, 800);
  }, [controls, getSegmentIndex, isSpinning, onComplete, targetRole, arc]);

  useEffect(() => {
    if (spinning && !isSpinning) {
      spin();
    }
  }, [spinning, spin, isSpinning]);

  return (
    <div className="relative flex flex-col items-center">
      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-20">
        <motion.div
          className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-accent-gold"
          animate={showGlow ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-accent-gold rounded-full -translate-y-1" />
      </div>

      {/* Wheel container */}
      <div className="relative" style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}>
        {/* Outer glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: showGlow
              ? `0 0 60px ${SEGMENTS[getSegmentIndex(targetRole)]?.color}80, 0 0 120px ${SEGMENTS[getSegmentIndex(targetRole)]?.color}40`
              : '0 0 30px rgba(212,168,67,0.2)',
          }}
          animate={showGlow ? { opacity: [0.6, 1, 0.6] } : { opacity: 0.3 }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />

        {/* SVG Wheel */}
        <motion.svg
          width={WHEEL_SIZE}
          height={WHEEL_SIZE}
          viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
          animate={controls}
          initial={{ rotate: 0 }}
          style={{ transformOrigin: 'center' }}
        >
          {/* Center circle background */}
          <circle cx={CENTER} cy={CENTER} r={RADIUS + 4} fill="rgba(15,14,26,0.9)" stroke="rgba(212,168,67,0.3)" strokeWidth="2" />

          {SEGMENTS.map((seg, i) => {
            const startAngle = i * arc;
            const endAngle = (i + 1) * arc;
            const midAngle = startAngle + arc / 2;
            const path = describeArc(CENTER, CENTER, RADIUS, startAngle, endAngle);
            const iconPos = polarToCartesian(CENTER, CENTER, ICON_RADIUS, midAngle);
            const labelPos = polarToCartesian(CENTER, CENTER, LABEL_RADIUS, midAngle);
            const isTarget = seg.role === targetRole && showGlow;

            return (
              <g key={seg.role}>
                <path
                  d={path}
                  fill={isTarget ? seg.color + '40' : seg.darkColor + '90'}
                  stroke={isTarget ? seg.color : seg.color + '60'}
                  strokeWidth={isTarget ? 3 : 1}
                  className="transition-all"
                />
                {/* Segment divider lines */}
                <line
                  x1={CENTER}
                  y1={CENTER}
                  x2={polarToCartesian(CENTER, CENTER, RADIUS, startAngle).x}
                  y2={polarToCartesian(CENTER, CENTER, RADIUS, startAngle).y}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="1"
                />
                {/* Icon */}
                <foreignObject
                  x={iconPos.x - 12}
                  y={iconPos.y - 12}
                  width={24}
                  height={24}
                >
                  <div className={`flex items-center justify-center w-full h-full ${isTarget ? 'text-white' : 'text-white/60'}`}>
                    <seg.icon className="w-5 h-5" />
                  </div>
                </foreignObject>
                {/* Label */}
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isTarget ? '#fff' : 'rgba(255,255,255,0.5)'}
                  fontSize="10"
                  fontWeight={isTarget ? '700' : '500'}
                  style={{ textShadow: isTarget ? `0 0 10px ${seg.color}` : 'none' }}
                >
                  {seg.label}
                </text>
              </g>
            );
          })}

          {/* Inner circle */}
          <circle cx={CENTER} cy={CENTER} r={INNER_RADIUS} fill="#0f0e1a" stroke="rgba(212,168,67,0.4)" strokeWidth="2" />

          {/* Center hub text */}
          <text
            x={CENTER}
            y={CENTER - 5}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#d4a843"
            fontSize="14"
            fontWeight="bold"
            fontFamily="Cinzel"
          >
            ROLE
          </text>
          <text
            x={CENTER}
            y={CENTER + 14}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#d4a843"
            fontSize="10"
            opacity="0.7"
          >
            SPIN
          </text>
        </motion.svg>

        {/* Center hub decoration */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] rounded-full border-2 border-accent-gold/30 flex items-center justify-center"
          animate={{ rotate: isSpinning ? 360 : 0 }}
          transition={{ duration: isSpinning ? 0.5 : 0 }}
        >
          <motion.div
            className="w-3 h-3 rounded-full bg-accent-gold"
            animate={showGlow ? { scale: [1, 1.5, 1], boxShadow: ['0 0 10px rgba(212,168,67,0.5)', '0 0 30px rgba(212,168,67,0.8)', '0 0 10px rgba(212,168,67,0.5)'] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </motion.div>
      </div>

      {/* Spin button (only shown before spin) */}
      {!spinning && !showGlow && (
        <motion.button
          onClick={spin}
          whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(212,168,67,0.5)' }}
          whileTap={{ scale: 0.95 }}
          className="mt-6 bg-accent-gold hover:bg-accent-gold/90 text-[#1A1833] font-bold py-3 px-10 rounded-xl text-lg flex items-center gap-2"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          >
            <Sword className="w-5 h-5" />
          </motion.div>
          Spin the Wheel
        </motion.button>
      )}

      {/* Spinning indicator */}
      {isSpinning && (
        <motion.div
          className="mt-6 text-accent-gold font-bold text-lg flex items-center gap-2"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <motion.div
            className="w-3 h-3 rounded-full bg-accent-gold"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
          Spinning...
        </motion.div>
      )}
    </div>
  );
}
