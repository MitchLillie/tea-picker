/**
 * Sensory model.
 *
 * Taste dimensions follow the 滋味 (taste) factor of GB/T 23776-2018 plus the
 * Japanese 旨味 (umami) assessment; aroma families follow the 香气 descriptors
 * of GB/T 14487-2017 grouped into families a non-specialist can recognise.
 * All values are 0–1.
 */
export const TASTE_DIMS = [
  'oxidation',
  'roast',
  'body',
  'umami',
  'astringency',
  'bitterness',
  'sweetness',
  'age',
] as const
export type TasteDim = (typeof TASTE_DIMS)[number]

export const AROMA_DIMS = [
  'vegetal', // 清香 · 豆香 — fresh-cut greens, beans
  'marine', // 海苔香 — steamed-leaf, seaweed (Japanese steamed teas)
  'chestnut', // 栗香 · 焦糖 — chestnut, toasted grain, roasted rice
  'floral', // 兰香 · 花香 — orchid, gardenia, blossom
  'fruit', // 蜜香 · 果香 — honey, stone fruit, longan, dried fruit
  'malt', // 薯香 · 麦芽 — malt, sweet potato, cocoa
  'mineral', // 岩韵 — "rock rhyme", wet stone
  'smoke', // 松烟 — pine smoke
  'woody', // 陈香 · 樟香 · 枞味 — aged wood, camphor, old-bush moss
  'earthy', // 堆味 · 陈味 — forest floor, cellar, pile-fermentation
  'scented', // 窨制 — real flowers layered with the leaf
] as const
export type AromaDim = (typeof AROMA_DIMS)[number]

export type Profile = Record<TasteDim, number> & Record<AromaDim, number>

export type Tradition = 'cn' | 'tw' | 'jp'

export type KillMethod = 'pan' | 'steam' | 'bake' | 'sun' | 'none'

export type LeafForm =
  | 'needle'
  | 'flat'
  | 'curled'
  | 'strip'
  | 'twisted'
  | 'ball'
  | 'pellet'
  | 'pressed'
  | 'powder'
  | 'stem'
  | 'broken'
  | 'blend'

export type Practice = 'gongfu' | 'kyusu' | 'bowl' | 'whisk'

export interface Tea {
  id: string
  /** Teas sharing a family are "identical" in style (e.g. all Tieguanyin). */
  family: string
  name: {
    en: string
    /** Hanzi or kanji, as written in the tea's homeland. */
    native: string
    /** Pinyin, Taiwanese Mandarin romanisation, or Hepburn romaji. */
    roman: string
  }
  /** Extra names used by sellers; matched case/diacritic-insensitively. */
  aliases: string[]
  /** Taxonomy node id this tea sits under (a leaf of taxonomy.ts). */
  node: string
  origin: string
  cultivar?: string
  kill: KillMethod
  form: LeafForm
  profile: Profile
  /** Tasting note in the vocabulary of GB/T 14487 (liquor · aroma · taste). */
  notes: string
  /** Single best Shop search query. */
  query: string
  /** Shopify taxonomy category GID suffix under fb-1-14-2, if more specific. */
  shopCategory?: string
  /** Set when a tea is a modern grade or cultivar inside a traditional style. */
  modern?: string
}
