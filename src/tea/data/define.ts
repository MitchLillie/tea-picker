import type {Profile, Tea} from '../types'

/**
 * Compact profile authoring. Keys:
 * ox oxidation · ro roast · bo body · um umami · as astringency · bi bitterness
 * sw sweetness · ag age | veg vegetal · mar marine · che chestnut · flo floral
 * fru fruit · mal malt · min mineral · smo smoke · woo woody · ear earthy
 * sce scented. Omitted keys are 0.
 */
const KEYS = {
  ox: 'oxidation',
  ro: 'roast',
  bo: 'body',
  um: 'umami',
  as: 'astringency',
  bi: 'bitterness',
  sw: 'sweetness',
  ag: 'age',
  veg: 'vegetal',
  mar: 'marine',
  che: 'chestnut',
  flo: 'floral',
  fru: 'fruit',
  mal: 'malt',
  min: 'mineral',
  smo: 'smoke',
  woo: 'woody',
  ear: 'earthy',
  sce: 'scented',
} as const satisfies Record<string, keyof Profile>

export type ShortProfile = Partial<Record<keyof typeof KEYS, number>>

export const profile = (short: ShortProfile): Profile => {
  const out = Object.fromEntries(
    Object.values(KEYS).map(k => [k, 0])
  ) as Profile
  for (const [k, v] of Object.entries(short)) {
    out[KEYS[k as keyof typeof KEYS]] = v
  }
  return out
}

type TeaInput = Omit<Tea, 'profile' | 'family' | 'query'> & {
  p: ShortProfile
  family?: string
  query?: string
}

/** family defaults to id; query defaults to the English name. */
export const tea = ({p, family, query, ...rest}: TeaInput): Tea => ({
  ...rest,
  family: family ?? rest.id,
  query: query ?? rest.name.en,
  profile: profile(p),
})
