import {AudioEngine} from './AudioEngine'
import {MUSIC} from './music'

/** The one audio engine for the whole Mini. */
export const audio = new AudioEngine(MUSIC.url)

// During development, code reloads would otherwise leave the old engine
// playing with nothing connected to it.
if (import.meta.hot) import.meta.hot.dispose(() => audio.close())
