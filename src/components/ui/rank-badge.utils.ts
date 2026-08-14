import type { RankType } from './rank-badge';

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
