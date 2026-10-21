# Tea Picker — art & audio asset specification

Every visual asset here currently exists as a procedural placeholder. Hand-made
assets replace them one for one; the code that consumes each is listed.

## Global constraints

| | |
|---|---|
| Total Mini size | **≤ 5 MB** (code ≈ 0.5 MB, music ≤ 1.8 MB → **art budget ≈ 2.5 MB**) |
| First interaction | < 3 s on 5G — the garden layers must not block first paint |
| Formats | Ink washes/textures: **WebP with alpha** (lossy, q≈80). Flat linework: optimised **SVG**. No base64, no web fonts. |
| Palette | Ink `#1a1a18`, paper `#efe8d8` (lighter `#f6f1e6`), cinnabar seal `#b5321f` only |
| Background | Transparent — the app supplies the paper and its grain |

### Scene space
All scenes share a **390 × 844 unit** canvas (portrait) and are fitted with
*cover* (`preserveAspectRatio="xMidYMid slice"`): on taller or wider phones the
edges are cropped. Keep essential content inside **x 20–370, y 60–800**; paint
bleed out to **x −40…430, y −20…900**.

**Raster resolution: 3 px per unit** (1170 × 2532 for a full layer) — except
layers the camera zooms into (marked ⤢), which need **6 px per unit** for the
region given, or should be vector.

---

## 1. Garden (destination & navigation)

Back to front. Each item is a separate transparent layer.

| # | Layer | Extent (units) | Notes | Replaces |
|---|---|---|---|---|
| G1 | Far peaks | y 60–340, full width | Two ranges, paler = farther, feet dissolving into mist | `Garden.tsx › Far` |
| G2 | Cloud sea | y 250–400, full width | Soft, mostly paper-white with faint grey bellies | `CloudSea` |
| G3 | Tea hill + 4 terraces ⤢ | y 360–900 | See terrace geometry below; crest ≈ y 366–392 | `Hill` |
| G4 | Mist between rows | y 455–565 | Two thin drifting bands, alpha only | `RowMist` |
| G5 | Ancient stone ⤢ | base centre (132, 806), **150 × 36** | Seat surface at y ≈ 770 must stay flat-ish; the picker sits at its left half | `Foreground` / `STONE` |
| G6 | Grass tufts | x 30–260, y 770–840 | Optional | `Foreground` |

**Terrace geometry** (the rows are the navigation, so the shapes must match).
Each row's centre-line is a quadratic curve through three points (x = 0, 195, 390);
"bush height" is the painted hedge thickness:

| Row (tap target) | y at x=0 | y at x=195 | y at x=390 | bush height |
|---|---|---|---|---|
| 品 Palate (nearest) | 706 | 672 | 694 | 34 |
| 叶 Leaf | 600 | 574 | 590 | 27 |
| 谱 Atlas | 512 | 492 | 504 | 21 |
| 设 Rest (farthest) | 440 | 424 | 434 | 16 |

Also supply a **highlight variant of each row** (same shape, ink ≈ 25 % darker) —
shown while that row is tapped. Four extra transparent images, cropped to the row.

**Keep clear:**
- **Labels:** right side, x ≈ 230–375, sitting just above each row (≈ 1.5 × bush height above the centre-line). Painting may run under them, but not dark ink.
- **Inscription:** top-left, x 24–260, y 60–140 (the picker's words + small seal).

**Camera dolly (⤢):** tapping a row zooms G3–G6 to **2.9×** and G1–G2 to **1.5×**,
centred on (242, row-y). Those zoomed regions need 6 px/unit or vector.

---

## 2. The climb (opening, ≈ 10 s)

The stairs are drawn live in perspective (they must move continuously), so they
stay in code. Hand-made assets supply everything around them:

| # | Asset | Size (units) | Anchor | Notes | Replaces |
|---|---|---|---|---|---|
| C1 | Distant ranges | 390 × 340, y 40–380 | — | Sinks 70 units during the climb (parallax) | `Journey.tsx` mountain `Layer` |
| C2 | Pines ×4–6 variants | box 220 × 210 | **base of trunk** at (110, 200) in box | Rendered up to ~650 px tall on screen when near → paint at **≥ 700 px tall** | `sprites.ts › pineSprite` |
| C3 | Boulders ×3–4 variants | box 117 × 62 | **middle of base** | Up to ~250 px wide on screen | `sprites.ts › rockSprite` |
| C4 | Step texture (optional) | unit band, 4:1 | — | A single horizontal dry-brush band with ragged ends; scaled onto each stair riser. 8–10 variants, **alpha only (black ink)** | `Climb.tsx › BANDS` |
| C5 | Edge clumps (optional) | 2:1 | centre | Grass/stone dabs at stair edges, 6–8 variants, alpha only | `CLUMPS` |

Vanishing point: x 195, y ≈ 160. Eye level: y 330.

## 3. Cloud transition (≈ 4 s)

The climb fades into white, then the cloud parts left and right to reveal the garden.

| # | Asset | Size (units) | Notes |
|---|---|---|---|
| K1 | Cloud mass, left half | 390 × 844 | Opaque at centre, ragged soft edge on its right; slides 300 units left |
| K2 | Cloud mass, right half | 390 × 844 | Mirror role; slides 300 units right |

Mostly paper-white (`#f6f1e6`), faint ink in the undersides only. 2 px/unit is enough (soft).

---

## 4. The tea picker (character)

Elderly, stooped, conical bamboo hat (斗笠), white beard, loose robe and wide
trousers, woven back-basket (背篓) with leaves, walking stick. **Faces left.**

### Dimensions (scale 1.0)
- Standing height to hat peak: **≈ 130 units**. Feet at y = 0, origin between the feet.
- Shown at **scale 1.45** seated in the garden (≈ 190 units tall → ~570 px on device); walks in from scale **2.9** (≈ 375 units — larger than half the screen). → **paint at ≥ 1200 px figure height.**

### Recommended: cut-out rig (animated in code)
Deliver each part as a separate transparent image, drawn **hanging straight down
from its pivot** (angle 0 = limb vertical), with the pivot marked:

| Part | Length (units) | Pivot in parent | Rotation range |
|---|---|---|---|
| Torso + robe (to mid-thigh) | hip → shoulder 40 | hip | lean 7–13° forward |
| Head + hat + beard (one piece) | hat 50 wide | torso (−4, −44) | ±10° |
| Basket (fixed to torso) | 22 × 40, top at −48 | torso (2…24, −48…−9) | — |
| Upper arm, near / far | 20 | torso (−1, −38) / (4, −38) | −10…+35° |
| Forearm + hand, near / far | 18 | end of upper arm | +20…+55° |
| Thigh, near / far | 25 | hip | −17…+80° |
| Shin + foot, near / far | 26 | end of thigh | −80…0° |
| Stick | 72 | near hand | counter-rotated to stay upright |
| Cup + steam | 10 × 8 | on the stone | steam: 2–3 wisps, alpha only |

Hip height: 52 standing, 39 seated (at scale 1.45: the stone top). Positive
angles swing toward the direction of travel (−x). Far-side limbs ≈ 20 % darker.

### Alternative: frame animation
If painted frame-by-frame instead, at 12 fps on a 400 × 420 px cell:
walk cycle **16 frames** (one stride pair, ≈ 1.6 s at the walk's pace), sit-down
**26 frames** (2.2 s), seated idle **24 frames** (breathing, slight head nod).
Note: ≈ 66 frames is heavy against the 5 MB budget; the rig is strongly preferred.

---

## 5. Seals and calligraphy

Currently Ma Shan Zheng glyphs on a generated cinnabar seal. Hand-carved
versions are welcome: **square, 110 × 110 units, SVG**, intaglio (white
characters on red) unless noted, slightly worn edges.

品 · 叶 · 谱 · 设 (rows) — 归 (back) — 入 (enter) — 静 (relief / red characters) — 采茶人 (title seal, 3 characters: right column 采茶, left column 人)

Title character **茶**: displayed at 150 units; SVG.

Class headers (Atlas): 中 台 日 绿 黄 白 青 红 黑 普 花, plus 品 叶 谱 设 茶 香 甘 醇 鲜 涩 苦 陈 火 人 — single-character SVGs on transparent, any brush style consistent with 茶.

---

## 6. Music

| | |
|---|---|
| Content | Traditional Chinese (guqin, guzheng, xiao, sizhu); public-domain or licensed for in-app use |
| Length | 90–150 s, **seamless loop** (matching loop points) |
| Encoding | Mono, AAC (.m4a) or Opus, ≈ 64 kbps |
| Size | **≤ 1.8 MB** |
| Levels | No fade-in needed — the app fades in over 4 s; normalise to ≈ −16 LUFS |
| Credit | Title, performer, licence, source URL → `src/audio/music.ts` (shown in Rest › Credits) |
