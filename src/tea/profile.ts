import type {AromaDim, Profile, TasteDim} from './types'

export type Fire = 'none' | 'light' | 'medium' | 'heavy'
export type AgeStance = 'yes' | 'curious' | 'no'
export type AnchorVerdict = 'love' | 'dislike'

/** Every field is optional: a skipped question simply carries no weight. */
export interface SurveyAnswers {
  anchors: Record<string, AnchorVerdict>
  oxidation?: number
  fire?: Fire
  aromas: AromaDim[]
  body?: number
  umami?: number
  /** Tolerance, 0 = none, 1 = welcome. */
  astringency?: number
  bitterness?: number
  age?: AgeStance
}

export const EMPTY_ANSWERS: SurveyAnswers = {anchors: {}, aromas: []}

export const FIRE_LEVEL: Record<Fire, number> = {
  none: 0,
  light: 0.3,
  medium: 0.6,
  heavy: 0.9,
}

/** Teas offered as calibration anchors, chosen to span the classes. */
export const ANCHOR_TEAS = [
  'xihu-longjing',
  'sencha',
  'matcha-usucha',
  'genmaicha',
  'jasmine-pearls',
  'bai-mudan',
  'tieguanyin-qingxiang',
  'da-hong-pao',
  'oriental-beauty',
  'dian-hong',
  'lapsang-smoked',
  'shou-puer',
] as const

export const TASTE_LABELS: Record<TasteDim, {en: string; native: string}> = {
  oxidation: {en: 'oxidation', native: '发酵度'},
  roast: {en: 'roast', native: '焙火'},
  body: {en: 'body', native: '醇厚'},
  umami: {en: 'umami', native: '鲜 · 旨味'},
  astringency: {en: 'astringency', native: '涩'},
  bitterness: {en: 'bitterness', native: '苦'},
  sweetness: {en: 'sweetness', native: '甘'},
  age: {en: 'age', native: '陈'},
}

export const AROMA_LABELS: Record<AromaDim, {en: string; native: string; hint: string}> = {
  vegetal: {en: 'Fresh greens', native: '清香', hint: 'cut grass, spring peas, edamame'},
  marine: {en: 'Seaweed', native: '海苔香', hint: 'nori, ocean air, broth'},
  chestnut: {en: 'Chestnut & toast', native: '栗香', hint: 'roasted chestnut, toasted rice, caramel'},
  floral: {en: 'Orchid & blossom', native: '兰香', hint: 'orchid, lilac, gardenia'},
  fruit: {en: 'Honey & fruit', native: '蜜香', hint: 'honey, apricot, longan, muscat'},
  malt: {en: 'Malt & cocoa', native: '薯香', hint: 'malt, sweet potato, cocoa'},
  mineral: {en: 'Mineral', native: '岩韵', hint: 'wet stone, rock rhyme'},
  smoke: {en: 'Pine smoke', native: '松烟', hint: 'pine resin, campfire'},
  woody: {en: 'Aged wood', native: '陈香', hint: 'camphor, old wood, jujube'},
  earthy: {en: 'Forest floor', native: '堆味', hint: 'damp earth, cellar, mushroom'},
  scented: {en: 'Flower-scented', native: '窨香', hint: 'leaf layered with jasmine or osmanthus'},
}

export const describeLevel = (v: number) =>
  v < 0.15 ? 'none' : v < 0.35 ? 'light' : v < 0.6 ? 'medium' : v < 0.8 ? 'pronounced' : 'intense'

/** Top aroma families of a profile, strongest first. */
export const topAromas = (p: Profile, n = 3, min = 0.45): AromaDim[] =>
  (Object.keys(AROMA_LABELS) as AromaDim[])
    .filter(a => p[a] >= min)
    .sort((a, b) => p[b] - p[a])
    .slice(0, n)
