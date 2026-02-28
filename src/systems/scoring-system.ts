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

export function computeMaxPromptScore(promptCount: number): number {
  let total = 0;

  for (let index = 0; index < promptCount; index += 1) {
    const streak = index + 1;
    let comboMultiplier = 1;
    if (streak >= 4) {
      comboMultiplier = 2.5;
    } else if (streak === 3) {
      comboMultiplier = 2;
    } else if (streak === 2) {
      comboMultiplier = 1.5;
    }

    total += Math.floor(100 * 2 * comboMultiplier);
  }

  return total;
}
