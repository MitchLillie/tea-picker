import type {ReactNode} from 'react'

import {Touchable} from '@shopify/shop-minis-react'

import {useApp} from '../state/app'
import {AROMA_LABELS, TASTE_LABELS, describeLevel, topAromas} from '../tea/profile'
import {getBrew, getPath} from '../tea/taxonomy'
import type {Tea, TasteDim} from '../tea/types'

const KILL: Record<Tea['kill'], string> = {
  pan: 'pan-fired',
  steam: 'steamed',
  bake: 'baked',
  sun: 'sun-dried',
  none: 'no kill-green',
}

/** Tea names in the right script: Japanese teas take a Japanese typeface. */
export function TeaName({tea, size = 'lg'}: {tea: Tea; size?: 'lg' | 'md'}) {
  const {nameOf} = useApp()
  const {primary, secondary} = nameOf(tea)
  const jp = tea.node.startsWith('jp')
  const hanClass = jp ? 'han-jp' : 'han'
  const isNative = (s: string) => s === tea.name.native
  return (
    <div>
      <div className={`${isNative(primary) ? hanClass : ''} ${size === 'lg' ? 'text-[26px]' : 'text-[19px]'} leading-tight text-ink`}>
        {primary}
      </div>
      <div className={`${isNative(secondary) ? hanClass : 'italic'} mt-0.5 text-[14px] text-ink-80`}>
        {secondary}
        {primary !== tea.name.roman && secondary !== tea.name.roman && <span className="italic"> · {tea.name.roman}</span>}
      </div>
    </div>
  )
}

/** "中国茶 › 乌龙茶 › 闽北" — where a tea sits in the classification. */
export function Lineage({tea, onNode}: {tea: Tea; onNode?: (id: string) => void}) {
  const path = getPath(tea.node)
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-ink-80">
      {path.map((n, i) => (
        <span key={n.id} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-ink-40">›</span>}
          {onNode ? (
            <Touchable onClick={() => onNode(n.id)} className="underline decoration-ink-20 underline-offset-4">
              <span className="han">{n.name.native}</span> <span className="italic">{n.name.en}</span>
            </Touchable>
          ) : (
            <span>
              <span className="han">{n.name.native}</span> <span className="italic">{n.name.en}</span>
            </span>
          )}
        </span>
      ))}
    </div>
  )
}

const SHOWN_TASTE: TasteDim[] = ['oxidation', 'roast', 'body', 'umami', 'astringency', 'bitterness', 'sweetness', 'age']

/** The sensory profile as short brush bars, the way a tasting sheet reads. */
export function ProfileBars({tea}: {tea: Tea}) {
  return (
    <div className="grid grid-cols-2 gap-x-5 gap-y-2">
      {SHOWN_TASTE.map(d => {
        const v = tea.profile[d]
        return (
          <div key={d}>
            <div className="flex items-baseline justify-between text-[12px]">
              <span className="small-caps text-ink-80">{TASTE_LABELS[d].en}</span>
              <span className="han text-ink-40">{TASTE_LABELS[d].native}</span>
            </div>
            <div className="mt-1 h-[5px] w-full rounded-full bg-ink-5">
              <div
                className="h-full rounded-full bg-ink"
                style={{width: `${Math.max(3, v * 100)}%`, opacity: 0.35 + v * 0.6}}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function AromaTags({tea}: {tea: Tea}) {
  return (
    <div className="flex flex-wrap gap-2">
      {topAromas(tea.profile, 4, 0.4).map(a => (
        <span key={a} className="rounded-[3px] border border-ink-20 px-2 py-1 text-[13px] text-ink">
          <span className="han mr-1 text-ink-60">{AROMA_LABELS[a].native}</span>
          {AROMA_LABELS[a].en}
        </span>
      ))}
    </div>
  )
}

export function Facts({tea}: {tea: Tea}) {
  const brew = getBrew(tea.node)
  const rows: [string, ReactNode][] = [
    ['Origin', tea.origin],
    ...(tea.cultivar ? ([['Cultivar', tea.cultivar]] as [string, ReactNode][]) : []),
    ['Processing', `${KILL[tea.kill]} · ${describeLevel(tea.profile.oxidation)} oxidation · ${describeLevel(tea.profile.roast)} roast`],
    ...(brew
      ? ([['Brew', `${brew.practice === 'gongfu' ? 'Gongfu' : brew.practice === 'kyusu' ? 'Kyūsu' : brew.practice === 'whisk' ? 'Whisked' : 'Bowl or glass'} · ${brew.tempC} °C · ${brew.gPer100ml} g per 100 ml`]] as [string, ReactNode][])
      : []),
  ]
  return (
    <dl className="grid grid-cols-[92px_1fr] gap-x-3 gap-y-1.5 text-[14px]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="small-caps pt-[1px] text-[12px] text-ink-60">{k}</dt>
          <dd className="text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

interface TeaCardProps {
  tea: Tea
  reasons?: string[]
  badge?: string
  onOpen?: () => void
  children?: ReactNode
}

/** A recommendation: names, lineage, the why, notes, then whatever follows. */
export function TeaCard({tea, reasons, badge, onOpen, children}: TeaCardProps) {
  return (
    <article className="relative rounded-[4px] border border-ink-10 bg-paper-light/70 p-4 shadow-[0_1px_0_rgba(26,26,24,0.05)]">
      {badge && (
        <div className="small-caps absolute -top-2.5 left-4 bg-paper px-2 text-[12px] text-cinnabar">{badge}</div>
      )}
      <Touchable onClick={onOpen} className="block">
        <TeaName tea={tea} />
        <div className="mt-2">
          <Lineage tea={tea} />
        </div>
      </Touchable>
      {reasons && reasons.length > 0 && (
        <ul className="mt-3 space-y-1">
          {reasons.map(r => (
            <li key={r} className="flex gap-2 text-[14px] text-ink">
              <span className="mt-[7px] h-[6px] w-[6px] shrink-0 rotate-45 bg-cinnabar" />
              {r}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[15px] leading-relaxed text-ink-80">{tea.notes}</p>
      {children && <div className="mt-4">{children}</div>}
    </article>
  )
}
