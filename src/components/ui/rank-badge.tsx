import * as React from 'react';
import { cn } from '@/lib/utils';
import { Trophy, Medal, Award, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

export type RankType = 'gold' | 'silver' | 'bronze' | 'none';
export type RankSize = 'sm' | 'md' | 'lg';

interface RankBadgeProps {
  rank: RankType;
  size?: RankSize;
  label?: string;
  value?: string | number;
  showIcon?: boolean;
  showTrend?: 'up' | 'down' | 'neutral';
  animate?: boolean;
  className?: string;
}

const rankConfig = {
  gold: {
    icon: Trophy,
    label: 'Ouro',
    className: 'rank-gold',
    glowClass: 'glow-coins',
  },
  silver: {
    icon: Medal,
    label: 'Prata',
    className: 'rank-silver',
    glowClass: '',
  },
  bronze: {
    icon: Award,
    label: 'Bronze',
    className: 'rank-bronze',
    glowClass: '',
  },
  none: {
    icon: Award,
    label: 'Sem ranking',
    className: 'bg-muted text-muted-foreground',
    glowClass: '',
  },
};

const sizeConfig = {
  sm: {
    container: 'px-2 py-1 text-xs gap-1',
    icon: 'h-3 w-3',
  },
  md: {
    container: 'px-3 py-1.5 text-sm gap-1.5',
    icon: 'h-4 w-4',
  },
  lg: {
    container: 'px-4 py-2 text-base gap-2',
    icon: 'h-5 w-5',
  },
};

export function RankBadge({
  rank,
  size = 'md',
  label,
  value,
  showIcon = true,
  showTrend,
  animate = true,
  className,
}: RankBadgeProps) {
  const config = rankConfig[rank];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  const TrendIcon = showTrend === 'up' 
    ? TrendingUp 
    : showTrend === 'down' 
      ? TrendingDown 
      : Minus;

  const content = (
    <span
      className={cn(
        'inline-flex items-center rounded-lg font-semibold transition-all duration-200',
        sizeStyles.container,
        config.className,
        animate && rank === 'gold' && 'hover:animate-wiggle',
        className
      )}
    >
      {showIcon && <Icon className={cn(sizeStyles.icon, 'shrink-0')} />}
      <span>{label || config.label}</span>
      {value && (
        <span className="font-bold ml-0.5">{value}</span>
      )}
      {showTrend && (
        <TrendIcon className={cn(
          sizeStyles.icon,
          'shrink-0 ml-0.5',
          showTrend === 'up' && 'text-success',
          showTrend === 'down' && 'text-destructive',
        )} />
      )}
    </span>
  );

  if (animate && rank !== 'none') {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className="inline-flex"
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

// Utility function to determine rank based on score/percentage
export function getRankFromScore(score: number, thresholds = { gold: 90, silver: 70, bronze: 50 }): RankType {
  if (score >= thresholds.gold) return 'gold';
  if (score >= thresholds.silver) return 'silver';
  if (score >= thresholds.bronze) return 'bronze';
  return 'none';
}

// Utility function to determine rank based on position
export function getRankFromPosition(position: number): RankType {
  if (position === 1) return 'gold';
  if (position === 2) return 'silver';
  if (position === 3) return 'bronze';
  return 'none';
}

// Rank Badge with position number
interface PositionBadgeProps {
  position: number;
  size?: RankSize;
  label?: string;
  showIcon?: boolean;
  animate?: boolean;
  className?: string;
}

export function PositionBadge({
  position,
  size = 'md',
  label,
  showIcon = true,
  animate = true,
  className,
}: PositionBadgeProps) {
  const rank = getRankFromPosition(position);
  
  return (
    <RankBadge
      rank={rank}
      size={size}
      label={label || `${position}º`}
      showIcon={showIcon}
      animate={animate}
      className={className}
    />
  );
}

// Financial Performance Badge
interface FinancialRankBadgeProps {
  type: 'receita' | 'margem' | 'adimplencia' | 'crescimento';
  value: number;
  size?: RankSize;
  showTrend?: 'up' | 'down' | 'neutral';
  animate?: boolean;
  className?: string;
}

const financialThresholds = {
  receita: { gold: 100000, silver: 50000, bronze: 20000 }, // valores em R$
  margem: { gold: 30, silver: 20, bronze: 10 }, // percentual
  adimplencia: { gold: 95, silver: 85, bronze: 70 }, // percentual
  crescimento: { gold: 20, silver: 10, bronze: 5 }, // percentual
};

const financialLabels = {
  receita: 'Receita',
  margem: 'Margem',
  adimplencia: 'Adimplência',
  crescimento: 'Crescimento',
};

export function FinancialRankBadge({
  type,
  value,
  size = 'md',
  showTrend,
  animate = true,
  className,
}: FinancialRankBadgeProps) {
  const thresholds = financialThresholds[type];
  const rank = getRankFromScore(value, thresholds);
  
  const formattedValue = type === 'receita' 
    ? `R$ ${(value / 1000).toFixed(0)}k`
    : `${value.toFixed(1)}%`;
  
  return (
    <RankBadge
      rank={rank}
      size={size}
      label={financialLabels[type]}
      value={formattedValue}
      showTrend={showTrend}
      animate={animate}
      className={className}
    />
  );
}

// Rank Legend Component
interface RankLegendProps {
  className?: string;
}

export function RankLegend({ className }: RankLegendProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <RankBadge rank="gold" size="sm" animate={false} />
      <RankBadge rank="silver" size="sm" animate={false} />
      <RankBadge rank="bronze" size="sm" animate={false} />
    </div>
  );
}
