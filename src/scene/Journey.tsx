import {useCallback, useEffect, useRef, useState} from 'react'

import {SafeArea, Touchable} from '@shopify/shop-minis-react'
import {animate, motion, useMotionValue, useTransform, type AnimationPlaybackControls} from 'motion/react'

import {useApp, type Screen} from '../state/app'
import {SoundToggle} from '../ui/kit'

import {Climb} from './Climb'
import {CloudSea, Far, Foreground, Hill, RowMist, SEAT, TERRACES, terraceY, type RowId} from './Garden'
import {Glyph, Seal} from './ink/Glyph'
import {CloudBank, Layer, MountainRange, H, W} from './scenery'
import {TeaPicker} from './TeaPicker'
import {useSceneBox} from './useSceneBox'

type Phase = 'title' | 'gate' | 'climb' | 'arrive' | 'garden'

const ROW_SCREEN: Record<RowId, Screen> = {
  palate: {id: 'palate'},
  leaf: {id: 'leaf'},
  atlas: {id: 'atlas'},
  settings: {id: 'settings'},
}

const CLIMB_STEPS = 12
const PICKER_FROM = {x: 500, y: 930, scale: 2.9}

const wait = (ms: number) => new Promise(r => setTimeout(r, ms))

export function Journey({covered}: {covered: boolean}) {
  const app = useApp()
  const {reduced, audio, settings, introSeen, markIntroSeen, push, screen} = app
  const box = useRef<HTMLDivElement>(null)
  const scene = useSceneBox(box)

  const playIntro = settings.intro === 'always' || !introSeen
  const [phase, setPhase] = useState<Phase>(playIntro ? 'title' : 'garden')
  const [picker, setPicker] = useState<'hidden' | 'enter' | 'seated'>(playIntro ? 'hidden' : 'seated')
  const [labels, setLabels] = useState(!playIntro)
  const [spoken, setSpoken] = useState(!playIntro)
  const [lit, setLit] = useState<RowId | null>(null)

  const z = useMotionValue(0)
  const titleO = useMotionValue(playIntro ? 1 : 0)
  const climbO = useMotionValue(0)
  const mountY = useMotionValue(0)
  const fogO = useMotionValue(0)
  const fogSpread = useMotionValue(0)
  const gardenO = useMotionValue(playIntro ? 0 : 1)
  const arrive = useMotionValue(playIntro ? 1 : 0) // 1 = slightly pushed-in, settling to 0
  const zoom = useMotionValue(0)
  const [origin, setOrigin] = useState('50% 70%')

  const fogL = useTransform(fogSpread, v => -v * 300)
  const fogR = useTransform(fogSpread, v => v * 300)
  const gardenScale = useTransform([arrive, zoom], ([a, zz]: number[]) => 1 + a * 0.08 + zz * 1.9)
  const farScale = useTransform([arrive, zoom], ([a, zz]: number[]) => 1 + a * 0.04 + zz * 0.5)
  const paperO = useTransform(zoom, [0.45, 1], [0, 1])

  const running = useRef<AnimationPlaybackControls[]>([])
  const cancelled = useRef(false)
  const run = (c: AnimationPlaybackControls) => {
    running.current.push(c)
    return c
  }

  const finish = useCallback(() => {
    cancelled.current = true
    running.current.forEach(c => c.stop())
    running.current = []
    titleO.set(0)
    climbO.set(0)
    fogO.set(0)
    gardenO.set(1)
    arrive.set(0)
    setPicker('seated')
    setLabels(true)
    setSpoken(true)
    setPhase('garden')
    markIntroSeen()
  }, [titleO, climbO, fogO, gardenO, arrive, markIntroSeen])

  const startSound = useCallback(
    async () => (settings.sound ? audio.start(4) : ('playing' as const)),
    [audio, settings.sound]
  )

  const journey = useCallback(async () => {
    cancelled.current = false
    if (reduced) {
      await wait(1400)
      if (cancelled.current) return
      run(animate(titleO, 0, {duration: 0.8}))
      await run(animate(gardenO, 1, {duration: 1.2}))
      if (!cancelled.current) finish()
      return
    }
    setPhase('climb')
    await wait(3200)
    if (cancelled.current) return
    // Title lifts; the trail fades up out of the paper.
    run(animate(titleO, 0, {duration: 2.4, ease: 'easeInOut'}))
    run(animate(climbO, 1, {duration: 3, ease: 'easeOut'}))
    run(animate(mountY, 70, {duration: 22, ease: 'easeInOut'}))
    // An unhurried pace: a little over two seconds a step.
    const climb = run(animate(z, CLIMB_STEPS, {duration: 22, ease: [0.3, 0, 0.6, 1]}))
    await wait(16500)
    if (cancelled.current) return
    // Into the cloud layer: everything goes to white.
    run(animate(fogO, 1, {duration: 5, ease: 'easeIn'}))
    await climb
    if (cancelled.current) return
    climbO.set(0)
    gardenO.set(1)
    setPhase('arrive')
    await wait(1200)
    if (cancelled.current) return
    // Through the clouds: they part and the garden is there.
    run(animate(fogSpread, 1, {duration: 5.5, ease: [0.4, 0, 0.2, 1]}))
    run(animate(fogO, 0, {duration: 5, ease: 'easeInOut'}))
    run(animate(arrive, 0, {duration: 7, ease: 'easeOut'}))
    await wait(2800)
    if (cancelled.current) return
    setPicker('enter')
    await wait(4500)
    if (cancelled.current) return
    setLabels(true)
    setPhase('garden')
    markIntroSeen()
  }, [reduced, titleO, gardenO, climbO, mountY, z, fogO, fogSpread, arrive, finish, markIntroSeen])

  // Opening: try to start the music; if the WebView wants a gesture, ask for one.
  useEffect(() => {
    if (!app.ready || phase !== 'title') return
    let live = true
    ;(async () => {
      const result = await Promise.race([startSound(), wait(1200).then(() => 'blocked' as const)])
      if (!live) return
      if (result === 'blocked') setPhase('gate')
      else journey()
    })()
    return () => {
      live = false
    }
  }, [app.ready])

  // Returning visitors land straight in the garden; the music still rises.
  useEffect(() => {
    if (app.ready && !playIntro) startSound()
  }, [app.ready])

  const enterGate = async () => {
    await startSound()
    journey()
  }

  // Dolly the camera down a row, then hand over to its screen.
  const walkRow = async (t: (typeof TERRACES)[number]) => {
    if (lit || phase !== 'garden') return
    setLit(t.id)
    setOrigin(`${((W * 0.62) / W) * 100}% ${(terraceY(t, W * 0.62) / H) * 100}%`)
    await animate(zoom, 1, {duration: reduced ? 0.35 : 1.1, ease: [0.5, 0, 0.3, 1]})
    push(ROW_SCREEN[t.id])
  }

  // Back in the garden: pull the camera out again.
  useEffect(() => {
    if (screen.id === 'garden' && zoom.get() > 0) {
      animate(zoom, 0, {duration: reduced ? 0.3 : 1, ease: [0.3, 0, 0.3, 1]}).then(() => setLit(null))
    }
  }, [screen.id, zoom, reduced])

  const intro = phase === 'title' || phase === 'gate' || phase === 'climb' || phase === 'arrive'

  return (
    <div
      ref={box}
      className="paper absolute inset-0 overflow-hidden"
      style={{visibility: covered ? 'hidden' : 'visible'}}
      onClick={intro && phase !== 'gate' && phase !== 'title' ? finish : undefined}
    >
      {/* ── The climb ─────────────────────────────────────────────── */}
      <motion.div className="absolute inset-0" style={{opacity: climbO}}>
        <Layer style={{y: mountY}}>
          <MountainRange seed={41} baseY={150} amp={120} opacity={0.3} soft peaks={2} cunCount={20} />
          <MountainRange seed={42} baseY={226} amp={90} opacity={0.42} peaks={3} cunCount={32} />
          <CloudBank seed={43} y={258} count={7} height={34} tint={0.04} />
        </Layer>
        {phase !== 'garden' && <Climb z={z} />}
      </motion.div>

      {/* ── The garden ────────────────────────────────────────────── */}
      <motion.div className="absolute inset-0" style={{opacity: gardenO}}>
        <Layer style={{scale: farScale, transformOrigin: origin}}>
          <Far />
        </Layer>
        <Layer style={{scale: farScale, transformOrigin: origin}}>
          <CloudSea />
        </Layer>
        <Layer style={{scale: gardenScale, transformOrigin: origin}}>
          <Hill highlight={lit} />
        </Layer>
        <Layer style={{scale: gardenScale, transformOrigin: origin}}>
          <RowMist />
        </Layer>
        <Layer style={{scale: gardenScale, transformOrigin: origin}}>
          <Foreground />
        </Layer>
        <Layer style={{scale: gardenScale, transformOrigin: origin}}>
          <TeaPicker
            mode={picker}
            from={PICKER_FROM}
            to={SEAT}
            walkSeconds={9.5}
            onSeated={() => setSpoken(true)}
          />
        </Layer>

        {/* Row labels: seals standing at the end of each terrace. */}
        {/* Inert until the garden is reached, so a tap to skip the intro can't land on a row. */}
        <motion.div
          className={`absolute inset-0 ${labels && phase === 'garden' ? '' : 'pointer-events-none'}`}
          style={{opacity: useTransform(zoom, [0, 0.4], [1, 0])}}
        >
          {TERRACES.map((t, i) => {
            const x = W * 0.62
            const pos = scene.at(x, terraceY(t, x) - t.size * 1.55)
            const sealSize = 26 + t.size * 0.6
            return (
              <motion.div
                key={t.id}
                className="absolute"
                style={{left: 0, right: 0, top: pos.top - sealSize * 0.6}}
                initial={false}
                animate={labels ? {opacity: 1, y: 0} : {opacity: 0, y: 8}}
                transition={{delay: labels && phase === 'garden' && !introSeen ? 0 : i * 0.35, duration: 0.9}}
              >
                <Touchable
                  onClick={e => {
                    e.stopPropagation()
                    walkRow(t)
                  }}
                  className="flex min-h-12 items-center justify-end gap-3 pr-5"
                  style={{paddingLeft: pos.left * 0.4}}
                >
                  <div className="text-right drop-shadow-[0_0_6px_rgba(239,232,216,0.95)]">
                    <div className="small-caps text-[15px] leading-tight text-ink">{t.title}</div>
                    <div className="text-[12px] italic leading-tight text-ink-80">{t.line}</div>
                  </div>
                  <Seal text={t.glyph} size={sealSize} />
                </Touchable>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Once seated, the picker speaks: set in the sky like a painting's inscription (题字). */}
        <motion.div
          className="pointer-events-none absolute left-6 flex max-w-[64%] items-start gap-2"
          style={{top: 'calc(var(--safe-area-inset-top, 0px) + 64px)'}}
          initial={false}
          animate={spoken && phase === 'garden' && !lit ? {opacity: 1, y: 0} : {opacity: 0, y: -6}}
          transition={{duration: 1.6, delay: 0.4}}
        >
          <p className="text-[14px] italic leading-snug text-ink-80">
            “Sit a while. Each row is a path — walk whichever one calls to you.”
          </p>
          <Seal text="静" size={22} relief className="mt-1 shrink-0" />
        </motion.div>

        <motion.div className="paper pointer-events-none absolute inset-0" style={{opacity: paperO}} />
      </motion.div>

      {/* ── The cloud layer ───────────────────────────────────────── */}
      <motion.div className="pointer-events-none absolute inset-0" style={{opacity: fogO}}>
        <div className="absolute inset-0 bg-paper-light" style={{opacity: 0.85}} />
        <Layer style={{x: fogL}}>
          <CloudBank seed={61} y={260} count={6} height={160} heavy tint={0.05} />
          <CloudBank seed={62} y={620} count={6} height={170} heavy tint={0.05} />
        </Layer>
        <Layer style={{x: fogR}}>
          <CloudBank seed={63} y={430} count={6} height={180} heavy tint={0.05} />
          <CloudBank seed={64} y={780} count={6} height={150} heavy tint={0.05} />
        </Layer>
      </motion.div>

      {/* ── Title ─────────────────────────────────────────────────── */}
      <motion.div
        className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
        style={{opacity: titleO}}
      >
        <motion.div
          initial={{opacity: 0, filter: 'blur(10px)', scale: 0.96}}
          animate={{opacity: 1, filter: 'blur(0px)', scale: 1}}
          transition={{duration: 2.2, ease: [0.2, 0, 0, 1]}}
          className="relative text-ink"
        >
          <Glyph text="茶" size={150} />
          <motion.div
            className="absolute -right-6 bottom-2"
            initial={{opacity: 0, scale: 1.5, rotate: -8}}
            animate={{opacity: 1, scale: 1, rotate: -3}}
            transition={{delay: 1.3, duration: 0.35, ease: [0.5, 0, 0.75, 0]}}
          >
            <Seal text="采茶人" size={46} />
          </motion.div>
        </motion.div>
        <motion.div
          className="small-caps mt-5 text-[20px] text-ink"
          initial={{opacity: 0, letterSpacing: '0.5em'}}
          animate={{opacity: 1, letterSpacing: '0.24em'}}
          transition={{delay: 0.8, duration: 1.8}}
        >
          Tea Picker
        </motion.div>
      </motion.div>

      {/* Mute is always within reach; the choice is remembered for next time. */}
      <SafeArea edges={['top']} className="absolute right-2 top-0 z-10">
        <div onClick={e => e.stopPropagation()}>
          <SoundToggle />
        </div>
      </SafeArea>

      {phase === 'gate' && (
        <motion.div
          className="absolute inset-x-0 bottom-[14%] flex flex-col items-center"
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          transition={{duration: 0.8}}
        >
          <Touchable onClick={enterGate} className="flex flex-col items-center gap-2 p-4">
            <motion.div animate={{scale: [1, 1.06, 1]}} transition={{duration: 2.4, repeat: Infinity}}>
              <Seal text="入" size={64} />
            </motion.div>
            <span className="small-caps text-[13px] text-ink-80">Enter</span>
          </Touchable>
        </motion.div>
      )}

      {(phase === 'climb' || phase === 'arrive') && (
        <motion.div
          className="small-caps pointer-events-none absolute inset-x-0 bottom-8 text-center text-[11px] text-ink-60"
          initial={{opacity: 0}}
          animate={{opacity: 1}}
          transition={{delay: 3, duration: 1.5}}
        >
          tap to arrive
        </motion.div>
      )}
    </div>
  )
}
