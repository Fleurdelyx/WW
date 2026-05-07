import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Skull, Vote, MessageCircle, Sparkles, Swords } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'death' | 'vote' | 'system' | 'chat' | 'action' | 'win';
}

const icons = {
  death: Skull,
  vote: Vote,
  system: AlertTriangle,
  chat: MessageCircle,
  action: Swords,
  win: Sparkles,
};

const colors = {
  death: 'border-werewolf-red/50 bg-werewolf-red/10 text-werewolf-red',
  vote: 'border-accent-gold/50 bg-accent-gold/10 text-accent-gold',
  system: 'border-accent-blue/50 bg-accent-blue/10 text-accent-blue',
  chat: 'border-accent-purple/50 bg-accent-purple/10 text-accent-purple',
  action: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
  win: 'border-accent-gold/50 bg-accent-gold/10 text-accent-gold',
};

export function ToastItem({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  const Icon = icons[toast.type];

  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.8 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-lg ${colors[toast.type]}`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="text-sm font-medium">{toast.message}</span>
    </motion.div>
  );
}

export function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDone={() => onRemove(t.id)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: Toast['type'] = 'system') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, addToast, removeToast };
}
