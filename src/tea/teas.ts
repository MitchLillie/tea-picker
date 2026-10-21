import {CHINA} from './data/china'
import {JAPAN} from './data/japan'
import {TAIWAN} from './data/taiwan'
import {aliasMatcher, compact, levenshtein, type AliasMatcher} from './normalize'
import {getPath} from './taxonomy'
import type {Tea} from './types'

export const TEAS: Tea[] = [...CHINA, ...TAIWAN, ...JAPAN]

const byId = new Map(TEAS.map(t => [t.id, t]))

export const getTea = (id: string) => byId.get(id)

export const familyOf = (family: string) => TEAS.filter(t => t.family === family)

export const teasUnder = (nodeId: string) =>
  TEAS.filter(t => t.node === nodeId || t.node.startsWith(`${nodeId}.`))

/** Basic class id (e.g. "cn.oolong", "jp.shaded") a tea belongs to. */
export const classOf = (tea: Tea) => getPath(tea.node)[1]?.id ?? tea.node

/** Every name a tea is known by: aliases plus its three display names. */
export const namesOf = (tea: Tea) => [
  tea.name.en,
  tea.name.native,
  tea.name.roman,
  ...tea.aliases,
]

interface IndexedAlias extends AliasMatcher {
  tea: Tea
}

/**
 * All aliases, deduplicated per tea, longest first so that the most specific
 * name wins ("Fukamushi Sencha" before "Sencha").
 */
export const ALIAS_INDEX: IndexedAlias[] = TEAS.flatMap(tea => {
  const seen = new Set<string>()
  return namesOf(tea).flatMap(name => {
    const m = aliasMatcher(name)
    if (!m.key || seen.has(m.key)) return []
    seen.add(m.key)
    return [{...m, tea}]
  })
}).sort((a, b) => b.key.length - a.key.length)

/** Free-text lookup for the Leaf row: English, pinyin, hanzi, romaji, nicknames. */
export const searchTeas = (input: string, limit = 8): Tea[] => {
  const q = compact(input)
  if (q.length < 2) return []
  const best = new Map<string, number>()
  for (const a of ALIAS_INDEX) {
    let score = 0
    if (a.key === q) score = 100
    else if (a.key.startsWith(q)) score = 80 - (a.key.length - q.length) * 0.1
    else if (a.key.includes(q)) score = 60
    else if (q.length >= 5) {
      const d = levenshtein(q, a.key.slice(0, q.length + 1))
      if (d <= (q.length >= 8 ? 2 : 1)) score = 40 - d * 5
    }
    if (score > (best.get(a.tea.id) ?? 0)) best.set(a.tea.id, score)
  }
  return [...best.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => byId.get(id)!)
}
