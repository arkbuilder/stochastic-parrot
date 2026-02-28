import type { Scene, SceneContext } from '../core/types';
import { ISLANDS } from '../data/islands';
import { CONCEPTS } from '../data/concepts';
import { createConceptCard, type ConceptCard, createLandmark, type LandmarkEntity, createParrot, createPlayer } from '../entities';
import type { InputAction } from '../input/types';
import { renderHud } from '../rendering/hud';
import { ParticleSystem } from '../rendering/particles';
import { TileMap, type TileMapLayout } from '../rendering/tile-map';
import { TOKENS } from '../rendering/tokens';
import { updateAnimationSystem } from '../systems/animation-system';
import { type EncodeRuntimeState, updateEncodeSystem } from '../systems/encode-system';
import { updateMovementSystem } from '../systems/movement-system';
import { AudioEvent } from '../audio/types';
import type { AudioManager } from '../audio/audio-manager';
import type { TelemetryClient } from '../telemetry/telemetry-client';
import { TELEMETRY_EVENTS } from '../telemetry/events';
import type { EncounterStartData } from './flow-types';
import { distance } from '../utils/math';

interface IslandSceneDeps {
  islandId: string;
  onThreatTriggered: (data: EncounterStartData) => void;
  telemetry: TelemetryClient;
  audio: AudioManager;
}

type IslandPhase = 'island_arrive' | 'exploring' | 'encoding' | 'threat_triggered';

export class IslandScene implements Scene {
  private readonly island: (typeof ISLANDS)[number];
  private readonly player = createPlayer(24, 332);
  private readonly parrot = createParrot(18, 320);
  private readonly landmarks: LandmarkEntity[];
  private readonly conceptCards: ConceptCard[];
  private readonly particles = new ParticleSystem();
  private readonly encodeRuntime: EncodeRuntimeState = { heldCardId: null };

  private phase: IslandPhase = 'island_arrive';
  private nowMs = 0;
  private arrivalElapsed = 0;
  private firstPlaced = false;
  private firstInputSeen = false;
  private tileMap = new TileMap(fallbackLayout);
  private threatSent = false;

  constructor(private readonly deps: IslandSceneDeps) {
    const island = ISLANDS.find((entry) => entry.id === deps.islandId);
    if (!island) {
      throw new Error(`Island configuration missing: ${deps.islandId}`);
    }

    this.island = island;

    this.landmarks = this.island.landmarks.map((landmark) =>
      createLandmark(landmark.id, landmark.conceptId, landmark.x, landmark.y),
    );

    this.conceptCards = this.island.conceptIds.map((conceptId, index) => {
      const concept = CONCEPTS.find((entry) => entry.id === conceptId);
      const name = concept?.name ?? conceptId;
      const iconGlyph = name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      return createConceptCard(
        `card_${conceptId}`,
        conceptId,
        name,
        iconGlyph,
        12 + index * 76,
        352,
      );
    });
  }

  enter(context: SceneContext): void {
    void context;
    this.phase = 'island_arrive';
    this.arrivalElapsed = 0;
    this.nowMs = 0;
    this.firstPlaced = false;
    this.firstInputSeen = false;
    this.threatSent = false;
    void this.loadLayout();

    this.deps.telemetry.emit(TELEMETRY_EVENTS.onboardingStart, { island_id: this.island.id });
    this.deps.telemetry.emit(TELEMETRY_EVENTS.islandArrived, { island_id: this.island.id });
    this.deps.audio.setMusicLayers(['base', 'rhythm']);
  }

  exit(): void {}

  update(dt: number, actions: InputAction[]): void {
    this.nowMs += dt * 1000;

    if (!this.firstInputSeen && actions.length > 0) {
      this.firstInputSeen = true;
      this.deps.telemetry.emit(TELEMETRY_EVENTS.firstInput, { input_count: actions.length });
    }

    if (this.phase === 'island_arrive') {
      this.arrivalElapsed += dt;
      if (this.arrivalElapsed >= 0.7) {
        this.phase = 'exploring';
      }
      return;
    }

    if (this.phase === 'threat_triggered') {
      return;
    }

    this.phase = 'encoding';
    updateMovementSystem(this.player, this.parrot, actions, dt);
    this.unlockConceptCardsByProximity();

    const encodeEvents = updateEncodeSystem(this.conceptCards, this.landmarks, actions, this.encodeRuntime);

    for (const event of encodeEvents) {
      if (event.type === 'concept_placed') {
        this.deps.audio.play(AudioEvent.ConceptPlaced);
        this.particles.emitSparkle(this.player.position.x, this.player.position.y - 8);
        this.deps.telemetry.emit(TELEMETRY_EVENTS.conceptPlaced, {
          island_id: this.island.id,
          concept_id: event.conceptId,
          landmark_id: event.landmarkId,
          encode_duration_ms: this.nowMs,
        });

        if (!this.firstPlaced) {
          this.firstPlaced = true;
          this.deps.telemetry.emit(TELEMETRY_EVENTS.firstSuccessCoreVerb, {
            core_verb: 'place',
            island_id: this.island.id,
          });
        }
      }
    }

    updateAnimationSystem(this.player, this.parrot, this.landmarks, this.conceptCards, dt);
    this.particles.update(dt);

    if (this.conceptCards.every((card) => card.state.placed)) {
      this.triggerThreat();
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.tileMap.render(ctx);

    for (const landmark of this.landmarks) {
      ctx.fillStyle = landmark.state.placedConceptId ? '#facc15' : '#22d3ee';
      ctx.fillRect(landmark.position.x - 10, landmark.position.y - 10, 20, 20);

      if (landmark.state.lockTimer > 0) {
        ctx.strokeStyle = '#4ade80';
        ctx.strokeRect(landmark.position.x - 13, landmark.position.y - 13, 26, 26);
      }
    }

    for (const card of this.conceptCards) {
      if (!card.state.unlocked || card.state.placed || !card.state.dragging) {
        continue;
      }

      ctx.fillStyle = '#1f2937';
      ctx.fillRect(card.position.x, card.position.y, card.bounds.w, card.bounds.h);
      ctx.strokeStyle = '#22d3ee';
      ctx.strokeRect(card.position.x, card.position.y, card.bounds.w, card.bounds.h);
      ctx.fillStyle = '#e5e7eb';
      ctx.font = TOKENS.fontSmall;
      ctx.textAlign = 'center';
      ctx.fillText(card.state.iconGlyph, card.position.x + card.bounds.w / 2, card.position.y + 18);
    }

    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(this.player.position.x - 8, this.player.position.y - 8, 16, 16);

    ctx.fillStyle = '#4ade80';
    ctx.fillRect(this.parrot.position.x - 4, this.parrot.position.y - 4, 8, 8);

    this.particles.render(ctx);

    renderHud(ctx, {
      phase: 'encoding',
      conceptCards: this.conceptCards.filter((card) => card.state.unlocked),
      landmarks: this.landmarks,
      timerRatio: 1,
      healthRatio: 1,
      score: 0,
      attemptsUsed: 0,
    });

    if (this.phase === 'island_arrive') {
      ctx.fillStyle = '#e5e7eb';
      ctx.font = TOKENS.fontSmall;
      ctx.textAlign = 'center';
      ctx.fillText(this.island.name, 120, 200);
    }
  }

  private unlockConceptCardsByProximity(): void {
    const nextCard = this.conceptCards.find((card) => !card.state.unlocked);
    if (!nextCard) {
      return;
    }

    const targetLandmark = this.landmarks.find((landmark) => landmark.state.conceptId === nextCard.state.conceptId);
    if (!targetLandmark) {
      return;
    }

    if (distance(this.player.position, targetLandmark.position) <= 40) {
      nextCard.state.unlocked = true;
      nextCard.state.appearedAtMs = this.nowMs;
    }
  }

  private async loadLayout(): Promise<void> {
    try {
      this.tileMap = await TileMap.load(`/layouts/${this.island.id}/layout.json`);
    } catch {
      this.tileMap = new TileMap(fallbackLayout);
    }
  }

  debugForceCompleteEncoding(): void {
    for (const card of this.conceptCards) {
      card.state.unlocked = true;
      card.state.placed = true;
      card.state.dragging = false;

      const targetLandmark = this.landmarks.find((landmark) => landmark.state.conceptId === card.state.conceptId);
      if (!targetLandmark) {
        continue;
      }

      targetLandmark.state.placedConceptId = card.state.conceptId;
      targetLandmark.state.lockTimer = 0.5;
      card.position.x = targetLandmark.position.x - card.bounds.w / 2;
      card.position.y = targetLandmark.position.y + 10;
    }

    this.triggerThreat();
  }

  private triggerThreat(): void {
    if (this.threatSent) {
      return;
    }

    this.threatSent = true;
    this.phase = 'threat_triggered';
    this.deps.telemetry.emit(TELEMETRY_EVENTS.encodePhaseComplete, {
      island_id: this.island.id,
      concepts_count: this.conceptCards.length,
      total_encode_ms: this.nowMs,
    });
    this.deps.telemetry.emit(TELEMETRY_EVENTS.islandEncodingComplete, {
      island_id: this.island.id,
      concepts_placed: this.conceptCards.length,
      encode_total_ms: this.nowMs,
    });

    this.deps.onThreatTriggered({
      islandId: this.island.id,
      encounterType: this.island.encounterType,
      landmarks: this.landmarks.map((landmark) => ({
        ...landmark,
        state: { ...landmark.state },
        position: { ...landmark.position },
        bounds: { ...landmark.bounds },
      })),
      placedConceptIds: this.conceptCards.map((card) => card.state.conceptId),
      startedAtMs: this.nowMs,
      activeUpgrades: [],
    });
  }
}

const fallbackLayout: TileMapLayout = {
  tileSize: 16,
  width: 15,
  height: 25,
  rows: Array.from({ length: 25 }, (_v, index) => {
    if (index < 3 || index > 22) {
      return 'WWWWWWWWWWWWWWW';
    }
    return 'WSSGGGGGGGGSSWW';
  }),
};
