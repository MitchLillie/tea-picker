import {useMemo, useState} from 'react'

import {TextInput, Touchable, useProductSearch} from '@shopify/shop-minis-react'

import {useApp} from '../state/app'
import {classify, purity, TEA_CATEGORY} from '../tea/catalog'
import {searchTeas} from '../tea/teas'
import type {Tea} from '../tea/types'
import {Page, PickerSays, SectionTitle} from '../ui/kit'

import {Lineage, TeaName} from './TeaCard'

const SUGGESTIONS = ['Tieguanyin', 'Gyokuro', 'Da Hong Pao', 'Silver Needle', 'Hōjicha', 'Shou Pu’er']

export function Leaf() {
  const {push} = useApp()
  const [q, setQ] = useState('')
  const local = useMemo(() => searchTeas(q, 8), [q])

  // Also look in the Shop: a product the drinker owns can be the baseline.
  const shop = useProductSearch({
    query: q,
    first: 20,
    filters: {category: [TEA_CATEGORY]},
    skip: q.trim().length < 3,
  })
  const fromShop = useMemo(() => {
    const seen = new Set(local.map(t => t.id))
    const out: {title: string; tea: Tea}[] = []
    for (const p of shop.products ?? []) {
      if (!purity(p.title).ok) continue
      const tea = classify(p.title)
      if (!tea || seen.has(tea.id)) continue
      seen.add(tea.id)
      out.push({title: p.title, tea})
    }
    return out.slice(0, 5)
  }, [shop.products, local])

  const open = (tea: Tea) => push({id: 'tea', teaId: tea.id})

  return (
    <Page glyph="叶" title="Leaf" subtitle="Name a tea you love">
      <PickerSays>Tell me one tea you know well. I will find you the same leaf — and its kin.</PickerSays>
      <div className="mt-6">
        <TextInput
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Longjing, 铁观音, gyokuro…"
          className="h-12 rounded-[3px] border-[1.5px] border-ink-20 bg-paper-light px-4 text-[17px] text-ink"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </div>

      {q.trim().length < 2 ? (
        <>
          <SectionTitle>Perhaps</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <Touchable
                key={s}
                onClick={() => setQ(s)}
                className="flex min-h-12 items-center rounded-[3px] border border-ink-20 px-3 text-[15px] italic text-ink"
              >
                {s}
              </Touchable>
            ))}
          </div>
        </>
      ) : (
        <>
          <SectionTitle>In the record</SectionTitle>
          {local.length ? (
            <ul className="divide-y divide-ink-10">
              {local.map(t => (
                <li key={t.id}>
                  <Touchable onClick={() => open(t)} className="block py-3">
                    <TeaName tea={t} size="md" />
                    <div className="mt-1">
                      <Lineage tea={t} />
                    </div>
                  </Touchable>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[15px] italic text-ink-60">
              I don’t know that name. Try its pinyin, its characters, or another name for it.
            </p>
          )}
          {fromShop.length > 0 && (
            <>
              <SectionTitle>Found in the Shop</SectionTitle>
              <ul className="divide-y divide-ink-10">
                {fromShop.map(({title, tea}) => (
                  <li key={tea.id}>
                    <Touchable onClick={() => open(tea)} className="block py-3">
                      <div className="text-[15px] text-ink">{title}</div>
                      <div className="mt-0.5 text-[13px] italic text-ink-60">
                        is {tea.name.en} — <span className={tea.node.startsWith('jp') ? 'han-jp' : 'han'}>{tea.name.native}</span>
                      </div>
                    </Touchable>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </Page>
  )
}
