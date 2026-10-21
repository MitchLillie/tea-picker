/**
 * Name normalisation shared by alias search and product-title classification.
 * "Tiě Guān-Yīn", "TIE GUAN YIN" and "tieguanyin" all reduce to the same
 * compact key.
 */
export const spaced = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip combining diacritics (ō → o, ǐ → i)
    .toLowerCase()
    .replace(/[’'`´]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()

export const compact = (s: string) => spaced(s).replace(/ /g, '')

/** Short aliases ("tgy", "yiwu") must match whole words, not inside other words. */
const SHORT = 5

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export interface AliasMatcher {
  key: string
  test: (title: {spaced: string; compact: string}) => number
}

/**
 * Builds a matcher for an alias. `test` returns the index where the alias
 * starts in the title, or -1.
 */
export const aliasMatcher = (alias: string): AliasMatcher => {
  const key = compact(alias)
  const isCjk = /[぀-ヿ㐀-鿿]/.test(alias)
  if (key.length <= SHORT && !isCjk) {
    const re = new RegExp(`(?:^| )${escapeRe(spaced(alias))}(?: |$)`)
    return {
      key,
      test: t => {
        const m = re.exec(t.spaced)
        return m ? m.index : -1
      },
    }
  }
  return {key, test: t => t.compact.indexOf(key)}
}

export const levenshtein = (a: string, b: string) => {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let prev = Array.from({length: b.length + 1}, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
    prev = cur
  }
  return prev[b.length]
}
