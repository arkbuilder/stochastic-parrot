# DesignTokens.md

## 8-bit Game UI Design System

**Status:** Proposed production design system  
**Base inspiration:** 8bitcn/ui  
**Intended consumers:** game developer, UI implementer, Claude Code / agentic coding workflows  
**Platforms:** portrait-first phone, optional PC mouse/keyboard parity  

> This is **not** an official 8bitcn token export. It is a **build-ready design system** derived from the 8bitcn aesthetic and component vocabulary, expanded into a full token library for a cohesive game experience.

---

## 1. Design intent

Build a game UI that feels:

- **Retro and deliberate** rather than generic web app chrome
- **Readable on phone** rather than “pixel for pixel’s sake”
- **Systemic and codable** rather than case-by-case styling
- **Tactile** through hard edges, hard shadows, square geometry, and quick response
- **Learnable** through signposting, contrast, motion cues, and clear state changes

### Core visual rules

1. **Square-first geometry** - default radius is 0 or 4px max.
2. **Hard shadow, not blur** - surfaces feel stacked, pressed, and physical.
3. **Strong borders** - borders are a primary shape language, not decoration.
4. **Uppercase for labels, not paragraphs** - preserve readability on mobile.
5. **Pixel accents, modern legibility** - display can be retro; body must remain readable.
6. **No soft glassmorphism** - avoid blur-heavy UI, translucent mush, and low-contrast overlays.
7. **Motion is quick and stepped** - feedback should feel like a game, not a SaaS dashboard.
8. **Gameplay > ornament** - every token should support affordance, hierarchy, or feedback.

---

## 2. Token architecture

Use a four-layer token model:

### Layer A - Primitive tokens
Raw values only.

- color
- spacing
- size
- border
- radius
- shadow
- motion
- opacity
- z-index
- typography base values

### Layer B - Semantic tokens
Mapped to meaning, not component.

- surface.canvas
- surface.panel
- text.primary
- text.muted
- action.primary
- status.success
- gameplay.health
- signpost.reward

### Layer C - Component tokens
Mapped to reusable UI pieces.

- button.primary.bg
- panel.hud.border
- dialog.scrim.bg
- input.default.border
- bar.health.fill

### Layer D - Context tokens
Used by mode, theme, state, or platform.

- theme.arcade
- theme.gameboy
- mode.dark
- input.touch
- input.pc
- onboarding.safe-sandbox
- onboarding.pressure-ramp

### Naming contract

```txt
--{category}-{group}-{item}-{state?}-{mode?}
```

Examples:

```txt
--color-surface-panel
--color-text-muted
--button-primary-bg-hover
--panel-modal-border
--bar-health-fill-critical
--layout-portrait-controls-height
```

### Implementation rule

**Never hardcode a visual value inside a component** unless it is a one-off illustration or sprite asset. Components consume **semantic** or **component** tokens only.

---

## 3. Canonical brand direction

Use a single canonical house theme for the competition build, then allow optional skinning.

### Canonical theme: `arcade-midnight`

This should be the default for gameplay and menus.

#### Identity
- Midnight background
- Bright arcade accents
- Warm warning colors
- High readability on OLED/mobile
- Hard-edged, zero-radius chrome

#### Tone
- Confident
- Playful
- Slightly dangerous
- Competitive
- Reward-forward

---

## 4. Primitive token library

## 4.1 Spacing scale

Use a 4px base grid.

| Token | Value | Usage |
|---|---:|---|
| `space-0` | `0px` | none |
| `space-1` | `4px` | icon gap, pixel offsets |
| `space-2` | `8px` | tight stack, badge gap |
| `space-3` | `12px` | panel inner padding small |
| `space-4` | `16px` | default component padding |
| `space-5` | `20px` | touch button content spacing |
| `space-6` | `24px` | card padding / vertical section gap |
| `space-8` | `32px` | large section gap |
| `space-10` | `40px` | hero/panel separation |
| `space-12` | `48px` | min touch target zone |
| `space-16` | `64px` | large layout spacing |

### Rules
- Minimum internal component padding: `space-3`
- Default panel padding: `space-4`
- Default section gap: `space-6`
- Never use odd pixel gaps for layout rhythm

---

## 4.2 Size scale

| Token | Value |
|---|---:|
| `size-2` | `8px` |
| `size-3` | `12px` |
| `size-4` | `16px` |
| `size-5` | `20px` |
| `size-6` | `24px` |
| `size-8` | `32px` |
| `size-10` | `40px` |
| `size-12` | `48px` |
| `size-14` | `56px` |
| `size-16` | `64px` |
| `size-20` | `80px` |
| `size-24` | `96px` |

### Hit target minimums

| Token | Value | Rule |
|---|---:|---|
| `target-min-touch` | `48px` | mobile minimum interactive target |
| `target-min-mouse` | `32px` | desktop minimum interactive target |
| `thumb-safe-padding` | `16px` | edge inset for portrait controls |

---

## 4.3 Radius

| Token | Value | Usage |
|---|---:|---|
| `radius-none` | `0px` | default |
| `radius-xs` | `2px` | tiny emphasis only |
| `radius-sm` | `4px` | optional soft skin |
| `radius-md` | `8px` | avoid in core gameplay chrome |

### Rules
- Core gameplay HUD, bars, menus, inventory slots, buttons: `radius-none`
- Optional social/profile surfaces only: `radius-sm`
- Do not exceed `8px`

---

## 4.4 Border widths

| Token | Value | Usage |
|---|---:|---|
| `border-thin` | `1px` | interior separators only |
| `border-ui` | `2px` | default component border |
| `border-strong` | `3px` | focus / status |
| `border-frame` | `4px` | modal, HUD frame, boss panel |

### Rules
- Never use anti-aliased hairline borders as primary framing
- `2px` is the default interactive border
- `4px` reserved for major containers or boss-state UI

---

## 4.5 Shadow system

All core shadows are **hard-offset** with no blur.

| Token | Value |
|---|---|
| `shadow-none` | `none` |
| `shadow-pixel-sm` | `2px 2px 0 0 var(--color-shadow-hard)` |
| `shadow-pixel-md` | `4px 4px 0 0 var(--color-shadow-hard)` |
| `shadow-pixel-lg` | `6px 6px 0 0 var(--color-shadow-hard)` |
| `shadow-inset-ui` | `inset 0 2px 0 0 var(--color-highlight-soft), inset 0 -2px 0 0 var(--color-shadow-soft)` |
| `shadow-focus-glow` | `0 0 0 3px var(--color-focus-ring)` |

### Rules
- Prefer shadow offset to create press depth
- Avoid gaussian blur except optional ambient overlays in menu backgrounds
- Pressed buttons reduce shadow and translate down/right by 2px

---

## 4.6 Opacity

| Token | Value |
|---|---:|
| `opacity-disabled` | `0.45` |
| `opacity-muted` | `0.72` |
| `opacity-scrim-soft` | `0.40` |
| `opacity-scrim-strong` | `0.72` |
| `opacity-hover-overlay` | `0.08` |
| `opacity-selected-overlay` | `0.14` |

---

## 4.7 Z-index

| Token | Value |
|---|---:|
| `z-base` | `0` |
| `z-content` | `10` |
| `z-hud` | `20` |
| `z-dropdown` | `30` |
| `z-sheet` | `40` |
| `z-modal` | `50` |
| `z-toast` | `60` |
| `z-debug` | `90` |

---

## 4.8 Motion

Retro UI should feel **snappy, stepped, and obvious**.

| Token | Value |
|---|---|
| `duration-instant` | `50ms` |
| `duration-fast` | `100ms` |
| `duration-ui` | `150ms` |
| `duration-panel` | `200ms` |
| `duration-emphasis` | `250ms` |
| `ease-step` | `steps(2, end)` |
| `ease-linear` | `linear` |
| `ease-out` | `cubic-bezier(.2,.8,.2,1)` |

### Motion patterns

| Token | Value | Meaning |
|---|---|---|
| `motion-hover-lift` | `translate(-1px, -1px)` | hover intention |
| `motion-press` | `translate(2px, 2px)` | tactile press |
| `motion-panel-enter-y` | `translateY(8px)` | panel appear |
| `motion-toast-enter-y` | `translateY(-8px)` | toast drop-in |
| `motion-shake-sm` | `2px` amplitude | warning / error |
| `motion-reward-bounce` | `6px` vertical | reward signposting |

### Rules
- UI motion should finish in `<= 200ms`
- Do not use springy overshoot on core buttons or HUD
- Animate sprites in whole pixels when possible

---

## 5. Typography system

## 5.1 Font roles

Use a layered type strategy:

### Display font
For title cards, game-over screens, bosses, major rewards.

```txt
font.display = "Press Start 2P", "Pixelify Sans", monospace
```

### UI font
For buttons, tabs, short labels, menu items.

```txt
font.ui = "VT323", "Space Mono", monospace
```

### Body font
For readable descriptions, settings, onboarding hints, longer copy.

```txt
font.body = "Inter", "Geist Sans", system-ui, sans-serif
```

### Numeric font
For counters, damage, health, timers, scoreboards.

```txt
font.numeric = "Space Mono", "IBM Plex Mono", monospace
```

### Rule
- Never set long paragraphs in `Press Start 2P` on phone
- Pixel display font is for impact, not all-purpose reading

---

## 5.2 Type scale

### Display

| Token | Size / Line | Weight | Use |
|---|---|---|---|
| `type-display-xl` | `28/32` | `700` | splash / game over |
| `type-display-lg` | `24/28` | `700` | boss intro / section hero |
| `type-display-md` | `20/24` | `700` | menu header |

### UI titles

| Token | Size / Line | Weight | Use |
|---|---|---|---|
| `type-title-lg` | `20/24` | `700` | card title |
| `type-title-md` | `18/22` | `700` | panel heading |
| `type-title-sm` | `16/20` | `700` | modal heading |

### Labels

| Token | Size / Line | Weight | Use |
|---|---|---|---|
| `type-label-lg` | `14/16` | `700` | button label large |
| `type-label-md` | `12/14` | `700` | default button / tabs |
| `type-label-sm` | `10/12` | `700` | badges / HUD tags |

### Body

| Token | Size / Line | Weight | Use |
|---|---|---|---|
| `type-body-lg` | `16/24` | `500` | readable menu copy |
| `type-body-md` | `14/20` | `500` | default body |
| `type-body-sm` | `12/18` | `500` | secondary copy |

### Numeric

| Token | Size / Line | Weight | Use |
|---|---|---|---|
| `type-score-lg` | `24/24` | `700` | score / combo |
| `type-score-md` | `18/20` | `700` | health / timer |
| `type-score-sm` | `14/16` | `700` | compact HUD values |

---

## 5.3 Letter case and spacing

| Token | Value |
|---|---|
| `tracking-pixel-tight` | `0.02em` |
| `tracking-ui` | `0.04em` |
| `tracking-label` | `0.08em` |
| `case-label` | `uppercase` |
| `case-body` | `none` |

### Rules
- Buttons and tabs: uppercase
- Body paragraphs: sentence case
- Numeric counters: use tabular numerals if available

---

## 6. Color system

## 6.1 Primitive palette - canonical `arcade-midnight`

### Neutrals

| Token | Value | Role |
|---|---|---|
| `gray-00` | `#F7F4E8` | parchment-white highlight |
| `gray-50` | `#E7E1CC` | warm light surface |
| `gray-100` | `#C8C2AF` | muted text on dark |
| `gray-300` | `#7E7A70` | disabled / low-emphasis |
| `gray-700` | `#2A2830` | panel base |
| `gray-800` | `#1D1B22` | deep surface |
| `gray-900` | `#111015` | canvas |
| `gray-950` | `#08070B` | void / scrim anchor |
| `black` | `#000000` | hard border / shadow |

### Brand accents

| Token | Value | Role |
|---|---|---|
| `violet-500` | `#7C4DFF` | primary action |
| `cyan-400` | `#2EE6FF` | focus / interactable emphasis |
| `pink-500` | `#FF4FA3` | special / combo / rare reward |
| `yellow-400` | `#FFD54A` | XP / warning / star |
| `green-400` | `#71E27A` | success / heal / safe state |
| `red-500` | `#FF5A4F` | danger / fail / enemy attack |
| `orange-500` | `#FF9F43` | caution / stamina / heat |
| `blue-500` | `#4DA3FF` | mana / info / shield |

### Shadows and overlays

| Token | Value |
|---|---|
| `shadow-hard` | `#000000` |
| `shadow-soft` | `rgba(0,0,0,0.32)` |
| `highlight-soft` | `rgba(255,255,255,0.10)` |
| `scrim` | `rgba(8,7,11,0.72)` |
| `glass-disabled` | `rgba(247,244,232,0.06)` |

---

## 6.2 Semantic colors

### Surface tokens

| Token | Value |
|---|---|
| `color-surface-canvas` | `var(--gray-900)` |
| `color-surface-subcanvas` | `var(--gray-800)` |
| `color-surface-panel` | `var(--gray-700)` |
| `color-surface-panel-alt` | `#24212B` |
| `color-surface-raised` | `#322F3A` |
| `color-surface-inverse` | `var(--gray-00)` |
| `color-surface-overlay` | `rgba(17,16,21,0.92)` |
| `color-surface-scrim` | `var(--scrim)` |

### Text tokens

| Token | Value |
|---|---|
| `color-text-primary` | `var(--gray-00)` |
| `color-text-secondary` | `var(--gray-100)` |
| `color-text-muted` | `var(--gray-300)` |
| `color-text-inverse` | `var(--black)` |
| `color-text-link` | `var(--cyan-400)` |
| `color-text-danger` | `var(--red-500)` |
| `color-text-success` | `var(--green-400)` |

### Border tokens

| Token | Value |
|---|---|
| `color-border-strong` | `var(--black)` |
| `color-border-default` | `#4A4652` |
| `color-border-muted` | `#3B3844` |
| `color-border-focus` | `var(--cyan-400)` |
| `color-border-selected` | `var(--yellow-400)` |
| `color-border-danger` | `var(--red-500)` |

### Action tokens

| Token | Value |
|---|---|
| `color-action-primary` | `var(--violet-500)` |
| `color-action-primary-hover` | `#9368FF` |
| `color-action-primary-press` | `#6237E8` |
| `color-action-secondary` | `var(--cyan-400)` |
| `color-action-secondary-hover` | `#5DEEFF` |
| `color-action-secondary-press` | `#18BFD7` |
| `color-action-ghost` | `transparent` |
| `color-action-danger` | `var(--red-500)` |
| `color-action-disabled` | `var(--gray-300)` |

### Status tokens

| Token | Value |
|---|---|
| `color-status-success` | `var(--green-400)` |
| `color-status-warning` | `var(--yellow-400)` |
| `color-status-danger` | `var(--red-500)` |
| `color-status-info` | `var(--blue-500)` |
| `color-status-special` | `var(--pink-500)` |

---

## 6.3 Gameplay semantic tokens

### Core resource tokens

| Token | Value |
|---|---|
| `color-game-health` | `#E5483B` |
| `color-game-health-critical` | `#FF2D2D` |
| `color-game-mana` | `#4DA3FF` |
| `color-game-stamina` | `#6DD17C` |
| `color-game-xp` | `#FFD54A` |
| `color-game-shield` | `#59D9FF` |
| `color-game-currency` | `#7CF085` |

### Affordance / signposting tokens

| Token | Value | Meaning |
|---|---|---|
| `color-signpost-go` | `#8EF06C` | where to move |
| `color-signpost-reward` | `#FFD54A` | collectible / pickup |
| `color-signpost-hazard` | `#FF5A4F` | threat |
| `color-signpost-interactive` | `#2EE6FF` | tappable / activatable |
| `color-signpost-secret` | `#FF4FA3` | mastery path |
| `color-signpost-safe` | `#71E27A` | rehearsal / sandbox |

### Rarity tokens

| Token | Value |
|---|---|
| `color-rarity-common` | `#C8C2AF` |
| `color-rarity-uncommon` | `#71E27A` |
| `color-rarity-rare` | `#4DA3FF` |
| `color-rarity-epic` | `#B179FF` |
| `color-rarity-legendary` | `#FFD54A` |

### Team/faction tokens

| Token | Value |
|---|---|
| `color-team-player` | `#2EE6FF` |
| `color-team-friendly` | `#71E27A` |
| `color-team-neutral` | `#C8C2AF` |
| `color-team-enemy` | `#FF5A4F` |
| `color-team-boss` | `#FF4FA3` |

---

## 7. Layout tokens

The gameplay brief is portrait-first, with the upper third reserved for future-state visibility and the lower third dedicated to action reach and immediate feedback. Build the layout around that assumption.

## 7.1 Portrait frame tokens

| Token | Value | Meaning |
|---|---|---|
| `layout-portrait-max-width` | `480px` | UI frame cap |
| `layout-safe-top` | `16px` | notch/status inset |
| `layout-safe-right` | `16px` | edge inset |
| `layout-safe-bottom` | `20px` | gesture area |
| `layout-safe-left` | `16px` | edge inset |
| `layout-zone-top-min` | `22vh` | future-state / HUD preview |
| `layout-zone-middle-min` | `42vh` | active play space |
| `layout-zone-bottom-min` | `22vh` | controls / immediate action |
| `layout-controls-height` | `88px` | standard portrait control strip |
| `layout-thumb-reach-max-width` | `280px` | one-handed interaction cluster |

### Rules
- Primary controls live in lower third
- HUD previews and incoming hazard signaling live in upper third
- Critical actions must be reachable one-handed on phone
- Bottom sheets must not occlude the primary action cluster during gameplay

---

## 7.2 Desktop parity tokens

| Token | Value |
|---|---:|
| `layout-desktop-sidebar-width` | `320px` |
| `layout-desktop-panel-max-width` | `640px` |
| `layout-desktop-modal-max-width` | `720px` |
| `layout-desktop-keyhint-gap` | `8px` |

### Rules
- PC keeps the same visual system; only layout breathes out
- Mouse hover can reveal extra detail, but core affordance must still exist without hover

---

## 8. Panel UX system

## 8.1 Panel taxonomy

### `panel.hud`
Always visible, compact, information-dense.

**Use for:** score, health, mana, timer, combo, minimap tag, mission objective

Tokens:

```txt
panel-hud-bg = color-surface-overlay
panel-hud-border = color-border-strong
panel-hud-shadow = shadow-pixel-sm
panel-hud-padding = space-2
panel-hud-gap = space-2
panel-hud-radius = radius-none
```

### `panel.menu`
Main menu or pause menu surface.

```txt
panel-menu-bg = color-surface-panel
panel-menu-border = color-border-strong
panel-menu-shadow = shadow-pixel-lg
panel-menu-padding = space-4
panel-menu-gap = space-3
```

### `panel.modal`
Interruptive confirm / reward / level complete.

```txt
panel-modal-bg = color-surface-panel-alt
panel-modal-border = color-border-strong
panel-modal-shadow = shadow-pixel-lg
panel-modal-scrim = color-surface-scrim
panel-modal-padding = space-4
```

### `panel.sheet`
Portrait inventory, settings, quest log, shop, controls help.

```txt
panel-sheet-bg = color-surface-panel
panel-sheet-border = color-border-strong
panel-sheet-shadow = shadow-pixel-md
panel-sheet-padding = space-4
```

### `panel.toast`
Short-lived feedback.

```txt
panel-toast-bg = color-surface-raised
panel-toast-border = color-border-default
panel-toast-shadow = shadow-pixel-sm
panel-toast-padding = space-3
```

---

## 8.2 Panel composition rules

Every major panel should have:

1. **Title strip**
2. **Primary content zone**
3. **Action row**
4. **Optional status/footer row**

### Title strip tokens

| Token | Value |
|---|---|
| `panel-title-bg` | `var(--color-action-primary)` |
| `panel-title-fg` | `var(--color-text-primary)` |
| `panel-title-padding-x` | `space-3` |
| `panel-title-padding-y` | `space-2` |
| `panel-title-border-bottom` | `border-ui solid var(--color-border-strong)` |

### Footer/action row tokens

| Token | Value |
|---|---|
| `panel-actions-gap` | `space-2` |
| `panel-actions-padding-top` | `space-3` |
| `panel-actions-separator` | `border-thin solid var(--color-border-muted)` |

---

## 8.3 Portrait panel behavior

- Use **bottom sheet** for inventory/settings on mobile
- Use **center modal** for reward, defeat, confirmation
- Use **side sheet** on desktop for secondary systems
- Toasts should appear in the **upper region**, not over the thumb/action zone
- Pause overlays should preserve silhouette readability of the scene beneath

---

## 9. Component token system

## 9.1 Buttons

### Shared button tokens

```txt
button-height-sm = 32px
button-height-md = 40px
button-height-lg = 48px
button-padding-x-sm = 12px
button-padding-x-md = 16px
button-padding-x-lg = 20px
button-border-width = 2px
button-radius = 0px
button-shadow = shadow-pixel-sm
button-font = type-label-md
button-tracking = tracking-label
```

### Primary button

```txt
button-primary-bg = color-action-primary
button-primary-fg = color-text-primary
button-primary-border = color-border-strong
button-primary-shadow = shadow-pixel-md
button-primary-bg-hover = color-action-primary-hover
button-primary-bg-press = color-action-primary-press
button-primary-translate-hover = motion-hover-lift
button-primary-translate-press = motion-press
```

### Secondary button

```txt
button-secondary-bg = color-action-secondary
button-secondary-fg = color-text-inverse
button-secondary-border = color-border-strong
```

### Ghost button

```txt
button-ghost-bg = transparent
button-ghost-fg = color-text-primary
button-ghost-border = color-border-default
button-ghost-bg-hover = rgba(255,255,255,0.06)
```

### Danger button

```txt
button-danger-bg = color-action-danger
button-danger-fg = color-text-primary
button-danger-border = color-border-strong
```

### Disabled state

```txt
button-disabled-opacity = opacity-disabled
button-disabled-shadow = shadow-none
button-disabled-translate = none
```

### Button rules
- Press state must reduce shadow depth
- Destructive buttons should never be the most visually prominent action unless truly primary
- On mobile, default action button height is `48px`

---

## 9.2 Inputs and form controls

### Input shell

```txt
input-bg = color-surface-subcanvas
input-fg = color-text-primary
input-placeholder = color-text-muted
input-border = color-border-default
input-border-focus = color-border-focus
input-shadow = shadow-inset-ui
input-height = 40px
input-padding-x = 12px
input-padding-y = 8px
```

### Checkbox / toggle

```txt
check-size = 20px
check-bg = color-surface-panel
check-border = color-border-strong
check-mark = color-signpost-go
```

### Slider

```txt
slider-track-bg = color-surface-raised
slider-track-border = color-border-strong
slider-fill = color-action-secondary
slider-thumb-size = 20px
slider-thumb-bg = color-action-primary
slider-thumb-border = color-border-strong
```

### Focus rules
- Focus must be visible without relying on subtle color shift
- Preferred focus treatment: 3px outer ring + border shift to cyan

---

## 9.3 Tabs / segmented controls

```txt
tabs-bg = color-surface-panel
tabs-border = color-border-strong
tabs-gap = 0px
tab-item-bg = transparent
tab-item-fg = color-text-secondary
tab-item-bg-active = color-action-primary
tab-item-fg-active = color-text-primary
tab-item-border-active = color-border-strong
```

### Rules
- Active tab should read like a selected cartridge slot / menu strip
- Do not use pill tabs unless the whole theme is softened intentionally

---

## 9.4 Cards / list items / inventory slots

### Card

```txt
card-bg = color-surface-panel
card-fg = color-text-primary
card-border = color-border-default
card-shadow = shadow-pixel-sm
card-padding = space-4
card-gap = space-3
```

### Inventory slot

```txt
slot-size-sm = 40px
slot-size-md = 48px
slot-size-lg = 64px
slot-bg = color-surface-subcanvas
slot-border = color-border-strong
slot-border-selected = color-border-selected
slot-shadow = shadow-pixel-sm
slot-rarity-glow-legendary = 0 0 0 2px var(--color-rarity-legendary)
```

### Item card rules
- Use consistent badge placement for rarity / quantity / equipped state
- Every slot needs empty, hover, selected, disabled, and locked states

---

## 9.5 Resource bars

The 8bitcn component set already includes health, mana, and XP bars, so make those a first-class part of the system rather than ad hoc widgets.

### Shared bar tokens

```txt
bar-height-sm = 8px
bar-height-md = 12px
bar-height-lg = 16px
bar-track-bg = color-surface-subcanvas
bar-track-border = color-border-strong
bar-track-shadow = shadow-inset-ui
bar-label-font = type-label-sm
bar-value-font = type-score-sm
```

### Health bar

```txt
bar-health-fill = color-game-health
bar-health-fill-warning = #FF8A4C
bar-health-fill-critical = color-game-health-critical
bar-health-glow-critical = 0 0 0 2px rgba(255,45,45,0.25)
```

### Mana bar

```txt
bar-mana-fill = color-game-mana
bar-mana-fill-low = #7BC1FF
```

### XP bar

```txt
bar-xp-fill = color-game-xp
bar-xp-sheen = #FFF1A8
```

### Shield / stamina optional

```txt
bar-shield-fill = color-game-shield
bar-stamina-fill = color-game-stamina
```

### Enemy health display

```txt
bar-enemy-track-bg = #2A1111
bar-enemy-fill = #FF5A4F
bar-enemy-border = color-border-strong
bar-enemy-name-fg = color-text-primary
bar-enemy-frame-bg = color-surface-overlay
```

### Bar rules
- Put numeric values near bars only when it helps decision-making
- Use threshold state swaps at 50%, 25%, 10%
- Boss bars get `border-frame` and `shadow-pixel-md`

---

## 9.6 Toasts / alerts / notifications

### Info

```txt
toast-info-bg = #1B2C38
toast-info-fg = color-text-primary
toast-info-border = color-status-info
```

### Success

```txt
toast-success-bg = #142817
toast-success-fg = color-text-primary
toast-success-border = color-status-success
```

### Warning

```txt
toast-warning-bg = #382B12
toast-warning-fg = color-text-primary
toast-warning-border = color-status-warning
```

### Danger

```txt
toast-danger-bg = #3B1715
toast-danger-fg = color-text-primary
toast-danger-border = color-status-danger
```

### Rules
- Toast max width on portrait: `min(88vw, 360px)`
- Place toast in upper third during gameplay
- Toast lifetime: `2.5s` info / `4s` warning / sticky for mission-critical failures

---

## 10. Input affordance tokens

## 10.1 Touch

```txt
input-touch-target = 48px
input-touch-primary-zone = bottom-center
input-touch-secondary-zone = bottom-right
input-touch-drag-threshold = 8px
input-touch-longpress-threshold = 300ms
input-touch-feedback-scale = 0.98
```

### Rules
- Show press state immediately on touch down
- Avoid tiny secondary controls in the onboarding slice
- Keep one-handed reach intact for core verbs

## 10.2 PC

```txt
input-pc-target = 32px
input-pc-hover-enabled = true
input-pc-keyhint-gap = 8px
input-pc-focus-ring = color-border-focus
input-pc-cursor-interactive = pointer
```

### Rules
- Keyboard and mouse should get the same action vocabulary as touch
- Hover can enrich; it must not be required to understand interaction

---

## 11. Onboarding and signposting tokens

These are critical because the game brief expects environmental onboarding, short feedback loops, and no-text comprehension.

## 11.1 Onboarding state tokens

```txt
onboarding-safe-bg-accent = color-signpost-safe
onboarding-pressure-bg-accent = color-signpost-hazard
onboarding-reward-accent = color-signpost-reward
onboarding-secret-accent = color-signpost-secret
onboarding-go-accent = color-signpost-go
```

## 11.2 Signposting patterns

### Reward trail

```txt
trail-coin-color = color-signpost-reward
trail-coin-spacing = 24px
trail-coin-bounce = motion-reward-bounce
```

### Hazard cue

```txt
hazard-flash-color = color-signpost-hazard
hazard-flash-duration = duration-fast
hazard-prehit-shake = motion-shake-sm
```

### Safe sandbox cue

```txt
sandbox-border = color-signpost-safe
sandbox-surface = rgba(113,226,122,0.08)
```

### Secret / mastery cue

```txt
secret-accent = color-signpost-secret
secret-outline = color-rarity-epic
secret-pulse-duration = duration-emphasis
```

### Rules
- Guidance should come from contrast, motion, framing, and repeated geometry
- Avoid giant explicit tutorial overlays during the first-use slice
- Novice assists should appear diegetic, not pity-coded

---

## 12. Iconography and sprite rules

## 12.1 Icon sizes

| Token | Value |
|---|---:|
| `icon-xs` | `8px` |
| `icon-sm` | `12px` |
| `icon-md` | `16px` |
| `icon-lg` | `24px` |
| `icon-xl` | `32px` |

## 12.2 Icon rules

- Prefer pixel or low-detail geometric icons
- Use solid fills and hard edges
- Avoid ultra-thin strokes
- One icon style per surface family

## 12.3 Pixel rendering rules

```css
image-rendering: pixelated;
```

### Rules
- Scale sprites by integer multiples whenever possible
- Avoid half-pixel translation for gameplay entities
- UI chrome can use vector; sprite content should preserve pixel intent

---

## 13. Accessibility rules

This system should feel retro without becoming hostile.

### Minimum standards
- Body text contrast target: `4.5:1`
- UI icon / non-text contrast target: `3:1`
- Focus visible on keyboard and PC interaction
- Do not encode meaning with color alone
- Pair critical state colors with iconography, copy, or motion
- On mobile, never use pixel fonts below `10px`

### Readability rules
- Long descriptions use `font.body`
- Labels and counters can use `font.ui` or `font.numeric`
- Display font limited to headings, rewards, and dramatic moments

---

## 14. Theme packs

Use `arcade-midnight` as house theme, but support optional skinning via a theme class on the root.

```html
<html class="theme-arcade-midnight dark">
```

### Recommended implementation model

- `:root` = canonical house tokens
- `.theme-sega`, `.theme-gameboy`, etc. override semantic values only
- Component tokens should not change names across themes

---

## 15. 8bitcn-aligned optional themes

The official 8bitcn theme selector exposes named themes such as `default`, `sega`, `gameboy`, `atari`, `nintendo`, `arcade`, `neo geo`, `soft pop`, `pacman`, `vhs`, `cassette`, `rusty byte`, and `zelda`. Keep those names if you want familiarity for developers already browsing 8bitcn.

### Theme: `sega`

```txt
primary = oklch(0.5 0.2 260)
background = oklch(0.85 0.1 220)
foreground = oklch(0.1 0.1 280)
border = oklch(0.5 0.2 260)
radius = 0rem
```

### Theme: `gameboy`

```txt
primary = oklch(0.7 0.2 120)
background = oklch(0.8 0.2 140)
foreground = oklch(0.2 0.1 140)
border = oklch(0.4 0.2 140)
radius = 0rem
```

### Theme: `arcade`

```txt
primary = oklch(0.7 0.25 320)
background = oklch(0.98 0.01 280)
foreground = oklch(0.1 0.05 280)
```

### Theme: `pacman`

```txt
primary = oklch(0.8369 0.1644 84.4286)
secondary = oklch(0.6231 0.188 259.8145)
background = oklch(1 0 0)
foreground = oklch(0.2101 0.0318 264.6645)
font = "Press Start 2P"
radius = 0rem
spacing = 0.25rem
tracking-normal = 0.05rem
```

### Theme: `zelda`

```txt
primary = oklch(0.75 0.2 90)
background = oklch(0.95 0.02 95)
foreground = oklch(0.5 0.15 120)
card = oklch(0.96 0.02 95)
radius = 0.25rem
```

### Guidance
- `gameboy` is excellent for minimalist single-hue modes
- `pacman` is the strongest “pure pixel” theme
- `zelda` is the best soft-fantasy skin
- `sega` and `arcade` are best for a competition build where you want vivid clarity

---

## 16. Recommended component mapping for the build

Map your design system directly to 8bitcn-style primitives/components:

| System need | Token family | Suggested component |
|---|---|---|
| Primary CTA | `button.*` | Button |
| Settings panel | `panel.sheet.*` | Sheet / Drawer |
| Inventory / loadout | `slot.*`, `card.*`, `tabs.*` | Card + Tabs + Item |
| HUD status | `panel.hud.*`, `bar.*` | Health Bar / Mana Bar / XP Bar |
| Boss encounter | `bar-enemy.*`, `panel-modal.*` | Enemy Health Display |
| System feedback | `toast.*`, `status.*` | Toast / Alert |
| Theme swapping | `theme.*` | Theme Selector / Retro Mode Switcher |
| Menus | `panel.menu.*`, `button.*`, `tabs.*` | Menubar / Navigation Menu |

---

## 17. CSS variable starter contract

Use this as your initial implementation file.

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;

  --radius-none: 0px;
  --radius-sm: 4px;

  --border-ui: 2px;
  --border-frame: 4px;

  --color-shadow-hard: #000000;
  --color-shadow-soft: rgba(0, 0, 0, 0.32);
  --color-highlight-soft: rgba(255,255,255,0.10);
  --color-focus-ring: #2EE6FF;

  --color-surface-canvas: #111015;
  --color-surface-panel: #2A2830;
  --color-surface-panel-alt: #24212B;
  --color-surface-subcanvas: #1D1B22;
  --color-surface-raised: #322F3A;

  --color-text-primary: #F7F4E8;
  --color-text-secondary: #C8C2AF;
  --color-text-muted: #7E7A70;
  --color-text-inverse: #000000;

  --color-border-strong: #000000;
  --color-border-default: #4A4652;
  --color-border-muted: #3B3844;
  --color-border-selected: #FFD54A;

  --color-action-primary: #7C4DFF;
  --color-action-primary-hover: #9368FF;
  --color-action-primary-press: #6237E8;
  --color-action-secondary: #2EE6FF;
  --color-action-danger: #FF5A4F;

  --color-game-health: #E5483B;
  --color-game-mana: #4DA3FF;
  --color-game-xp: #FFD54A;
  --color-game-shield: #59D9FF;

  --shadow-pixel-sm: 2px 2px 0 0 var(--color-shadow-hard);
  --shadow-pixel-md: 4px 4px 0 0 var(--color-shadow-hard);
  --shadow-pixel-lg: 6px 6px 0 0 var(--color-shadow-hard);

  --button-primary-bg: var(--color-action-primary);
  --button-primary-fg: var(--color-text-primary);
  --button-primary-border: var(--color-border-strong);

  --panel-menu-bg: var(--color-surface-panel);
  --panel-menu-border: var(--color-border-strong);
  --panel-menu-shadow: var(--shadow-pixel-lg);

  --bar-health-fill: var(--color-game-health);
  --bar-mana-fill: var(--color-game-mana);
  --bar-xp-fill: var(--color-game-xp);
}
```

---

## 18. Tailwind token mapping suggestion

```ts
// tokens-theme.ts
export const gameTokens = {
  colors: {
    surface: {
      canvas: "var(--color-surface-canvas)",
      panel: "var(--color-surface-panel)",
      raised: "var(--color-surface-raised)",
    },
    text: {
      primary: "var(--color-text-primary)",
      secondary: "var(--color-text-secondary)",
      muted: "var(--color-text-muted)",
      inverse: "var(--color-text-inverse)",
    },
    action: {
      primary: "var(--color-action-primary)",
      secondary: "var(--color-action-secondary)",
      danger: "var(--color-action-danger)",
    },
    game: {
      health: "var(--color-game-health)",
      mana: "var(--color-game-mana)",
      xp: "var(--color-game-xp)",
    },
  },
};
```

---

## 19. Rules for Claude Code / AI coding agents

Use these instructions verbatim in your build prompt if needed.

### Agent instructions

1. Use **only token variables** for colors, spacing, radii, borders, shadows, typography, and motion.
2. Never hardcode hex values inside components.
3. Default to `radius-none`, `border-ui`, and `shadow-pixel-sm` unless a component token says otherwise.
4. Use `font.display` only for short headings and reward states.
5. For body copy, use `font.body`.
6. For counters and resource numbers, use `font.numeric`.
7. Place gameplay toast/alerts in the upper third of portrait layout.
8. Place core action controls in the bottom third and keep touch targets at least `48px`.
9. For press states, reduce shadow and translate by `2px, 2px`.
10. For onboarding slices, emphasize `signpost-go`, `signpost-reward`, and `signpost-hazard` instead of tutorial text.
11. All bars must support normal, warning, and critical states.
12. Every interactive component must have default, hover, focus, active, disabled, and selected states.
13. Preserve desktop parity without creating a separate visual system.
14. Avoid blur, neumorphism, thin borders, and modern SaaS-style rounded cards.

---

## 20. Do / do not

### Do
- Use square panels and strong outlines
- Use hard shadows to communicate press depth
- Reserve brightest colors for action, reward, or danger
- Make signposting visible through motion and contrast
- Keep mobile readability sacred

### Do not
- Use blurry overlays as a primary style language
- Use 1px light-gray borders on dark surfaces as your core frame language
- Set long paragraphs in a pixel headline font
- Put critical gameplay toasts over thumb controls
- Add extra colors without semantic meaning

---

## 21. Final recommendation

For the competition build, ship with:

- **House theme:** `arcade-midnight`
- **Optional alt skins:** `gameboy`, `pacman`, `zelda`
- **Display font:** `Press Start 2P`
- **UI/body pairing:** `VT323` + `Inter` or `Geist Sans`
- **Default radius:** `0`
- **Default border:** `2px`
- **Default shadow:** `4px 4px 0 #000`
- **Primary action color:** violet
- **Focus/interact color:** cyan
- **Reward color:** yellow
- **Danger color:** red

That combination gives you the strongest retro signal while staying readable, buildable, and coherent across menus, HUD, onboarding, and optional desktop play.
