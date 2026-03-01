# IMAGE-STYLES.md

## Primary Visual Style (Used for Stochastic Parrot Cinematics)

**Style name:** Cinematic Stylized Concept Art

### Core look
- Painterly, game key-art quality
- High readability silhouettes
- Dramatic, directional lighting
- Rich pirate palette (teal/navy, brass/gold, sea-storm accents)
- Adventure-forward composition with clear focal subject
- Clean output: **no text, no logos, no watermarks**

### Character consistency rules
Use the same anchored reference design in every image:
- **Captain Nemo**: same face shape, hair, beard, coat silhouette, and compass amulet
- **Bit (parrot)**: bright green, consistent size/proportions and recognizable shape

Prompt anchor for consistency:
> "Same character design as reference image. Do not redesign face, outfit, or parrot proportions."

### Shot design guidance
- One strong narrative beat per frame
- Background supports story but does not overpower hero readability
- Prefer cinematic framing (foreground/midground/background depth)
- Keep visual tone aligned to scene arc (wonder → pressure → triumph)

### Negative constraints
- Avoid photorealism drift
- Avoid cartoon/chibi deformation
- Avoid overbusy UI-like overlays
- Avoid unreadable pseudo-text elements

### Recommended generator usage
- Use reference-image-guided generation for each shot (image-to-image)
- Keep a reusable consistency prompt block at the top of every prompt
- Regenerate any shot that drifts from Nemo/Bit baseline
