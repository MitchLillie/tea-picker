import type {ReactNode} from 'react'

import {Touchable} from '@shopify/shop-minis-react'

import {MUSIC} from '../audio/music'
import {useApp, type Settings as S} from '../state/app'
import {Chip, InkButton, InkSlider, Page, PickerSays, SectionTitle} from '../ui/kit'

function Choice<T extends string | undefined>({
  value,
  options,
  onChange,
}: {
  value: T
  options: {id: T; label: string}[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <Chip key={String(o.id)} selected={value === o.id} onClick={() => onChange(o.id)}>
          {o.label}
        </Chip>
      ))}
    </div>
  )
}

function Row({label, children}: {label: string; children: ReactNode}) {
  return (
    <div className="mb-6">
      <p className="small-caps mb-2 text-[13px] text-ink-80">{label}</p>
      {children}
    </div>
  )
}

export function Settings() {
  const {settings, updateSettings, audio, setPalate, palate, push, home} = useApp()
  const set = (p: Partial<S>) => updateSettings(p)
  return (
    <Page glyph="设" title="Rest" subtitle="Settings & sound">
      <PickerSays>Rest here. Change what you like; the garden will remember.</PickerSays>

      <SectionTitle>Sound</SectionTitle>
      <Row label="Music">
        <Choice
          value={settings.sound ? 'on' : 'off'}
          options={[
            {id: 'on', label: 'Playing'},
            {id: 'off', label: 'Silent'},
          ]}
          onChange={v => {
            set({sound: v === 'on'})
            if (v === 'on') audio.start(1.5)
          }}
        />
      </Row>
      <Row label="Volume">
        <InkSlider label="Volume" value={settings.volume} onChange={v => set({volume: v})} left="Faint" right="Full" />
      </Row>

      <SectionTitle>The climb</SectionTitle>
      <Row label="Opening">
        <Choice
          value={settings.intro}
          options={[
            {id: 'first', label: 'Only the first time'},
            {id: 'always', label: 'Every visit'},
          ]}
          onChange={v => set({intro: v})}
        />
      </Row>
      <Row label="Motion">
        <Choice
          value={settings.motion}
          options={[
            {id: 'system', label: 'As my device'},
            {id: 'full', label: 'Full'},
            {id: 'reduced', label: 'Reduced'},
          ]}
          onChange={v => set({motion: v})}
        />
      </Row>

      <SectionTitle>Names</SectionTitle>
      <Row label="Show teas by">
        <Choice
          value={settings.naming}
          options={[
            {id: 'en', label: 'English'},
            {id: 'roman', label: 'Pinyin · Rōmaji'},
            {id: 'native', label: '漢字 · かな'},
          ]}
          onChange={v => set({naming: v})}
        />
      </Row>

      <SectionTitle>Memory</SectionTitle>
      <div className="space-y-3">
        <InkButton variant="ghost" onClick={() => setPalate(null)} disabled={!palate} className="w-full">
          {palate ? 'Forget my palate' : 'No palate remembered'}
        </InkButton>
        <InkButton
          variant="ghost"
          onClick={() => {
            set({intro: 'always'})
            home()
          }}
          className="w-full"
        >
          Climb again next visit
        </InkButton>
      </div>

      <Touchable onClick={() => push({id: 'credits'})} className="mt-10 flex min-h-12 items-center justify-center">
        <span className="small-caps text-[13px] text-ink-60">
          {MUSIC.title ? `Music · ${MUSIC.title}` : 'Credits'} · sources ›
        </span>
      </Touchable>
    </Page>
  )
}

export function Credits() {
  return (
    <Page glyph="谱" title="Credits" subtitle="Sources & licences">
      <SectionTitle>Music</SectionTitle>
      {MUSIC.title ? (
        <p className="text-[15px] leading-relaxed text-ink">
          <span className="italic">{MUSIC.title}</span> — {MUSIC.performer}. {MUSIC.licence}. {MUSIC.source}
        </p>
      ) : (
        <p className="text-[15px] italic text-ink-60">No recording installed.</p>
      )}
      <SectionTitle>Calligraphy</SectionTitle>
      <p className="text-[15px] leading-relaxed text-ink">
        Brush characters drawn from Ma Shan Zheng, © The Ma Shan Zheng Project Authors, under the SIL Open Font Licence 1.1.
      </p>
      <SectionTitle>Classification & tasting</SectionTitle>
      <ul className="space-y-2 text-[15px] leading-relaxed text-ink">
        <li>GB/T 30766-2014 《茶叶分类》 — classification of tea.</li>
        <li>GB/T 22111-2008 《地理标志产品 普洱茶》 — Pu’er.</li>
        <li>GB/T 23776-2018 《茶叶感官审评方法》 — sensory evaluation.</li>
        <li>GB/T 14487-2017 《茶叶感官审评术语》 — sensory terminology.</li>
        <li>Japanese tea categories after the Japan Tea Central Public Interest Incorporated Association (日本茶業中央会).</li>
      </ul>
      <p className="mt-6 text-[13px] italic text-ink-60">
        Products are shown as listed by their merchants; Tea Picker only chooses which to show.
      </p>
    </Page>
  )
}
