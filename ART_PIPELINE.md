# Art Pipeline

EvoBuddy's five avatar species currently ship as **procedural 3D models**,
built at runtime from primitive Three.js geometry, canvas-generated
textures, and data-driven proportions — not from external mesh files. This
document is the asset contract: what exists today, and exactly what a
production GLB pipeline would need to produce to replace it without any
gameplay code changes.

## Why procedural, for this release

The environment this project was built in cannot run a 3D authoring tool,
photogrammetry pipeline, or a GLB-generation service against the supplied
reference images. Rather than stub the avatar system out, every species is
implemented as a genuine interactive 3D creature — customizable, animated,
evolving — built from geometry/material composition. See
`docs/AVATAR_SPECIES.md` for how each of the five reference images was
interpreted.

## Current asset contract (procedural)

| Concern | Implementation |
|---|---|
| Body shape | `src/components/avatar3d/ProceduralCreature.tsx` — one shared rig (head/neck/torso/arms/legs/feet as primitive geometry) driven by `species.proportions` |
| Eyes | `src/components/avatar3d/parts/Eyes.tsx` — variant → geometry switch, shared across species |
| Mouth | `src/components/avatar3d/parts/Mouth.tsx` — variant → geometry switch |
| Ears | `src/components/avatar3d/parts/Ears.tsx` — variant → geometry switch |
| Body pattern | `src/components/avatar3d/parts/patternTexture.ts` — canvas-drawn `THREE.CanvasTexture`, generated at runtime from `(patternVariant, seed, bodyColor, secondaryColor)` |
| Colors | Three independent hex color props (`bodyColor`, `secondaryColor`, `faceColor`) applied directly to `meshStandardMaterial`/`meshPhysicalMaterial` instances |
| Evolution detail | `src/lib/evolution.ts` `getVisualDetailForLevel()` — continuous 0-1 knobs (`silhouetteComplexity`, `materialSophistication`, `glow`, `accessoryProminence`, `scale`) interpolated per level, consumed by the rig to scale accessories/glow/material roughness |
| Animation | Per-frame procedural transforms in `ProceduralCreature.tsx`'s `useFrame` callback, keyed by an `AnimationState` string prop (`idle`/`sleep`/`eat`/`clean`/`play`/`illness`/`recovery`/`celebration`/`comfort`/`walk`) |
| Lighting/scene | `src/components/avatar3d/SceneEnvironment.tsx` — day/dusk/night lighting rigs, contact shadows, environment map |

## Production GLB asset contract (for future replacement)

A production art pipeline should target this contract so it drops in via
`species.modelAsset` (see `docs/AVATAR_SPECIES.md`) with zero changes to
onboarding, the pet dashboard, evolution logic, or persistence:

### File format & delivery
- glTF 2.0 binary (`.glb`), Draco-compressed mesh data.
- One file per species per evolution stage is acceptable
  (`roundling-hatchling.glb`, `roundling-radiant.glb`, ...) **or** a single
  rigged file per species with blend shapes / bone scale driving the
  stage progression — either is compatible with the loader contract, since
  `AvatarSpecies.evolutionStages[].` entries can each carry their own
  optional `modelAsset` override in a future schema extension.
- Delivered from `public/models/` or a Supabase Storage bucket referenced
  by URL (CLAUDE.md already scopes Supabase Storage for "optional storage
  of versioned 3D models, textures, and environment assets").

### Required animation clips (names must match `AnimationMap` values)
`idle`, `sleep`, `eat`, `clean`, `play`, `illness`, `recovery`,
`celebration`, `comfort`, `walk`, plus one clip per personality id listed
in that species' `personalities` array (used as an idle variant overlay).

### Required material slots
Exactly three materials named `body`, `secondary`, and `face`, so runtime
code can do `material.color.set(bodyColor)` etc. without per-species
special-casing. `species.materialSlots` already documents the intended
metalness/roughness/clearcoat starting point per slot per species.

### Required morph targets / bone attachment points (for trait variants)
- A `head` bone/node with child attachment slots for eyes, mouth, and ears,
  OR five pre-built morph targets per trait category (eyes/mouth/ears)
  matching the variant lists in each species' manifest
  (`eyeVariants`, `mouthVariants`, `earVariants`).
- A `pattern` UV set on the body mesh compatible with a runtime-generated
  or pre-baked pattern texture per `patternVariants`.

### Scale & pivot
- Model origin at ground contact point (feet), facing +Z, 1 unit = 1 meter
  at the "adventurer" stage scale (`detail.scale ≈ 1.0`), so the existing
  `detail.scale` multiplier from `getVisualDetailForLevel()` continues to
  work unmodified.

## Swapping a species over to GLB

See "Replacing a procedural species with a production GLB" at the bottom
of `docs/AVATAR_SPECIES.md` for the exact integration steps.
