import type { Scene, SceneContext } from '../core/types';
import type { InputAction } from '../input/types';
import { TOKENS } from '../rendering/tokens';
import type { AccessibilitySettings, MasteryLevel } from '../persistence/types';

export interface ConceptJournalEntry {
  conceptId: string;
  conceptName: string;
  islandId: string;
  masteryLevel: MasteryLevel;
  recallCount: number;
}

interface PauseSceneDeps {
  getSettings: () => AccessibilitySettings;
  onSettingsChange: (settings: AccessibilitySettings) => void;
  getJournalEntries: () => ConceptJournalEntry[];
  onJournalViewed?: (visibleConceptIds: string[]) => void;
  onResume: () => void;
  onQuit: () => void;
}

type PauseView = 'menu' | 'journal' | 'settings';
type MenuItem = 'resume' | 'journal' | 'settings' | 'quit';

type SettingItem =
  | { id: 'reduced_motion'; label: string; kind: 'toggle'; get: (s: AccessibilitySettings) => boolean; set: (s: AccessibilitySettings, value: boolean) => AccessibilitySettings }
  | { id: 'high_contrast'; label: string; kind: 'toggle'; get: (s: AccessibilitySettings) => boolean; set: (s: AccessibilitySettings, value: boolean) => AccessibilitySettings }
  | { id: 'visual_only'; label: string; kind: 'toggle'; get: (s: AccessibilitySettings) => boolean; set: (s: AccessibilitySettings, value: boolean) => AccessibilitySettings }
  | { id: 'mute_all'; label: string; kind: 'toggle'; get: (s: AccessibilitySettings) => boolean; set: (s: AccessibilitySettings, value: boolean) => AccessibilitySettings }
  | { id: 'master'; label: string; kind: 'slider'; get: (s: AccessibilitySettings) => number; set: (s: AccessibilitySettings, value: number) => AccessibilitySettings }
  | { id: 'music'; label: string; kind: 'slider'; get: (s: AccessibilitySettings) => number; set: (s: AccessibilitySettings, value: number) => AccessibilitySettings }
  | { id: 'sfx'; label: string; kind: 'slider'; get: (s: AccessibilitySettings) => number; set: (s: AccessibilitySettings, value: number) => AccessibilitySettings }
  | { id: 'back'; label: string; kind: 'action' };

const PANEL = { x: 16, y: 36, w: 208, h: 328 };
const MENU_ROWS: Array<{ item: MenuItem; label: string; rect: { x: number; y: number; w: number; h: number } }> = [
  { item: 'resume', label: 'RESUME', rect: { x: 42, y: 108, w: 156, h: 34 } },
  { item: 'journal', label: 'CONCEPT JOURNAL', rect: { x: 42, y: 152, w: 156, h: 34 } },
  { item: 'settings', label: 'SETTINGS', rect: { x: 42, y: 196, w: 156, h: 34 } },
  { item: 'quit', label: 'QUIT TO OVERWORLD', rect: { x: 42, y: 240, w: 156, h: 34 } },
];

const JOURNAL_PREV = { x: 42, y: 322, w: 62, h: 24 };
const JOURNAL_NEXT = { x: 136, y: 322, w: 62, h: 24 };

const SETTING_ROWS_START_Y = 92;
const SETTING_ROW_H = 28;

const SETTING_ITEMS: SettingItem[] = [
  {
    id: 'reduced_motion',
    label: 'REDUCED MOTION',
    kind: 'toggle',
    get: (s) => s.reducedMotion,
    set: (s, value) => ({ ...s, reducedMotion: value }),
  },
  {
    id: 'high_contrast',
    label: 'HIGH CONTRAST',
    kind: 'toggle',
    get: (s) => s.highContrast,
    set: (s, value) => ({ ...s, highContrast: value }),
  },
  {
    id: 'visual_only',
    label: 'VISUAL ONLY',
    kind: 'toggle',
    get: (s) => s.visualOnlyMode,
    set: (s, value) => ({ ...s, visualOnlyMode: value, muteAll: value ? true : s.muteAll }),
  },
  {
    id: 'mute_all',
    label: 'MUTE ALL',
    kind: 'toggle',
    get: (s) => s.muteAll,
    set: (s, value) => ({ ...s, muteAll: value, visualOnlyMode: value ? s.visualOnlyMode : s.visualOnlyMode }),
  },
  {
    id: 'master',
    label: 'MASTER VOL',
    kind: 'slider',
    get: (s) => s.masterVolume,
    set: (s, value) => ({ ...s, masterVolume: clamp01(value) }),
  },
  {
    id: 'music',
    label: 'MUSIC VOL',
    kind: 'slider',
    get: (s) => s.musicVolume,
    set: (s, value) => ({ ...s, musicVolume: clamp01(value) }),
  },
  {
    id: 'sfx',
    label: 'SFX VOL',
    kind: 'slider',
    get: (s) => s.sfxVolume,
    set: (s, value) => ({ ...s, sfxVolume: clamp01(value) }),
  },
  { id: 'back', label: 'BACK', kind: 'action' },
];

const MASTERY_LABELS: Record<MasteryLevel, string> = {
  discovered: 'DISC',
  placed: 'PLACED',
  recalled: 'RECALL',
  mastered: 'MASTER',
};

const MASTERY_COLORS: Record<MasteryLevel, string> = {
  discovered: '#64748b',
  placed: '#22d3ee',
  recalled: '#facc15',
  mastered: '#f59e0b',
};

export class PauseScene implements Scene {
  private view: PauseView = 'menu';
  private selectedMenuIndex = 0;
  private selectedSettingIndex = 0;
  private journalPage = 0;

  constructor(private readonly deps: PauseSceneDeps) {}

  enter(context: SceneContext): void {
    void context;
  }

  exit(): void {}

  update(_dt: number, actions: InputAction[]): void {
    for (const action of actions) {
      if (action.type === 'pause') {
        if (this.view === 'menu') {
          this.deps.onResume();
        } else {
          this.view = 'menu';
        }
        return;
      }

      if (action.type === 'move') {
        this.handleMoveAction(action.dx, action.dy);
        continue;
      }

      if (action.type !== 'primary') {
        continue;
      }

      if (this.view === 'menu') {
        this.handleMenuPrimary(action);
      } else if (this.view === 'journal') {
        this.handleJournalPrimary(action);
      } else {
        this.handleSettingsPrimary(action);
      }
      return;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(2, 6, 23, 0.82)';
    ctx.fillRect(0, 0, 240, 400);

    ctx.fillStyle = '#111827';
    ctx.fillRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h);
    ctx.strokeStyle = TOKENS.colorCyan400;
    ctx.strokeRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h);

    ctx.fillStyle = TOKENS.colorYellow400;
    ctx.font = TOKENS.fontMedium;
    ctx.textAlign = 'center';
    ctx.fillText(this.view === 'menu' ? 'PAUSED' : this.view === 'journal' ? 'CONCEPT JOURNAL' : 'SETTINGS', 120, 68);

    if (this.view === 'menu') {
      this.renderMenu(ctx);
    } else if (this.view === 'journal') {
      this.renderJournal(ctx);
    } else {
      this.renderSettings(ctx);
    }

    ctx.fillStyle = TOKENS.colorText;
    ctx.font = TOKENS.fontSmall;
    ctx.fillText('ESC TO BACK/RESUME', 120, 356);
  }

  private handleMoveAction(dx: number, dy: number): void {
    if (this.view === 'menu') {
      if (dy !== 0) {
        this.selectedMenuIndex = mod(this.selectedMenuIndex + Math.sign(dy), MENU_ROWS.length);
      }
      return;
    }

    if (this.view === 'journal') {
      if (dx !== 0) {
        const nextPage = this.journalPage + Math.sign(dx);
        this.journalPage = clamp(nextPage, 0, Math.max(0, this.pageCount - 1));
      }
      return;
    }

    if (dy !== 0) {
      this.selectedSettingIndex = mod(this.selectedSettingIndex + Math.sign(dy), SETTING_ITEMS.length);
      return;
    }

    if (dx !== 0) {
      this.adjustSelectedSetting(Math.sign(dx) * 0.1);
    }
  }

  private handleMenuPrimary(action: Extract<InputAction, { type: 'primary' }>): void {
    const selected = Number.isNaN(action.x)
      ? MENU_ROWS[this.selectedMenuIndex]
      : MENU_ROWS.find((row) => inRect(action.x, action.y, row.rect));

    if (!selected) {
      return;
    }

    this.selectedMenuIndex = MENU_ROWS.findIndex((row) => row.item === selected.item);

    if (selected.item === 'resume') {
      this.deps.onResume();
      return;
    }

    if (selected.item === 'journal') {
      this.view = 'journal';
      this.deps.onJournalViewed?.(this.currentJournalPage.map((entry) => entry.conceptId));
      return;
    }

    if (selected.item === 'settings') {
      this.view = 'settings';
      return;
    }

    this.deps.onQuit();
  }

  private handleJournalPrimary(action: Extract<InputAction, { type: 'primary' }>): void {
    if (Number.isNaN(action.x)) {
      this.view = 'menu';
      return;
    }

    if (inRect(action.x, action.y, JOURNAL_PREV)) {
      this.journalPage = clamp(this.journalPage - 1, 0, Math.max(0, this.pageCount - 1));
      return;
    }

    if (inRect(action.x, action.y, JOURNAL_NEXT)) {
      this.journalPage = clamp(this.journalPage + 1, 0, Math.max(0, this.pageCount - 1));
      return;
    }

    this.view = 'menu';
  }

  private handleSettingsPrimary(action: Extract<InputAction, { type: 'primary' }>): void {
    if (Number.isNaN(action.x)) {
      this.activateSelectedSetting();
      return;
    }

    const index = this.pickSettingIndex(action.x, action.y);
    if (index === -1) {
      this.view = 'menu';
      return;
    }

    this.selectedSettingIndex = index;
    const setting = SETTING_ITEMS[index];
    if (!setting) {
      return;
    }

    if (setting.kind === 'slider') {
      const sliderX = 120;
      const sliderW = 86;
      const ratio = clamp01((action.x - sliderX) / sliderW);
      this.applySetting((current) => setting.set(current, ratio));
      return;
    }

    if (setting.kind === 'toggle') {
      const next = !setting.get(this.deps.getSettings());
      this.applySetting((current) => setting.set(current, next));
      return;
    }

    this.view = 'menu';
  }

  private renderMenu(ctx: CanvasRenderingContext2D): void {
    for (let index = 0; index < MENU_ROWS.length; index += 1) {
      const row = MENU_ROWS[index];
      if (!row) {
        continue;
      }

      const selected = index === this.selectedMenuIndex;
      ctx.fillStyle = selected ? '#1f2937' : '#0b1220';
      ctx.fillRect(row.rect.x, row.rect.y, row.rect.w, row.rect.h);
      ctx.strokeStyle = selected ? TOKENS.colorYellow400 : TOKENS.colorCyan400;
      ctx.strokeRect(row.rect.x, row.rect.y, row.rect.w, row.rect.h);

      ctx.fillStyle = TOKENS.colorText;
      ctx.font = TOKENS.fontSmall;
      ctx.textAlign = 'center';
      ctx.fillText(row.label, row.rect.x + row.rect.w / 2, row.rect.y + 21);
    }
  }

  private renderJournal(ctx: CanvasRenderingContext2D): void {
    const page = this.currentJournalPage;

    ctx.font = TOKENS.fontSmall;
    ctx.textAlign = 'left';

    for (let index = 0; index < page.length; index += 1) {
      const entry = page[index];
      if (!entry) {
        continue;
      }

      const y = 102 + index * 26;
      ctx.fillStyle = '#0b1220';
      ctx.fillRect(28, y - 13, 184, 20);
      ctx.strokeStyle = '#334155';
      ctx.strokeRect(28, y - 13, 184, 20);

      ctx.fillStyle = TOKENS.colorText;
      ctx.fillText(entry.conceptName.slice(0, 13), 34, y);

      ctx.textAlign = 'right';
      ctx.fillStyle = MASTERY_COLORS[entry.masteryLevel];
      const label = `${MASTERY_LABELS[entry.masteryLevel]}${entry.recallCount > 0 ? ` ${entry.recallCount}` : ''}`;
      ctx.fillText(label, 204, y);
      ctx.textAlign = 'left';
    }

    ctx.fillStyle = '#1f2937';
    ctx.fillRect(JOURNAL_PREV.x, JOURNAL_PREV.y, JOURNAL_PREV.w, JOURNAL_PREV.h);
    ctx.fillRect(JOURNAL_NEXT.x, JOURNAL_NEXT.y, JOURNAL_NEXT.w, JOURNAL_NEXT.h);
    ctx.strokeStyle = TOKENS.colorCyan400;
    ctx.strokeRect(JOURNAL_PREV.x, JOURNAL_PREV.y, JOURNAL_PREV.w, JOURNAL_PREV.h);
    ctx.strokeRect(JOURNAL_NEXT.x, JOURNAL_NEXT.y, JOURNAL_NEXT.w, JOURNAL_NEXT.h);

    ctx.fillStyle = TOKENS.colorText;
    ctx.textAlign = 'center';
    ctx.fillText('< PREV', JOURNAL_PREV.x + JOURNAL_PREV.w / 2, JOURNAL_PREV.y + 15);
    ctx.fillText('NEXT >', JOURNAL_NEXT.x + JOURNAL_NEXT.w / 2, JOURNAL_NEXT.y + 15);

    ctx.fillText(`${this.journalPage + 1}/${Math.max(1, this.pageCount)}`, 120, 336);
  }

  private renderSettings(ctx: CanvasRenderingContext2D): void {
    const settings = this.deps.getSettings();

    for (let index = 0; index < SETTING_ITEMS.length; index += 1) {
      const setting = SETTING_ITEMS[index];
      if (!setting) {
        continue;
      }

      const y = SETTING_ROWS_START_Y + index * SETTING_ROW_H;
      const selected = index === this.selectedSettingIndex;

      ctx.fillStyle = selected ? '#1f2937' : '#0b1220';
      ctx.fillRect(24, y - 13, 192, 22);
      ctx.strokeStyle = selected ? TOKENS.colorYellow400 : '#334155';
      ctx.strokeRect(24, y - 13, 192, 22);

      ctx.fillStyle = TOKENS.colorText;
      ctx.font = TOKENS.fontSmall;
      ctx.textAlign = 'left';
      ctx.fillText(setting.label, 30, y + 1);

      if (setting.kind === 'toggle') {
        ctx.textAlign = 'right';
        ctx.fillStyle = setting.get(settings) ? '#4ade80' : '#94a3b8';
        ctx.fillText(setting.get(settings) ? 'ON' : 'OFF', 210, y + 1);
      } else if (setting.kind === 'slider') {
        const x = 120;
        const w = 86;
        const ratio = setting.get(settings);

        ctx.fillStyle = '#111827';
        ctx.fillRect(x, y - 7, w, 10);
        ctx.strokeStyle = '#334155';
        ctx.strokeRect(x, y - 7, w, 10);
        ctx.fillStyle = TOKENS.colorCyan400;
        ctx.fillRect(x, y - 7, w * ratio, 10);
      }

      ctx.textAlign = 'left';
    }
  }

  private activateSelectedSetting(): void {
    const setting = SETTING_ITEMS[this.selectedSettingIndex];
    if (!setting) {
      return;
    }

    if (setting.kind === 'toggle') {
      this.applySetting((current) => setting.set(current, !setting.get(current)));
      return;
    }

    if (setting.kind === 'slider') {
      this.adjustSelectedSetting(0.1);
      return;
    }

    this.view = 'menu';
  }

  private adjustSelectedSetting(delta: number): void {
    const setting = SETTING_ITEMS[this.selectedSettingIndex];
    if (!setting || setting.kind !== 'slider') {
      return;
    }

    this.applySetting((current) => setting.set(current, setting.get(current) + delta));
  }

  private applySetting(mutate: (settings: AccessibilitySettings) => AccessibilitySettings): void {
    const next = mutate(this.deps.getSettings());
    this.deps.onSettingsChange({
      ...next,
      masterVolume: clamp01(next.masterVolume),
      musicVolume: clamp01(next.musicVolume),
      sfxVolume: clamp01(next.sfxVolume),
    });
  }

  private pickSettingIndex(x: number, y: number): number {
    for (let index = 0; index < SETTING_ITEMS.length; index += 1) {
      const rowY = SETTING_ROWS_START_Y + index * SETTING_ROW_H;
      if (inRect(x, y, { x: 24, y: rowY - 13, w: 192, h: 22 })) {
        return index;
      }
    }
    return -1;
  }

  private get sortedJournalEntries(): ConceptJournalEntry[] {
    return this.deps
      .getJournalEntries()
      .slice()
      .sort((a, b) => (a.islandId === b.islandId ? a.conceptName.localeCompare(b.conceptName) : a.islandId.localeCompare(b.islandId)));
  }

  private get currentJournalPage(): ConceptJournalEntry[] {
    const size = 8;
    const start = this.journalPage * size;
    return this.sortedJournalEntries.slice(start, start + size);
  }

  private get pageCount(): number {
    return Math.max(1, Math.ceil(this.sortedJournalEntries.length / 8));
  }
}

function inRect(x: number, y: number, rect: { x: number; y: number; w: number; h: number }): boolean {
  return x >= rect.x && y >= rect.y && x <= rect.x + rect.w && y <= rect.y + rect.h;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function mod(value: number, length: number): number {
  return ((value % length) + length) % length;
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}
