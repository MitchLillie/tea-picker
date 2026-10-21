import {classify, purity} from './catalog'
import {ANCHOR_TEAS} from './profile'
import {getNode, isLeafNode} from './taxonomy'
import {ALIAS_INDEX, TEAS, getTea, namesOf} from './teas'
import {AROMA_DIMS, TASTE_DIMS} from './types'

/** Integrity checks over the knowledge base. Returns human-readable errors. */
export const validateTeas = (): string[] => {
  const errors: string[] = []
  const ids = new Set<string>()

  for (const t of TEAS) {
    const at = `[${t.id}]`
    if (ids.has(t.id)) errors.push(`${at} duplicate id`)
    ids.add(t.id)

    if (!getNode(t.node)) errors.push(`${at} unknown node ${t.node}`)
    else if (!isLeafNode(t.node)) errors.push(`${at} node ${t.node} is not a leaf`)

    for (const d of [...TASTE_DIMS, ...AROMA_DIMS]) {
      const v = t.profile[d]
      if (typeof v !== 'number' || Number.isNaN(v) || v < 0 || v > 1)
        errors.push(`${at} ${d}=${v} outside 0–1`)
    }
    if (!AROMA_DIMS.some(d => t.profile[d] >= 0.4))
      errors.push(`${at} has no defining aroma (≥0.4)`)

    for (const name of namesOf(t)) {
      const p = purity(name)
      if (!p.ok) errors.push(`${at} own name "${name}" fails purity on "${p.reason}"`)
    }

    const fromQuery = classify(t.query)
    if (fromQuery?.family !== t.family)
      errors.push(`${at} query "${t.query}" classifies as ${fromQuery?.id ?? 'nothing'}`)
    const fromName = classify(t.name.en)
    if (fromName?.family !== t.family)
      errors.push(`${at} English name classifies as ${fromName?.id ?? 'nothing'}`)
  }

  const owner = new Map<string, string>()
  for (const a of ALIAS_INDEX) {
    const prev = owner.get(a.key)
    if (prev && getTea(prev)?.family !== a.tea.family)
      errors.push(`alias "${a.key}" shared by ${prev} and ${a.tea.id}`)
    owner.set(a.key, a.tea.id)
  }

  for (const id of ANCHOR_TEAS)
    if (!getTea(id)) errors.push(`anchor ${id} is not a tea`)

  return errors
}
