export interface RecallPrompt {
  id: string;
  conceptId: string;
  correctLandmarkId: string;
}

export interface RecallState {
  prompts: RecallPrompt[];
  currentPromptIndex: number;
  attemptsForCurrentPrompt: number;
  firstAttemptStreak: number;
  totalScore: number;
  timedOut: boolean;
  promptTimeRemainingMs: number;
  promptMaxTimeMs: number;
  completed: boolean;
}

export interface RecallAnswerResult {
  correct: boolean;
  expectedLandmarkId: string;
  selectedLandmarkId: string;
  scoreAwarded: number;
  speedMultiplier: number;
  comboMultiplier: number;
  promptComplete: boolean;
  sequenceComplete: boolean;
}

export function createRecallState(prompts: RecallPrompt[], promptWindowMs: number): RecallState {
  return {
    prompts,
    currentPromptIndex: 0,
    attemptsForCurrentPrompt: 0,
    firstAttemptStreak: 0,
    totalScore: 0,
    timedOut: false,
    promptTimeRemainingMs: promptWindowMs,
    promptMaxTimeMs: promptWindowMs,
    completed: false,
  };
}

export function tickRecallState(state: RecallState, dtMs: number): void {
  if (state.completed) {
    return;
  }

  state.promptTimeRemainingMs = Math.max(0, state.promptTimeRemainingMs - dtMs);
  state.timedOut = state.promptTimeRemainingMs === 0;
}

export function calculateSpeedMultiplier(responseMs: number): number {
  if (responseMs <= 3_000) {
    return 2.0;
  }
  if (responseMs <= 5_000) {
    return 1.5;
  }
  if (responseMs <= 8_000) {
    return 1.2;
  }
  return 1.0;
}

export function calculateComboMultiplier(streak: number): number {
  if (streak >= 4) {
    return 2.5;
  }
  if (streak === 3) {
    return 2.0;
  }
  if (streak === 2) {
    return 1.5;
  }
  return 1.0;
}

export function calculateBasePoints(attempt: number): number {
  if (attempt <= 1) {
    return 100;
  }
  if (attempt === 2) {
    return 50;
  }
  return 25;
}

export function answerRecall(
  state: RecallState,
  selectedLandmarkId: string,
  responseMs: number,
): RecallAnswerResult {
  const prompt = state.prompts[state.currentPromptIndex];
  if (!prompt) {
    return {
      correct: false,
      expectedLandmarkId: '',
      selectedLandmarkId,
      scoreAwarded: 0,
      speedMultiplier: 1,
      comboMultiplier: 1,
      promptComplete: false,
      sequenceComplete: true,
    };
  }

  state.attemptsForCurrentPrompt += 1;
  const attempt = state.attemptsForCurrentPrompt;
  const correct = selectedLandmarkId === prompt.correctLandmarkId;

  if (!correct) {
    state.firstAttemptStreak = 0;
    return {
      correct,
      expectedLandmarkId: prompt.correctLandmarkId,
      selectedLandmarkId,
      scoreAwarded: 0,
      speedMultiplier: 1,
      comboMultiplier: 1,
      promptComplete: false,
      sequenceComplete: false,
    };
  }

  if (attempt === 1) {
    state.firstAttemptStreak += 1;
  }

  const base = calculateBasePoints(attempt);
  const speed = calculateSpeedMultiplier(responseMs);
  const combo = calculateComboMultiplier(state.firstAttemptStreak);
  const scoreAwarded = Math.floor(base * speed * combo);

  state.totalScore += scoreAwarded;
  state.currentPromptIndex += 1;
  state.attemptsForCurrentPrompt = 0;
  state.promptTimeRemainingMs = state.promptMaxTimeMs;
  state.timedOut = false;

  if (state.currentPromptIndex >= state.prompts.length) {
    state.completed = true;
  }

  return {
    correct,
    expectedLandmarkId: prompt.correctLandmarkId,
    selectedLandmarkId,
    scoreAwarded,
    speedMultiplier: speed,
    comboMultiplier: combo,
    promptComplete: true,
    sequenceComplete: state.completed,
  };
}
