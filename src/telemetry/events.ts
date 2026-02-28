export const TELEMETRY_EVENTS = {
  onboardingStart: 'onboarding_start',
  firstInput: 'first_input',
  firstSuccessCoreVerb: 'first_success_core_verb',
  firstFail: 'first_fail',
  retryStart: 'retry_start',
  rewardSeen: 'reward_seen',
  rewardCollected: 'reward_collected',
  rewardUsed: 'reward_used',
  beatCompleted: 'beat_completed',
  secretFound: 'secret_found',
  onboardingComplete: 'onboarding_complete',
  quit: 'quit',
  conceptPlaced: 'concept_placed',
  recallPrompted: 'recall_prompted',
  recallAnswered: 'recall_answered',
  recallTimeout: 'recall_timeout',
  encodePhaseComplete: 'encode_phase_complete',
  recallPhaseComplete: 'recall_phase_complete',
} as const;

export type TelemetryEventName = (typeof TELEMETRY_EVENTS)[keyof typeof TELEMETRY_EVENTS];

export interface TelemetryEvent {
  eventName: TelemetryEventName;
  payload: Record<string, unknown>;
  ts: string;
}
