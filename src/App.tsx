import {useEffect} from 'react'

import {AnimatePresence} from 'motion/react'

import {Atlas} from './rows/Atlas'
import {Leaf} from './rows/Leaf'
import {Palate} from './rows/Palate'
import {Results} from './rows/Results'
import {Credits, Settings} from './rows/Settings'
import {TeaDetail} from './rows/TeaDetail'
import {InkDefs} from './scene/ink/InkDefs'
import {installPaperGrain} from './scene/ink/paper'
import {Journey} from './scene/Journey'
import {AppProvider, useApp, type Screen} from './state/app'

const key = (s: Screen, depth: number) => `${depth}:${s.id}:${'node' in s ? s.node : ''}${'teaId' in s ? s.teaId : ''}`

function ScreenView({screen}: {screen: Screen}) {
  switch (screen.id) {
    case 'palate':
      return <Palate />
    case 'results':
      return <Results />
    case 'leaf':
      return <Leaf />
    case 'atlas':
      return <Atlas node={screen.node} />
    case 'tea':
      return <TeaDetail teaId={screen.teaId} />
    case 'settings':
      return <Settings />
    case 'credits':
      return <Credits />
    default:
      return null
  }
}

function Stage() {
  const {stack, screen} = useApp()
  // The garden stays mounted underneath, so the picker keeps his seat.
  const covered = screen.id !== 'garden'
  return (
    <div className="fixed inset-0 overflow-hidden">
      <Journey covered={covered} />
      <AnimatePresence initial={false}>
        {covered && <ScreenView key={key(screen, stack.length)} screen={screen} />}
      </AnimatePresence>
    </div>
  )
}

export function App() {
  useEffect(installPaperGrain, [])
  return (
    <AppProvider>
      <InkDefs />
      <Stage />
    </AppProvider>
  )
}
