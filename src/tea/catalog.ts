import {spaced, compact} from './normalize'
import {ALIAS_INDEX} from './teas'
import type {Tea} from './types'

export const TEA_CATEGORY = 'gid://shopify/TaxonomyCategory/fb-1-14-2'

export const categoriesFor = (tea: Tea) =>
  tea.shopCategory ? [`${TEA_CATEGORY}-${tea.shopCategory}`] : [TEA_CATEGORY]

/**
 * Words that mark a product as flavoured, Western-style, herbal or a
 * non-East-Asian origin. Each may carry an `unless` context in which the word
 * is a legitimate part of a traditional tea's name.
 */
const BANNED: {re: RegExp; unless?: RegExp}[] = [
  {re: /\bearl\b|\bbergamot\b|\blady grey\b/},
  {re: /\bchai\b|\bmasala\b|\bspiced?\b/},
  {re: /\bbreakfast\b|\bafternoon blend\b|\brussian caravan\b/},
  {re: /\bflavou?r(ed|s)?\b|\bnatural flavou?r|\baroma oil\b|\bextract\b/},
  {re: /\binfused?\b|\binfusion\b|\btisane\b|\bherbal\b|\bdetox\b|\bslim/},
  {re: /\brooibos\b|\bhoneybush\b|\bhibiscus\b|\bchamomile\b|\bmint\b|\bpeppermint\b|\bspearmint\b|\blemongrass\b|\bturmeric\b|\bginger\b|\bginseng\b|\byerba\b|\bmate\b|\bguayusa\b|\bmoringa\b|\bbutterfly pea\b|\bbarley\b|\bbuckwheat\b|\bsoba\b/},
  {re: /\bpeach\b|\bmango\b|\bberr(y|ies)\b|\bstrawberr|\braspberr|\bblueberr|\bcherr(y|ies)\b|\blemon\b|\blime\b|\borange\b|\bcitrus\b|\bapple\b|\bpassion ?fruit\b|\bpineapple\b|\bcoconut\b|\bpomegranate\b|\blychee\b|\blitchi\b|\byuzu\b|\bplum\b/, unless: /\bhong mei\b|\bred plum\b|\bplum blossom\b/},
  {re: /\bvanilla\b|\bcaramel\b|\bchocolate\b|\bcinnamon\b|\bcardamom\b|\bclove\b|\bmilk\b|\bcream\b|\btoffee\b|\bmaple\b/, unless: /\bjin ?xuan\b|\bruby\b/},
  {re: /\brose\b|\blavender\b|\bhibiscus\b|\bchrysanthemum\b/},
  {re: /\blatte\b|\bsweetened\b|\binstant\b|\bmix\b|\bboba\b|\bbubble\b|\bkombucha\b|\biced tea\b|\bready to drink\b|\bcold brew bottle/},
  {re: /\bdarjeeling\b|\bassam\b|\bceylon\b|\bkenya\b|\bnilgiri\b|\bnepal\b|\bkorea\b|\bvietnam\b|\bthai\b|\bindia\b|\bsri lanka\b|\bgeorgia\b|\bturkish\b|\bengland\b|\benglish\b|\birish\b|\bscottish\b|\bparisian\b|\bfrench\b/, unless: /\bsun ?moon lake\b|\byuchi\b|\btaiwan|\bttes\b|\bassamica\b/},
  {re: /\bgaba\b|\bred oolong\b|\bhong wulong\b|\bwakoucha\b|\bwakocha\b|\bjapanese black\b/},
  {re: /\bctc\b|\bfannings\b|\bdust\b|\bbroken\b/},
  {re: /\btea ?pot\b|\bteapot\b|\bkettle\b|\bcup\b|\bmug\b|\bkyusu\b|\bgaiwan\b|\bwhisk\b|\bchasen\b|\bstrainer\b|\binfuser\b|\btray\b|\bcanister\b|\bcaddy\b|\bscoop\b|\bset\b|\bsampler\b|\bgift box\b|\bcandle\b|\bsoap\b|\blotion\b|\bmask\b/},
]

export interface Purity {
  ok: boolean
  reason?: string
}

export const purity = (title: string): Purity => {
  const s = spaced(title)
  for (const {re, unless} of BANNED) {
    const m = re.exec(s)
    if (m && !(unless && unless.test(s))) return {ok: false, reason: m[0]}
  }
  return {ok: true}
}

/**
 * Maps a product title to the most specific tea it names: the longest alias
 * found wins; on a tie, the one appearing earliest in the title.
 */
export const classify = (title: string): Tea | null => {
  const t = {spaced: spaced(title), compact: compact(title)}
  let best: {tea: Tea; len: number; at: number} | null = null
  for (const a of ALIAS_INDEX) {
    if (best && a.key.length < best.len) break // index is longest-first
    const at = a.test(t)
    if (at < 0) continue
    if (!best || a.key.length > best.len || at < best.at)
      best = {tea: a.tea, len: a.key.length, at}
  }
  return best?.tea ?? null
}

export type MatchMode = 'family' | 'exact'

/** Whether a product genuinely is the given tea (or, in family mode, its style). */
export const productIs = (title: string, tea: Tea, mode: MatchMode = 'family') => {
  if (!purity(title).ok) return false
  const hit = classify(title)
  if (!hit) return false
  return mode === 'exact' ? hit.id === tea.id : hit.family === tea.family
}
