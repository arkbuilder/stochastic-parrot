export function gradeFromRatio(ratio: number): 'S' | 'A' | 'B' | 'C' | 'D' {
  if (ratio >= 0.95) {
    return 'S';
  }
  if (ratio >= 0.8) {
    return 'A';
  }
  if (ratio >= 0.6) {
    return 'B';
  }
  if (ratio >= 0.4) {
    return 'C';
  }
  return 'D';
}

export function computeIslandScore(
  promptScore: number,
  coinsCollected: number,
  expertBonusEarned: boolean,
): number {
  return Math.floor(promptScore + coinsCollected * 5 + (expertBonusEarned ? 500 : 0));
}
