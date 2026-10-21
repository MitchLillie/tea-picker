import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import {
  useAsyncStorage,
  useCloseMini,
  useOnMiniBlur,
  useOnMiniFocus,
  useOnNavigateBack,
} from '@shopify/shop-minis-react'
import {useReducedMotion} from 'motion/react'

import type {AudioEngine} from '../audio/AudioEngine'
import {audio} from '../audio/engine'
import type {SurveyAnswers} from '../tea/profile'
import type {Tea} from '../tea/types'

export interface Settings {
  sound: boolean
  volume: number
  /** Play the climb on every visit, or only the first. */
  intro: 'always' | 'first'
  motion: 'system' | 'reduced' | 'full'
  naming: 'en' | 'roman' | 'native'
}

const DEFAULT_SETTINGS: Settings = {
  sound: true,
  volume: 0.7,
  intro: 'first',
  motion: 'system',
  naming: 'en',
}

export type Screen =
  | {id: 'garden'}
  | {id: 'palate'}
  | {id: 'results'}
  | {id: 'leaf'}
  | {id: 'atlas'; node?: string}
  | {id: 'tea'; teaId: string}
  | {id: 'settings'}
  | {id: 'credits'}

interface App {
  ready: boolean
  settings: Settings
  updateSettings: (patch: Partial<Settings>) => void
  palate: SurveyAnswers | null
  setPalate: (a: SurveyAnswers | null) => void
  introSeen: boolean
  markIntroSeen: () => void
  reduced: boolean
  audio: AudioEngine
  stack: Screen[]
  screen: Screen
  push: (s: Screen) => void
  pop: () => void
  /** Return to the garden. */
  home: () => void
  nameOf: (tea: Tea) => {primary: string; secondary: string}
}

const Ctx = createContext<App | null>(null)

export const useApp = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp outside AppProvider')
  return ctx
}

const KEYS = {settings: 'tp.settings', palate: 'tp.palate', intro: 'tp.introSeen'}

const parse = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback
  try {
    return {...fallback, ...JSON.parse(raw)}
  } catch {
    return fallback
  }
}

export function AppProvider({children}: {children: ReactNode}) {
  const storage = useAsyncStorage()
  const {closeMini} = useCloseMini()
  const systemReduced = useReducedMotion()

  const [ready, setReady] = useState(false)
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [palate, setPalateState] = useState<SurveyAnswers | null>(null)
  const [introSeen, setIntroSeen] = useState(false)
  const [stack, setStack] = useState<Screen[]>([{id: 'garden'}])

  useEffect(() => {
    let done = false
    const finish = () => {
      if (!done) {
        done = true
        setReady(true)
      }
    }
    // Never hold the opening on storage: fall back to defaults quickly.
    const timer = setTimeout(finish, 700)
    Promise.all([
      storage.getItem({key: KEYS.settings}),
      storage.getItem({key: KEYS.palate}),
      storage.getItem({key: KEYS.intro}),
    ])
      .then(([s, p, i]) => {
        if (done) return
        setSettings(parse(s, DEFAULT_SETTINGS))
        if (p) setPalateState(parse<SurveyAnswers | null>(p, null))
        setIntroSeen(i === '1')
      })
      .catch(() => undefined)
      .finally(() => {
        clearTimeout(timer)
        finish()
      })
  }, [])

  const updateSettings = useCallback(
    (patch: Partial<Settings>) =>
      setSettings(prev => {
        const next = {...prev, ...patch}
        storage.setItem({key: KEYS.settings, value: JSON.stringify(next)}).catch(() => undefined)
        return next
      }),
    [storage]
  )

  useEffect(() => {
    audio.setMuted(!settings.sound)
    audio.setVolume(settings.volume)
  }, [audio, settings.sound, settings.volume])

  useOnMiniBlur(() => {
    audio.suspend()
  })
  useOnMiniFocus(() => {
    if (settings.sound) audio.start(1.5)
  })

  const setPalate = useCallback(
    (a: SurveyAnswers | null) => {
      setPalateState(a)
      if (a) storage.setItem({key: KEYS.palate, value: JSON.stringify(a)}).catch(() => undefined)
      else storage.removeItem({key: KEYS.palate}).catch(() => undefined)
    },
    [storage]
  )

  const markIntroSeen = useCallback(() => {
    setIntroSeen(true)
    storage.setItem({key: KEYS.intro, value: '1'}).catch(() => undefined)
  }, [storage])

  const push = useCallback((s: Screen) => setStack(st => [...st, s]), [])
  const pop = useCallback(() => setStack(st => (st.length > 1 ? st.slice(0, -1) : st)), [])
  const home = useCallback(() => setStack([{id: 'garden'}]), [])

  const stackRef = useRef(stack)
  stackRef.current = stack
  useOnNavigateBack(() => {
    if (stackRef.current.length > 1) pop()
    else closeMini()
  })

  const reduced =
    settings.motion === 'reduced' || (settings.motion === 'system' && Boolean(systemReduced))

  const nameOf = useCallback(
    (tea: Tea) => {
      const {en, roman, native} = tea.name
      switch (settings.naming) {
        case 'native':
          return {primary: native, secondary: en}
        case 'roman':
          return {primary: roman, secondary: en}
        default:
          return {primary: en, secondary: native}
      }
    },
    [settings.naming]
  )

  const value = useMemo<App>(
    () => ({
      ready,
      settings,
      updateSettings,
      palate,
      setPalate,
      introSeen,
      markIntroSeen,
      reduced,
      audio,
      stack,
      screen: stack[stack.length - 1],
      push,
      pop,
      home,
      nameOf,
    }),
    [ready, settings, updateSettings, palate, setPalate, introSeen, markIntroSeen, reduced, audio, stack, push, pop, home, nameOf]
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
