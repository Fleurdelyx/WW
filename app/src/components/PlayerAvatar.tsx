import type { PlayerAvatar as PlayerAvatarType } from '@/types/game';
import { Shield, Sword, Heart, Star, Moon, Sun, Flame, Snowflake, Zap, Anchor, Crown, Key, Bell, Feather, Gem, Skull } from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield, Sword, Heart, Star, Moon, Sun, Flame, Snowflake, Zap, Anchor, Crown, Key, Bell, Feather, Gem, Skull,
};

interface PlayerAvatarProps {
  avatar: PlayerAvatarType;
  size?: 'sm' | 'md' | 'lg';
  isDead?: boolean;
  className?: string;
}

export default function PlayerAvatar({ avatar, size = 'md', isDead = false, className }: PlayerAvatarProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  const Icon = isDead ? Skull : (iconMap[avatar.icon] || Shield);

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center border',
        sizeClasses[size],
        avatar.bg,
        avatar.text,
        avatar.border,
        className
      )}
    >
      <Icon className={iconSizes[size]} />
    </div>
  );
}
