# Avatar Species

Five original species, each interpreted from one supplied reference image and
implemented as data against the shared `AvatarSpecies` contract
(`src/types/species.ts`). None of the reference images are used as textures
or displayed to players — they informed the design only. All five are
rendered by one shared procedural rig (`src/components/avatar3d/ProceduralCreature.tsx`);
differences come entirely from each species' manifest entry in
`src/species/definitions/`.

---

## 1. Roundling

- **Reference image:** `avatar 1` (AVIF) — a chunky orange/white
  astronaut-suit robot with a near-spherical helmet head and huge glowing
  circular eyes.
- **Design interpretation:** A stocky "heavy explorer" creature. The
  reference's defining traits — big round head, thick stubby limbs, padded
  suit-like plating, oversized eyes — became a `headToBodyRatio` of 0.95
  (head is nearly as large as the body), the thickest limbs of the five
  species (`limbThickness: 1.35`), and a `stocky` build with boxy boots.
- **Base silhouette:** Round head, barrel torso, short thick legs, blocky
  boots. Widest, most grounded stance of the five.
- **Customizable materials:** Body (`allowedBodyColors`), secondary/accent
  (`allowedSecondaryColors`), face plate (`allowedFaceColors`) — 7/5/4
  swatches respectively, independently selectable.
- **Randomized features:** 5 eye variants, 5 mouth variants, 5 ear variants,
  5 patterns, 5 personalities (brave/gentle/stubborn/loyal/curious, weighted
  toward brave/loyal).
- **Personality tendencies:** Brave and loyal skew highest — Roundling is
  designed to read as the "unshakeable companion" archetype.
- **Evolution design:** Egg → Hatchling → Sprout → Adventurer → Guardian →
  Radiant, with plating thickness, a small crest bump accessory, and glow
  intensity all increasing continuously with level (see
  `getVisualDetailForLevel`). Positive branches (Scholar/Explorer/
  Guardian/Dreamer/Performer/Balanced) layer on top from the Adventurer
  stage onward based on care-interaction history.
- **Animation support:** Full `AnimationMap` — idle (bob-sway), sleep
  (curl-shell), eat (munch-bounce), clean (shake-scrub), play (hop-spin),
  illness (droop-wobble), recovery (shiver-perk), celebration
  (bounce-burst), comfort (lean-in-hum), walk (waddle), plus 5
  personality-specific idle variants.
- **Asset filenames:** No static mesh files — fully procedural. Reference
  documentation image: `avatar 1` (staged copy kept outside the repo; see
  "Known limitations").
- **Known limitations:** Procedural geometry, not a hand-sculpted/rigged
  model — see "Replacing with a production GLB" below.

## 2. Pixel

- **Reference image:** `avatar 2.jpeg` — a flat, friendly cartoon robot
  whose rounded head is a soft-lit screen showing simple glowing eyes and a
  smile, with a matching chest screen.
- **Design interpretation:** A compact "expressive" creature whose whole
  face is literally a display panel. This is the species most built around
  legible mood/eye/mouth swaps — its `materialSlots.face.emissiveIntensity`
  is the highest of the five (1.1) so its expressions read clearly.
- **Base silhouette:** Compact blocky body, `headToBodyRatio: 0.85`, the
  shortest limbs (`legLength: 0.6`) — a "toy on wheels" proportion.
- **Customizable materials:** Body/secondary/face, all independently
  selectable; pattern blend mode is `screen` (brightens rather than tints),
  matching its display-panel material language.
- **Randomized features:** Eye variants read as on-screen icons (dot-glow,
  half-moon, star-blink, spiral, wink); mouth variants are literally
  "screen-*" shapes; 5 ear/pattern/personality variants each.
- **Personality tendencies:** Cheerful and playful dominate the weighting —
  Pixel is the extroverted, chatty species.
- **Evolution design:** Same six-stage arc; visually its screen panel
  gains contrast and richer glow per level rather than added physical
  bulk, consistent with a "display gets better," not "gets bigger,"
  growth story.
- **Animation support:** Full `AnimationMap`, themed around its screen
  (screen-flicker-bob idle, dim-screen sleep, static-glitch illness,
  reboot-flash recovery, screen-fireworks celebration).
- **Asset filenames:** Procedural; reference documentation image:
  `avatar 2.jpeg`.
- **Known limitations:** Same procedural caveat as above.

## 3. Sprint

- **Reference image:** `avatar 3.jpg` — a sleek white/orange robot bust
  with thin wire antennae, glowing almond-shaped eyes, and lit
  sneaker-style boots.
- **Design interpretation:** A lean "athletic" creature — the only one of
  the five with `legLength` (1.25) greater than 1, the smallest
  `headToBodyRatio` (0.6), and thin wire-antenna ears echoing the
  reference's antennae. Racing-stripe patterns and lit boot accents carry
  over the reference's "sporty" material language.
- **Base silhouette:** Long legs, narrow torso, small head — the most
  human-runner-like proportions among the chibi-styled species.
- **Customizable materials:** Body/secondary/face; highest `clearcoat`
  (0.5) of the five for a glossy, athletic-shoe finish.
- **Randomized features:** Eyes lean narrow/focused; ears are
  antenna/wire-based; patterns favor stripes/chevrons.
- **Personality tendencies:** Energetic and competitive dominate.
- **Evolution design:** Standard six-stage arc; accessory slot is a
  half-torus "headband" that grows more prominent with level, and its
  scale/glow curve is the steepest of the five (visually "gets faster
  looking" as it grows).
- **Animation support:** Full `AnimationMap` themed around motion
  (toe-bounce idle, sprint-loop play, victory-lap celebration, jog walk).
- **Asset filenames:** Procedural; reference documentation image:
  `avatar 3.jpg`.
- **Known limitations:** Same procedural caveat as above.

## 4. Aurum

- **Reference image:** `avatar 4.png` — a gold/silver metallic humanoid
  robot with calm oval eyes and elegant, near-human body proportions (no
  oversized chibi head).
- **Design interpretation:** The most "dignified/adult-proportioned" of
  the five species: `headToBodyRatio: 0.45` (smallest of the five — a
  real body, not a floating head), the longest neck (`neckLength: 0.55`),
  and the highest `metalness` (0.75) material to match the reference's
  bimetal finish.
- **Base silhouette:** Tall, narrow-shouldered, tapered torso, long neck —
  reads as poised rather than cute.
- **Customizable materials:** Body/secondary/face; pattern variants are
  etched-seam/filigree/banded, matching the reference's engraved-metal
  look.
- **Randomized features:** Eyes are calm/gentle by default (no "sparkle" or
  "spiral" variants — Aurum doesn't do goofy expressions); mouth variants
  are mostly subtle (thin-line, seam-line, or none).
- **Personality tendencies:** Dignified and protective dominate — designed
  to read as a noble guardian archetype from hatch.
- **Evolution design:** Standard six-stage arc; its accessory slot is a
  small crest/fin (echoing the reference's clean silhouette) rather than
  horns or tufts, staying tasteful at every stage.
- **Animation support:** Full `AnimationMap`, themed around composure
  (poised-sway idle, bow-flourish celebration, measured-stride walk).
- **Asset filenames:** Procedural; reference documentation image:
  `avatar 4.png`.
- **Known limitations:** Same procedural caveat as above.

## 5. Wisp

- **Reference image:** `avatar 5.WEBP` — a slender robot with an
  oversized spherical head dominated by huge glossy lens-like eyes and no
  visible mouth.
- **Design interpretation:** The most otherworldly of the five —
  `headToBodyRatio: 1.15` (the only species whose head is *larger* than
  its body), the thinnest limbs (`limbThickness: 0.45`), and eye variants
  that default to "huge-lens." No default mouth (mouth defaults to
  `none`-leaning variants), matching the reference's mouthless face.
- **Base silhouette:** Tall, willowy, tiny torso under a huge head — reads
  as quiet and alien rather than sturdy.
- **Customizable materials:** Body/secondary/face; `pattern.blendMode` is
  `screen` for a soft, glowing look; face material has the highest
  emissive intensity of the five (1.2) for its lens-eyed glow.
- **Randomized features:** Eyes lean huge/wide; ears are mostly
  feather-tuft or none; patterns lean toward soft gradients and star
  flecks.
- **Personality tendencies:** Dreamy and curious dominate.
- **Evolution design:** Standard six-stage arc; instead of a horn/crest,
  its accessory slot is a pair of small trailing wisps/tufts, and it gets
  the highest `glow` value of any species at Radiant stage (1.0), rendered
  as a soft trailing light.
- **Animation support:** Full `AnimationMap`, themed around floating
  (gentle-float-sway idle, glide walk, sparkle-burst celebration).
- **Asset filenames:** Procedural; reference documentation image:
  `avatar 5.WEBP`.
- **Known limitations:** Same procedural caveat as above.

---

## Replacing a procedural species with a production GLB

The asset contract in `AvatarSpecies.modelAsset` is reserved for exactly
this. To swap in a real rigged model for any species without touching
gameplay code:

1. Author (or commission) a rigged GLB with the bone/morph-target names
   documented in `ART_PIPELINE.md`'s asset contract section.
2. Drop the file under `public/models/<species-slug>.glb` and set
   `modelAsset: "/models/<species-slug>.glb"` on that species' definition
   in `src/species/definitions/`.
3. In `src/components/avatar3d/ProceduralCreature.tsx`, branch at the top
   of the component: if `species.modelAsset` is set, render a `useGLTF`
   loader + `AnimationMixer`-driven model instead of the procedural JSX
   tree, using the exact same props (`traits`, `bodyColor`,
   `secondaryColor`, `faceColor`, `level`, `state`) so nothing above it
   (onboarding, dashboard, evolution logic, tests) has to change.
4. Map `species.animationMap`'s string ids to actual GLB animation clip
   names (they're already named like `idle`, `sleep`, `eat`, etc. for
   exactly this reason).
5. Map color customization onto GLB material slots via
   `species.materialSlots`, e.g. by targeting materials named
   `body`/`secondary`/`face` in the authored file and setting
   `.color`/`.emissive` on them at runtime.

Nothing in onboarding, the pet dashboard, evolution math, or the database
schema references geometry directly — every one of those layers only
knows about `species.slug`, resolved trait strings, and color hex values,
so this swap is additive and isolated to `ProceduralCreature.tsx`.
