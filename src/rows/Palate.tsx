import {useState, type ReactNode} from 'react'

import {Touchable} from '@shopify/shop-minis-react'
import {AnimatePresence, motion} from 'motion/react'

import {useApp} from '../state/app'
import {
  ANCHOR_TEAS,
  AROMA_LABELS,
  EMPTY_ANSWERS,
  type AgeStance,
  type Fire,
  type SurveyAnswers,
} from '../tea/profile'
import {getTea} from '../tea/teas'
import {AROMA_DIMS} from '../tea/types'
import {Chip, InkButton, InkSlider, Page, PickerSays} from '../ui/kit'

interface Step {
  key: string
  glyph: string
  name: string
  says: string
  /** Standard the step draws on, shown small beneath the question. */
  basis: string
  body: (a: SurveyAnswers, set: (p: Partial<SurveyAnswers>) => void) => ReactNode
}

const oxidationExample = (v: number) =>
  v < 0.12
    ? 'Longjing · Sencha · Gyokuro'
    : v < 0.3
      ? 'Tieguanyin · Baozhong · Alishan'
      : v < 0.5
        ? 'Da Hong Pao · Dancong · Dong Ding'
        : v < 0.75
          ? 'Oriental Beauty'
          : 'Keemun · Dian Hong · Lapsang'

const FIRES: {id: Fire; label: string; hint: string}[] = [
  {id: 'none', label: 'Unfired', hint: 'leaf as it is — green, floral'},
  {id: 'light', label: 'Light fire', hint: 'a warm edge, still bright'},
  {id: 'medium', label: 'Medium fire', hint: 'toasted grain, ripe fruit'},
  {id: 'heavy', label: 'Heavy charcoal', hint: 'deep roast, coffee and stone'},
]

const AGES: {id: AgeStance; label: string; hint: string}[] = [
  {id: 'yes', label: 'Yes, gladly', hint: 'aged and fermented teas'},
  {id: 'curious', label: 'Curious', hint: 'show me, gently'},
  {id: 'no', label: 'Not for me', hint: 'keep my teas young'},
]

const STEPS: Step[] = [
  {
    key: 'anchors',
    glyph: '茶',
    name: 'Teas you know',
    says: 'Start with the teas you already know. Tap once for those you love, twice for those you don’t.',
    basis: 'Calibration against reference teas',
    body: (a, set) => (
      <div className="grid grid-cols-2 gap-2">
        {ANCHOR_TEAS.map(id => {
          const tea = getTea(id)!
          const v = a.anchors[id]
          const next = () => {
            const anchors = {...a.anchors}
            if (!v) anchors[id] = 'love'
            else if (v === 'love') anchors[id] = 'dislike'
            else delete anchors[id]
            set({anchors})
          }
          return (
            <Touchable
              key={id}
              onClick={next}
              className={`relative flex min-h-[60px] flex-col justify-center rounded-[3px] border-[1.5px] px-3 py-2 transition-colors duration-300 ${
                v === 'love' ? 'border-cinnabar bg-cinnabar-soft' : v === 'dislike' ? 'border-ink-20 bg-ink-5' : 'border-ink-20'
              }`}
            >
              <span className={`text-[15px] leading-tight ${v === 'dislike' ? 'text-ink-40 line-through decoration-ink-60' : 'text-ink'}`}>
                {tea.name.en}
              </span>
              <span className={`${tea.node.startsWith('jp') ? 'han-jp' : 'han'} text-[12px] text-ink-60`}>{tea.name.native}</span>
              {v && (
                <span className={`small-caps absolute right-2 top-1.5 text-[11px] ${v === 'love' ? 'text-cinnabar' : 'text-ink-60'}`}>
                  {v === 'love' ? 'loved' : 'not for me'}
                </span>
              )}
            </Touchable>
          )
        })}
      </div>
    ),
  },
  {
    key: 'oxidation',
    glyph: '红',
    name: 'Transformation',
    says: 'How far should the leaf be allowed to change? Fresh leaf tastes of spring; oxidised leaf of fruit, honey and bread.',
    basis: 'Degree of oxidation (发酵度), the axis of the six classes — GB/T 30766',
    body: (a, set) => (
      <div>
        <InkSlider
          label="Oxidation"
          value={a.oxidation}
          onChange={v => set({oxidation: v})}
          left="Fresh & green"
          right="Deeply oxidised"
          graded
        />
        <p className="mt-4 text-center text-[14px] text-ink-80">
          {a.oxidation === undefined ? 'Slide to choose' : <>like <span className="italic">{oxidationExample(a.oxidation)}</span></>}
        </p>
      </div>
    ),
  },
  {
    key: 'fire',
    glyph: '火',
    name: 'Fire',
    says: 'After the making, some leaf is roasted again over charcoal. How much fire do you like in the cup?',
    basis: 'Roast level (焙火) — light 轻火, medium 中火, heavy 足火',
    body: (a, set) => (
      <div className="space-y-2">
        {FIRES.map(f => (
          <Chip key={f.id} selected={a.fire === f.id} onClick={() => set({fire: f.id})} className="w-full">
            <span className="flex flex-col">
              <span className="text-[16px]">{f.label}</span>
              <span className="text-[13px] italic opacity-75">{f.hint}</span>
            </span>
          </Chip>
        ))}
      </div>
    ),
  },
  {
    key: 'aroma',
    glyph: '香',
    name: 'Aroma',
    says: 'Breathe in over the cup. Which of these would you hope to find? Choose up to three.',
    basis: 'Aroma (香气) descriptors after GB/T 14487-2017',
    body: (a, set) => (
      <div className="grid grid-cols-2 gap-2">
        {AROMA_DIMS.map(d => {
          const on = a.aromas.includes(d)
          const full = !on && a.aromas.length >= 3
          return (
            <Chip
              key={d}
              selected={on}
              onClick={() => {
                if (on) set({aromas: a.aromas.filter(x => x !== d)})
                else if (!full) set({aromas: [...a.aromas, d]})
              }}
              className={full ? 'opacity-40' : ''}
            >
              <span className="flex flex-col">
                <span className="text-[15px] leading-tight">
                  <span className="han mr-1 opacity-70">{AROMA_LABELS[d].native}</span>
                  {AROMA_LABELS[d].en}
                </span>
                <span className="text-[12px] italic leading-tight opacity-75">{AROMA_LABELS[d].hint}</span>
              </span>
            </Chip>
          )
        })}
      </div>
    ),
  },
  {
    key: 'body',
    glyph: '醇',
    name: 'Body',
    says: 'How should it sit on the tongue — bright and quick, or thick and slow?',
    basis: 'Taste (滋味): 鲜爽 brisk-fresh against 醇厚 mellow-thick',
    body: (a, set) => (
      <InkSlider label="Body" value={a.body} onChange={v => set({body: v})} left="Brisk & bright" right="Thick & mellow" />
    ),
  },
  {
    key: 'umami',
    glyph: '鲜',
    name: 'Savouriness',
    says: 'Some teas taste almost of broth — of the sea, of young greens. How much of that do you want?',
    basis: 'Umami (旨味 · 鲜), from theanine; prized in shaded Japanese teas',
    body: (a, set) => (
      <InkSlider label="Umami" value={a.umami} onChange={v => set({umami: v})} left="Clean & simple" right="Brothy & savoury" />
    ),
  },
  {
    key: 'structure',
    glyph: '苦',
    name: 'Structure',
    says: 'Astringency dries the mouth, like strong red wine. Bitterness, in good tea, turns sweet in the throat. Do you welcome them?',
    basis: 'Astringency (涩) and bitterness (苦) with returning sweetness (回甘)',
    body: (a, set) => (
      <div className="space-y-6">
        <div>
          <p className="small-caps mb-1 text-[13px] text-ink-80">Astringency · 涩</p>
          <InkSlider label="Astringency" value={a.astringency} onChange={v => set({astringency: v})} left="Avoid it" right="Welcome it" />
        </div>
        <div>
          <p className="small-caps mb-1 text-[13px] text-ink-80">Bitterness · 苦</p>
          <InkSlider label="Bitterness" value={a.bitterness} onChange={v => set({bitterness: v})} left="Avoid it" right="Welcome it" />
        </div>
      </div>
    ),
  },
  {
    key: 'age',
    glyph: '陈',
    name: 'Age',
    says: 'Some teas are kept for years, or fermented in the pile, until they taste of wood, dates and earth. Would you drink them?',
    basis: 'Aged character (陈香) — dark tea, Pu’er, aged white and oolong',
    body: (a, set) => (
      <div className="space-y-2">
        {AGES.map(o => (
          <Chip key={o.id} selected={a.age === o.id} onClick={() => set({age: o.id})} className="w-full">
            <span className="flex flex-col">
              <span className="text-[16px]">{o.label}</span>
              <span className="text-[13px] italic opacity-75">{o.hint}</span>
            </span>
          </Chip>
        ))}
      </div>
    ),
  },
]

export function Palate() {
  const {palate, setPalate, push, reduced} = useApp()
  const [resume, setResume] = useState(Boolean(palate))
  const [answers, setAnswers] = useState<SurveyAnswers>(
    palate ?? EMPTY_ANSWERS
  )
  const [i, setI] = useState(0)
  const step = STEPS[i]
  const set = (p: Partial<SurveyAnswers>) => setAnswers(a => ({...a, ...p}))

  if (resume && palate) {
    return (
      <Page glyph="品" title="Palate" subtitle="Tell me what you taste">
        <PickerSays>I remember your palate. Shall I pour what suits it, or shall we taste again?</PickerSays>
        <div className="mt-8 space-y-3">
          <InkButton onClick={() => push({id: 'results'})} className="w-full">
            Show my teas
          </InkButton>
          <InkButton
            variant="ghost"
            onClick={() => {
              setResume(false)
              setI(0)
            }}
            className="w-full"
          >
            Taste again
          </InkButton>
        </div>
      </Page>
    )
  }

  const last = i === STEPS.length - 1
  return (
    <Page
      glyph="品"
      title="Palate"
      subtitle="Tell me what you taste"
      footer={
        <div className="flex items-center gap-3">
          <InkButton variant="ghost" onClick={() => setI(i - 1)} disabled={i === 0} className="w-28">
            Before
          </InkButton>
          <InkButton
            onClick={() => {
              if (last) {
                setPalate(answers)
                push({id: 'results'})
              } else setI(i + 1)
            }}
            variant={last ? 'seal' : 'ink'}
            className="flex-1"
          >
            {last ? 'Pour my teas' : 'Onward'}
          </InkButton>
        </div>
      }
    >
      {/* Progress: one brush dot per question. */}
      <div className="mb-5 flex items-center gap-1.5" aria-label={`Question ${i + 1} of ${STEPS.length}`}>
        {STEPS.map((s, k) => (
          <Touchable key={s.key} onClick={() => setI(k)} className="flex h-6 flex-1 items-center">
            <div
              className={`h-[4px] w-full rounded-full transition-colors duration-500 ${
                k === i ? 'bg-cinnabar' : k < i ? 'bg-ink-80' : 'bg-ink-10'
              }`}
            />
          </Touchable>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={step.key}
          initial={reduced ? {opacity: 0} : {opacity: 0, x: 18}}
          animate={{opacity: 1, x: 0}}
          exit={reduced ? {opacity: 0} : {opacity: 0, x: -18}}
          transition={{duration: 0.35}}
        >
          <p className="small-caps text-[13px] text-cinnabar">
            {i + 1} · {step.name}
          </p>
          <div className="mt-3">
            <PickerSays>{step.says}</PickerSays>
          </div>
          <p className="mb-6 mt-3 text-[12px] text-ink-60">{step.basis}</p>
          {step.body(answers, set)}
        </motion.div>
      </AnimatePresence>
    </Page>
  )
}
