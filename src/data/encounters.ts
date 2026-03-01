export interface EncounterTemplate {
  id: string;
  type: 'fog' | 'storm' | 'battle' | 'ruins' | 'squid';
  promptCount: number;
  timeWindowMs: number;
  timeDecayPerPromptMs: number;
  noviceAssistThreshold: number;
  assistStrength: 'subtle' | 'medium' | 'obvious';
  expertParTimeMs: number;
}

export const ENCOUNTERS: EncounterTemplate[] = [
  {
    id: 'cursed_fog',
    type: 'fog',
    promptCount: 3,
    timeWindowMs: 12000,
    timeDecayPerPromptMs: 500,
    noviceAssistThreshold: 2,
    assistStrength: 'medium',
    expertParTimeMs: 17000,
  },
  {
    id: 'storm',
    type: 'storm',
    promptCount: 3,
    timeWindowMs: 9000,
    timeDecayPerPromptMs: 800,
    noviceAssistThreshold: 2,
    assistStrength: 'medium',
    expertParTimeMs: 15000,
  },
  {
    id: 'rival_battle',
    type: 'battle',
    promptCount: 3,
    timeWindowMs: 8000,
    timeDecayPerPromptMs: 750,
    noviceAssistThreshold: 2,
    assistStrength: 'subtle',
    expertParTimeMs: 14000,
  },
  {
    id: 'ruins',
    type: 'ruins',
    promptCount: 3,
    timeWindowMs: 10000,
    timeDecayPerPromptMs: 600,
    noviceAssistThreshold: 2,
    assistStrength: 'obvious',
    expertParTimeMs: 16000,
  },
  {
    id: 'giant_squid',
    type: 'squid',
    promptCount: 5,
    timeWindowMs: 8000,
    timeDecayPerPromptMs: 500,
    noviceAssistThreshold: 2,
    assistStrength: 'obvious',
    expertParTimeMs: 25000,
  },
];
