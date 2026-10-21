import {AROMA_LABELS, FIRE_LEVEL, type SurveyAnswers} from './profile'
import {TEAS, classOf, familyOf, getTea} from './teas'
import {AROMA_DIMS, TASTE_DIMS, type Profile, type Tea} from './types'

/** Weights for tea-to-tea distance. Processing-defining dimensions weigh most. */
const WEIGHTS: Profile = {
  oxidation: 2.5,
  roast: 1.5,
  body: 1,
  umami: 1.2,
  astringency: 0.7,
  bitterness: 0.7,
  sweetness: 0.6,
  age: 1.8,
  vegetal: 1,
  marine: 1.2,
  chestnut: 1,
  floral: 1,
  fruit: 1,
  malt: 1.2,
  mineral: 1.2,
  smoke: 1.8,
  woody: 1,
  earthy: 1.4,
  scented: 2.5,
}
const DIMS = [...TASTE_DIMS, ...AROMA_DIMS] as const
const MAX_DIST = Math.sqrt(DIMS.reduce((s, d) => s + WEIGHTS[d], 0))

export const distance = (a: Profile, b: Profile) =>
  Math.sqrt(DIMS.reduce((s, d) => s + WEIGHTS[d] * (a[d] - b[d]) ** 2, 0))

/** 0 (opposite) … 1 (same profile). */
export const similarity = (a: Profile, b: Profile) =>
  1 - distance(a, b) / MAX_DIST

export interface Ranked {
  tea: Tea
  score: number
  reasons: string[]
}

// ── Identical ────────────────────────────────────────────────────────────

/** Same named style: the tea itself first, then its family variants. */
export const identicalTo = (teaId: string): Tea[] => {
  const tea = getTea(teaId)
  if (!tea) return []
  return [tea, ...familyOf(tea.family).filter(t => t.id !== tea.id)]
}

// ── Similar ──────────────────────────────────────────────────────────────

const contrast = (base: Tea, other: Tea): string[] => {
  const out: string[] = []
  const shared = AROMA_DIMS.filter(
    a => base.profile[a] >= 0.5 && other.profile[a] >= 0.5
  ).sort((a, b) => other.profile[b] - other.profile[a])
  if (shared.length)
    out.push(
      `Shares the ${shared
        .slice(0, 2)
        .map(a => AROMA_LABELS[a].en.toLowerCase())
        .join(' and ')} character`
    )
  const diffs: [keyof Profile, string, string][] = [
    ['roast', 'more roast', 'lighter roast'],
    ['oxidation', 'more oxidised', 'fresher, less oxidised'],
    ['body', 'fuller body', 'lighter body'],
    ['umami', 'more savoury', 'less savoury'],
    ['sweetness', 'sweeter', 'drier'],
    ['bitterness', 'more bitter edge', 'gentler, less bitter'],
    ['age', 'more aged depth', 'younger, brighter'],
  ]
  const [dim, up, down] = diffs
    .map(d => [d, other.profile[d[0]] - base.profile[d[0]]] as const)
    .filter(([, delta]) => Math.abs(delta) >= 0.2)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))[0]?.[0] ?? []
  if (dim) out.push(other.profile[dim] > base.profile[dim] ? up! : down!)
  if (!out.length) {
    const lead = AROMA_DIMS.filter(a => other.profile[a] >= 0.4).sort(
      (a, b) => other.profile[b] - other.profile[a]
    )[0]
    out.push(
      lead
        ? `A close overall balance, leaning ${AROMA_LABELS[lead].en.toLowerCase()}`
        : 'A close overall balance'
    )
  }
  return out
}

/**
 * Nearest teas by sensory distance, excluding the base family. At most two
 * results may come from any one taxonomy node, so the list spans styles.
 */
export const similarTo = (teaId: string, limit = 6): Ranked[] => {
  const base = getTea(teaId)
  if (!base) return []
  const perNode = new Map<string, number>()
  const seenFamilies = new Set([base.family])
  const out: Ranked[] = []
  const candidates = TEAS.filter(t => t.family !== base.family)
    .map(t => ({tea: t, score: similarity(base.profile, t.profile)}))
    .sort((a, b) => b.score - a.score)
  for (const c of candidates) {
    if (out.length >= limit) break
    if (seenFamilies.has(c.tea.family)) continue
    const n = perNode.get(c.tea.node) ?? 0
    if (n >= 2) continue
    perNode.set(c.tea.node, n + 1)
    seenFamilies.add(c.tea.family)
    out.push({...c, reasons: contrast(base, c.tea)})
  }
  return out
}

// ── Survey ───────────────────────────────────────────────────────────────

const AGED = 0.35

export const surveyScore = (tea: Tea, a: SurveyAnswers): Ranked | null => {
  const p = tea.profile
  const reasons: string[] = []
  let score = 0

  if (a.age === 'no' && p.age > AGED) return null
  if (Object.entries(a.anchors).some(
    ([id, v]) => v === 'dislike' && getTea(id)?.family === tea.family
  ))
    return null

  const near = (dim: keyof Profile, target: number | undefined, w: number, label: string) => {
    if (target === undefined) return
    const d = Math.abs(p[dim] - target)
    score -= w * d * d * 4
    if (d < 0.12) reasons.push(label)
  }
  near('oxidation', a.oxidation, 2.5, 'Oxidation where you like it')
  near('roast', a.fire && FIRE_LEVEL[a.fire], 1.6, a.fire === 'none' ? 'Unroasted, as you prefer' : `A ${a.fire} roast, as you prefer`)
  near('body', a.body, 1, 'The body you asked for')
  near('umami', a.umami, 1.2, 'Savoury depth to your taste')

  const ceiling = (dim: 'astringency' | 'bitterness', tol: number | undefined) => {
    if (tol === undefined) return
    const over = p[dim] - (0.2 + tol * 0.8)
    if (over > 0) score -= 3 * over * over * 4
    // A drinker who actively welcomes it is drawn toward teas that have it.
    if (tol > 0.6) score += 3 * (tol - 0.6) * p[dim]
  }
  ceiling('astringency', a.astringency)
  ceiling('bitterness', a.bitterness)

  for (const aroma of a.aromas) {
    score += 1.6 * p[aroma]
    if (p[aroma] >= 0.5) reasons.push(`${AROMA_LABELS[aroma].en} — ${AROMA_LABELS[aroma].hint.split(',')[0]}`)
  }
  // Polarising aromas count against a tea unless the drinker chose them.
  if (!a.aromas.includes('smoke')) score -= 1.2 * Math.max(0, p.smoke - 0.3)
  if (!a.aromas.includes('scented')) score -= 0.8 * Math.max(0, p.scented - 0.3)
  if (!a.aromas.includes('earthy')) score -= 0.6 * Math.max(0, p.earthy - 0.5)

  if (a.age === 'yes') score += 1 * p.age
  if (a.age === 'curious') score += 0.25 * p.age

  for (const [id, verdict] of Object.entries(a.anchors)) {
    const anchor = getTea(id)
    if (!anchor) continue
    const sim = similarity(anchor.profile, p)
    if (verdict === 'love') {
      score += 2.5 * sim ** 4
      if (id === tea.id) score -= 1.5 // they already know it
      else if (sim > 0.85) reasons.push(`Kin to ${anchor.name.en}, which you love`)
    } else {
      score -= 2.5 * sim ** 6
    }
  }


  return {tea, score, reasons: [...new Set(reasons)].slice(0, 3)}
}

export interface SurveyResult {
  picks: Ranked[]
  /** A well-scoring tea from a class none of the picks belong to. */
  further: Ranked | null
}

export const recommend = (a: SurveyAnswers, count = 3): SurveyResult => {
  const ranked = TEAS.map(t => surveyScore(t, a))
    .filter((r): r is Ranked => r !== null)
    .sort((x, y) => y.score - x.score)
  const picks: Ranked[] = []
  const families = new Set<string>()
  for (const r of ranked) {
    if (picks.length >= count) break
    if (families.has(r.tea.family)) continue
    families.add(r.tea.family)
    picks.push(r)
  }
  const classes = new Set(picks.map(r => classOf(r.tea)))
  const further = ranked.find(r => !classes.has(classOf(r.tea))) ?? null
  return {picks, further}
}
