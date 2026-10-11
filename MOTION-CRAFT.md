# Motion craft notes (for future films)

Distilled from studying [mortiflix-oss](https://github.com/GTKottman/mortiflix-oss) (motion-design and
transition-board skills). These are guidance for new film treatments — they do not change the existing
build pipeline, engine, or any released film.

## Motion rules

- **Easing**: nothing moves linearly except mechanical things. Ease-out on entrances
  (fast in, soft landing), ease-in on exits. In the halftone-dossier engine: prefer
  `cubic-bezier(.16,1,.3,1)`-style curves for CSS/DOM, and exponential-out interpolation for SVG transforms.
- **Stagger** related elements by 2-4 frames (0.08-0.16 s at 24 fps); never animate a whole layout as one block.
- **Overlap actions**: the next element starts before the last one fully settles.
- **Read time**: on-screen text stays at least `words / 3 + 1` seconds after it finishes animating in.
- **Holds**: let the key idea sit still for a beat. Constant motion is noise.
- **Safe areas**: keep motion inside title-safe 5% / action-safe 3.5%.
- **Respect reduced motion**: the Pages landing page implements this via `prefers-reduced-motion`.

## Transitions

- Every cut should have a **carrier**: something already on screen (a shape, a line, a stamp, the crosshair)
  that leads into the next scene. Avoid bare dip-to-black where a carrier exists.
- **The screen never goes blank**: no full-frame flat colour covers or flashes unless the cover itself is
  made of the scene's own elements.
- Use a **vocabulary of 2-3 transition families** per film, consistently: the same kind of cut means the
  same kind of change (continuity = quiet blends/match cuts; section breaks = bigger carries).
- Crossfades only when nothing better connects the two ideas.

## Reference implementation

The GitHub Pages landing page (`gh-pages` branch) applies this craft to the web:
staggered ease-out scroll reveals, ken-burns poster hover, pulse status dot, static grain,
scan-line "next film" slot, and full `prefers-reduced-motion` fallback.
