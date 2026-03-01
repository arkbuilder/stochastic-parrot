export enum AudioEvent {
  ConceptPlaced = 'concept_placed',
  RecallCorrect = 'recall_correct',
  RecallIncorrect = 'recall_incorrect',
  RecallTimeout = 'recall_timeout',
  FogAdvance = 'fog_advance',
  FogPushBack = 'fog_push_back',
  ChartFragmentEarned = 'chart_fragment_earned',
  BitChirp = 'bit_chirp',
  NemoFootstep = 'nemo_footstep',
  CurtainOpen = 'curtain_open',
  TypewriterTick = 'typewriter_tick',
  EnemyBurrow = 'enemy_burrow',
  FreezeBlast = 'freeze_blast',
}

export type MusicLayerName = 'base' | 'rhythm' | 'tension' | 'resolution';
