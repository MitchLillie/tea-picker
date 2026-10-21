import {Touchable} from '@shopify/shop-minis-react'

import {Glyph} from '../scene/ink/Glyph'
import {useApp} from '../state/app'
import {TAXONOMY, getNode, getPath, glyphFor, type TaxonNode} from '../tea/taxonomy'
import {TEAS, teasUnder} from '../tea/teas'
import {Page, PickerSays, SectionTitle} from '../ui/kit'

import {TeaName} from './TeaCard'

const count = (n: TaxonNode) => teasUnder(n.id).length

function Branch({node, onOpen}: {node: TaxonNode; onOpen: () => void}) {
  return (
    <Touchable onClick={onOpen} className="flex min-h-[72px] items-center gap-4 border-b border-ink-10 py-3">
      <Glyph text={glyphFor(node.id)} size={40} className="shrink-0 text-ink" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[18px] text-ink">{node.name.en}</span>
          <span className="han text-[14px] text-ink-60">{node.name.native}</span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-ink-80">{node.about}</p>
      </div>
      <span className="small-caps shrink-0 text-[12px] text-ink-40">{count(node)}</span>
    </Touchable>
  )
}

export function Atlas({node: nodeId}: {node?: string}) {
  const {push} = useApp()
  const node = nodeId ? getNode(nodeId) : undefined

  if (!node) {
    return (
      <Page glyph="谱" title="Atlas" subtitle="The family of tea">
        <PickerSays>
          Every tea is the same plant. What divides them is the making — above all, how far the leaf is let to change.
        </PickerSays>
        <p className="mt-4 text-[13px] text-ink-60">
          {TEAS.length} teas, classed by the Chinese national standard GB/T 30766 and the Japanese tradition.
        </p>
        <div className="mt-6">
          {TAXONOMY.map(n => (
            <Branch key={n.id} node={n} onOpen={() => push({id: 'atlas', node: n.id})} />
          ))}
        </div>
      </Page>
    )
  }

  const trail = getPath(node.id).slice(0, -1)
  const teas = node.children?.length ? [] : teasUnder(node.id)

  return (
    <Page glyph={glyphFor(node.id)} title={node.name.en} subtitle={node.name.native}>
      {trail.length > 0 && (
        <p className="mb-3 text-[13px] text-ink-60">
          {trail.map(t => t.name.en).join(' › ')}
        </p>
      )}
      <p className="text-[16px] leading-relaxed text-ink">{node.about}</p>
      {node.children?.length ? (
        <div className="mt-6">
          {node.children.map(c => (
            <Branch key={c.id} node={c} onOpen={() => push({id: 'atlas', node: c.id})} />
          ))}
        </div>
      ) : (
        <>
          <SectionTitle>Teas</SectionTitle>
          <ul className="divide-y divide-ink-10">
            {teas.map(t => (
              <li key={t.id}>
                <Touchable onClick={() => push({id: 'tea', teaId: t.id})} className="block py-3">
                  <TeaName tea={t} size="md" />
                  <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-ink-80">{t.origin}</p>
                </Touchable>
              </li>
            ))}
          </ul>
        </>
      )}
    </Page>
  )
}
