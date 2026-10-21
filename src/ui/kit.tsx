import {useId, useMemo, type ReactNode} from 'react'

import {SafeArea, Touchable} from '@shopify/shop-minis-react'
import {motion} from 'motion/react'

import {Rock} from '../scene/scenery'
import {STONE, SEAT} from '../scene/Garden'
import {rng, stroke} from '../scene/ink/brush'
import {Glyph, Seal} from '../scene/ink/Glyph'
import {TeaPicker} from '../scene/TeaPicker'
import {useApp} from '../state/app'

// ── Page ─────────────────────────────────────────────────────────────────

interface PageProps {
  glyph?: string
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}

/** A sheet of paper: seal back-button, calligraphic title, scrolling body. */
export function Page({glyph, title, subtitle, children, footer}: PageProps) {
  const {pop, reduced} = useApp()
  return (
    <motion.div
      className="paper absolute inset-0 flex flex-col"
      initial={reduced ? {opacity: 0} : {opacity: 0, filter: 'blur(6px)'}}
      animate={{opacity: 1, filter: 'blur(0px)'}}
      exit={{opacity: 0}}
      transition={{duration: reduced ? 0.25 : 0.7, ease: [0.2, 0, 0, 1]}}
    >
      <SafeArea edges={['top']} className="shrink-0">
        <div className="flex items-center justify-between px-3 pt-1">
          <Touchable onClick={pop} className="flex min-h-12 min-w-12 items-center gap-2 px-2" aria-label="Back">
            <Seal text="归" size={28} />
            <span className="small-caps text-[13px] text-ink-80">back</span>
          </Touchable>
          <SoundToggle />
        </div>
        <div className="flex items-end gap-3 px-6 pb-3 pt-1">
          {glyph && <Glyph text={glyph} size={58} className="shrink-0 text-ink" />}
          <div className="pb-1">
            <h1 className="small-caps text-[22px] leading-none text-ink">{title}</h1>
            {subtitle && <p className="mt-1 text-[14px] italic leading-snug text-ink-80">{subtitle}</p>}
          </div>
        </div>
        <BrushRule />
      </SafeArea>
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
        <SafeArea edges={['bottom']} className="px-5 pb-10 pt-4">
          {children}
        </SafeArea>
      </div>
      {footer && (
        <SafeArea edges={['bottom']} className="shrink-0 border-t border-ink-10 bg-paper/95 px-5 pb-3 pt-3">
          {footer}
        </SafeArea>
      )}
    </motion.div>
  )
}

/** A single dry-brush horizontal stroke. */
export function BrushRule({seed = 3, className = ''}: {seed?: number; className?: string}) {
  const d = useMemo(() => {
    const r = rng(seed)
    return stroke(r, [[4, 6], [120, 5], [240, 7], [356, 5]], 3.2, 0.6, 0.5)
  }, [seed])
  return (
    <svg viewBox="0 0 360 12" preserveAspectRatio="none" className={`h-3 w-full px-5 ${className}`} aria-hidden>
      <path d={d} fill="#1a1a18" opacity={0.7} filter="url(#ink-dry)" />
    </svg>
  )
}

// ── Controls ─────────────────────────────────────────────────────────────

interface InkButtonProps {
  children: ReactNode
  onClick: () => void
  variant?: 'ink' | 'ghost' | 'seal'
  className?: string
  disabled?: boolean
}

export function InkButton({children, onClick, variant = 'ink', className = '', disabled}: InkButtonProps) {
  const look =
    variant === 'ink'
      ? 'bg-ink text-paper-light'
      : variant === 'seal'
        ? 'bg-cinnabar text-paper-light'
        : 'border-[1.5px] border-ink text-ink'
  return (
    <Touchable
      onClick={disabled ? undefined : onClick}
      className={`flex min-h-12 items-center justify-center rounded-[3px] px-5 text-[16px] tracking-wide ${look} ${disabled ? 'opacity-35' : ''} ${className}`}
    >
      {children}
    </Touchable>
  )
}

interface ChipProps {
  selected: boolean
  onClick: () => void
  children: ReactNode
  className?: string
}

export function Chip({selected, onClick, children, className = ''}: ChipProps) {
  return (
    <Touchable
      onClick={onClick}
      className={`relative flex min-h-12 items-center rounded-[3px] border-[1.5px] px-3 py-2 text-left transition-colors duration-300 ${
        selected ? 'border-ink bg-ink text-paper-light' : 'border-ink-20 bg-paper-light/60 text-ink'
      } ${className}`}
      aria-pressed={selected}
    >
      {children}
    </Touchable>
  )
}

interface InkSliderProps {
  value: number | undefined
  onChange: (v: number) => void
  left: string
  right: string
  /** Paint the track as a wash that darkens left → right. */
  graded?: boolean
  label: string
}

/** A range control drawn as one loaded brush stroke. */
export function InkSlider({value, onChange, left, right, graded, label}: InkSliderProps) {
  const id = useId()
  const d = useMemo(() => stroke(rng(17), [[6, 24], [100, 22], [200, 25], [294, 23]], 5, 11, 0.4), [])
  return (
    <div>
      <div className="relative">
        <svg viewBox="0 0 300 48" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-12 w-full" aria-hidden>
          <defs>
            <linearGradient id={`g${id}`} x1="0" x2="1">
              <stop offset="0" stopColor="#1a1a18" stopOpacity={graded ? 0.12 : 0.55} />
              <stop offset="1" stopColor="#1a1a18" stopOpacity={graded ? 0.95 : 0.55} />
            </linearGradient>
          </defs>
          <path d={d} fill={`url(#g${id})`} filter="url(#ink-dry)" />
        </svg>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          aria-label={label}
          value={Math.round((value ?? 0.5) * 100)}
          onChange={e => onChange(Number(e.target.value) / 100)}
          className={`ink-range relative ${value === undefined ? 'opacity-50' : ''}`}
        />
      </div>
      <div className="mt-1 flex justify-between text-[13px] italic text-ink-80">
        <span>{left}</span>
        <span>{right}</span>
      </div>
    </div>
  )
}

export function SoundToggle() {
  const {settings, updateSettings, audio} = useApp()
  const on = settings.sound
  return (
    <Touchable
      onClick={() => {
        updateSettings({sound: !on})
        if (!on) audio.start(1.5)
      }}
      className="flex min-h-12 min-w-12 items-center justify-center"
      aria-label={on ? 'Mute music' : 'Play music'}
    >
      <svg viewBox="0 0 32 32" width={26} height={26} aria-hidden>
        <path d="M5 12 L11 12 L18 6 L18 26 L11 20 L5 20 Z" fill="#1a1a18" opacity={0.85} />
        {on ? (
          <g fill="none" stroke="#1a1a18" strokeWidth={2} strokeLinecap="round">
            <path d="M22 11 Q25 16 22 21" />
            <path d="M25.5 8 Q30 16 25.5 24" opacity={0.6} />
          </g>
        ) : (
          <path d="M22 12 L29 20 M29 12 L22 20" stroke="var(--color-cinnabar)" strokeWidth={2.2} strokeLinecap="round" />
        )}
      </svg>
    </Touchable>
  )
}

// ── The picker, speaking ─────────────────────────────────────────────────

/** A small vignette of the seated picker beside his words. */
export function PickerSays({children}: {children: ReactNode}) {
  return (
    <div className="flex items-end gap-3">
      <svg viewBox={`${SEAT.x - 95} ${SEAT.y - 200} 175 212`} width={66} height={80} className="shrink-0" aria-hidden>
        <g transform={`translate(${STONE.x} ${STONE.y})`}>
          <Rock seed={5} w={STONE.w} h={STONE.h} />
        </g>
        <TeaPicker mode="seated" from={SEAT} to={SEAT} />
      </svg>
      <motion.p
        key={String(children)}
        className="pb-2 text-[16px] italic leading-snug text-ink"
        initial={{opacity: 0, x: 6}}
        animate={{opacity: 1, x: 0}}
        transition={{duration: 0.8}}
      >
        “{children}”
      </motion.p>
    </div>
  )
}

export function SectionTitle({children, glyph}: {children: ReactNode; glyph?: string}) {
  return (
    <div className="mb-3 mt-8 flex items-center gap-2">
      {glyph && <Glyph text={glyph} size={24} className="text-ink" />}
      <h2 className="small-caps text-[16px] text-ink">{children}</h2>
    </div>
  )
}

