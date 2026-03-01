/**
 * AudioEvent — superset enum.
 *
 * String values are 1:1 with SolavineEvent so the engine can look up
 * SFX definitions by the same key.  Legacy scenes continue to import
 * `AudioEvent`; the AudioManager transparently forwards to SolavineEngine.
 */
export enum AudioEvent {
  /* === Original 13 (backward-compatible) === */
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

  /* === New: UI Sounds === */
  ButtonTap = 'button_tap',
  MenuOpen = 'menu_open',
  MenuClose = 'menu_close',
  ConceptDragStart = 'concept_drag_start',
  RecallPromptAppear = 'recall_prompt_appear',

  /* === New: State Transitions === */
  FailStateRumble = 'fail_state_rumble',
  RetryBootUp = 'retry_boot_up',

  /* === New: Rewards / Upgrades === */
  UpgradeCommon = 'upgrade_common',
  UpgradeRare = 'upgrade_rare',
  UpgradeLegendary = 'upgrade_legendary',
  AchievementEarned = 'achievement_earned',
  CoinCollect = 'coin_collect',

  /* === New: Encounter Ambience === */
  StormThunder = 'storm_thunder',
  RuinsEcho = 'ruins_echo',
  SquidHorn = 'squid_horn',
  CannonFire = 'cannon_fire',
  KrakenRoar = 'kraken_roar',

  /* === New: Navigation === */
  SailUnfurl = 'sail_unfurl',
  AnchorDrop = 'anchor_drop',
  MapRustle = 'map_rustle',
  WavesCrash = 'waves_crash',

  /* === New: Bit (Parrot) === */
  BitCelebrate = 'bit_celebrate',
  BitWingFlutter = 'bit_wing_flutter',

  /* === New: Combat === */
  CritHit = 'crit_hit',
  ShieldBlock = 'shield_block',
  HealChime = 'heal_chime',
  ComboHit = 'combo_hit',
}

/** 5-layer adaptive music system (adds 'urgency' channel) */
export type MusicLayerName = 'base' | 'rhythm' | 'tension' | 'urgency' | 'resolution';
