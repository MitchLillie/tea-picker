import {useMemo, useState} from 'react'

import {Touchable} from '@shopify/shop-minis-react'

import {useApp} from '../state/app'
import {identicalTo, similarTo} from '../tea/match'
import {getPath, glyphFor} from '../tea/taxonomy'
import {getTea} from '../tea/teas'
import {Chip, Page, SectionTitle} from '../ui/kit'

import {ShopShelf} from './ShopShelf'
import {AromaTags, Facts, Lineage, ProfileBars, TeaCard, TeaName} from './TeaCard'

type Tab = 'identical' | 'similar'

export function TeaDetail({teaId}: {teaId: string}) {
  const {push} = useApp()
  const tea = getTea(teaId)
  const [tab, setTab] = useState<Tab>('identical')
  const [variant, setVariant] = useState<string | null>(null)
  const family = useMemo(() => identicalTo(teaId), [teaId])
  const kin = useMemo(() => similarTo(teaId, 6), [teaId])
  const [open, setOpen] = useState<string | null>(null)
  if (!tea) return null

  const exact = variant ? getTea(variant) : null
  const cls = getPath(tea.node)[1] ?? getPath(tea.node)[0]

  return (
    <Page glyph={glyphFor(tea.node)} title={cls.name.en} subtitle={cls.name.native}>
      <TeaName tea={tea} />
      <div className="mt-2">
        <Lineage tea={tea} onNode={node => push({id: 'atlas', node})} />
      </div>
      {tea.modern && <p className="mt-2 text-[12px] italic text-ink-60">Note: {tea.modern}</p>}
      <p className="mt-4 text-[16px] leading-relaxed text-ink">{tea.notes}</p>

      <SectionTitle glyph="香">Aroma</SectionTitle>
      <AromaTags tea={tea} />
      <SectionTitle glyph="甘">Taste</SectionTitle>
      <ProfileBars tea={tea} />
      <SectionTitle glyph="茶">The making</SectionTitle>
      <Facts tea={tea} />

      <div className="sticky top-0 z-10 -mx-5 mt-10 bg-paper/95 px-5 py-2 backdrop-blur-sm">
        <div className="grid grid-cols-2 gap-2">
          <Chip selected={tab === 'identical'} onClick={() => setTab('identical')} className="justify-center">
            Identical
          </Chip>
          <Chip selected={tab === 'similar'} onClick={() => setTab('similar')} className="justify-center">
            Similar
          </Chip>
        </div>
      </div>

      {tab === 'identical' ? (
        <div className="mt-4">
          <p className="text-[14px] italic text-ink-80">
            The same leaf, made in the same style: {family.length > 1 ? `${tea.name.en} and its sanctioned variants.` : `only ${tea.name.en}.`}
          </p>
          {family.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip selected={!variant} onClick={() => setVariant(null)}>
                Any style
              </Chip>
              {family.map(t => (
                <Chip key={t.id} selected={variant === t.id} onClick={() => setVariant(t.id)}>
                  {t.name.en}
                </Chip>
              ))}
            </div>
          )}
          <div className="mt-4">
            <ShopShelf key={exact?.id ?? tea.family} tea={exact ?? tea} mode={exact ? 'exact' : 'family'} />
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-5">
          <p className="text-[14px] italic text-ink-80">
            Other teas that sit nearest on the tongue, across styles.
          </p>
          {kin.map(r => (
            <TeaCard key={r.tea.id} tea={r.tea} reasons={r.reasons} onOpen={() => push({id: 'tea', teaId: r.tea.id})}>
              {open === r.tea.id ? (
                <ShopShelf tea={r.tea} />
              ) : (
                <Touchable
                  onClick={() => setOpen(r.tea.id)}
                  className="small-caps flex min-h-12 items-center text-[13px] text-cinnabar"
                >
                  find it in the shop ›
                </Touchable>
              )}
            </TeaCard>
          ))}
        </div>
      )}
    </Page>
  )
}
