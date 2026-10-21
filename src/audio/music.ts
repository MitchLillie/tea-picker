// Audio-only AAC in an .mp4 container: the Shop Minis build only allows
// importing a fixed list of file types, which includes mp4 but no audio formats.
// Built by scripts/music/build-opening.sh.
import opening from '../assets/music/opening.mp4'

/** The opening music and its credit (shown in Rest › Credits). */
export const MUSIC = {
  url: opening as string,
  title: '平沙落鴈 Pingsha Luoyan (Wild Geese Descending on the Sandbank)',
  performer: 'guqin by Charlie Huang, from the Jiao’an Qinpu (1868)',
  licence:
    'CC BY 2.5. Excerpted and cleaned, with reverb, a drone, wind and bells added by Tea Picker',
  source: 'Wikimedia Commons: File:Pingsha_Luoyan.ogg',
}
