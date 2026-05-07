import { motion } from 'framer-motion';

export default function CountdownRing({ seconds, maxSeconds, size = 80, strokeWidth = 6 }: {
  seconds: number;
  maxSeconds: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.max(0, seconds / maxSeconds);
  const dashoffset = circumference * (1 - progress);

  const isUrgent = seconds <= 10;
  const isWarning = seconds <= 30;

  const color = isUrgent ? '#ef4444' : isWarning ? '#f59e0b' : '#d4a843';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: dashoffset }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.span
          className="font-mono font-bold text-lg"
          style={{ color }}
          animate={isUrgent ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={{ duration: 0.5, repeat: isUrgent ? Infinity : 0 }}
        >
          {seconds}
        </motion.span>
      </div>
    </div>
  );
}
