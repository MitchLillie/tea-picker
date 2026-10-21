import {describe, expect, it} from 'vitest'

import {classify, productIs, purity} from './catalog'
import {identicalTo, recommend, similarTo} from './match'
import {EMPTY_ANSWERS, type SurveyAnswers} from './profile'
import {classOf, getTea, searchTeas} from './teas'
import {validateTeas} from './validate'

const survey = (a: Partial<SurveyAnswers>): SurveyAnswers => ({...EMPTY_ANSWERS, ...a})
const topIds = (a: Partial<SurveyAnswers>) => recommend(survey(a)).picks.map(r => r.tea.id)

describe('knowledge base', () => {
  it('passes integrity checks', () => {
    expect(validateTeas()).toEqual([])
  })
})

describe('search', () => {
  it.each([
    ['TGY', 'tieguanyin'],
    ['Iron Goddess', 'tieguanyin'],
    ['铁观音', 'tieguanyin'],
    ['tie kwan yin', 'tieguanyin'],
    ['big red robe', 'da-hong-pao'],
    ['gyokuro', 'gyokuro'],
    ['hojicha', 'hojicha'],
    ['Hōjicha', 'hojicha'],
    ['dragonwel', 'longjing'],
    ['oriental beuty', 'oriental-beauty'],
  ])('%s → %s family', (q, family) => {
    expect(searchTeas(q)[0]?.family).toBe(family)
  })
})

describe('classify product titles', () => {
  it.each([
    ['2023 Menghai Ripe Pu-erh Tea Cake 357g', 'shou-puer'],
    ['Organic Fukamushi Sencha – Shizuoka', 'fukamushi'],
    ['Shizuoka Sencha Yabukita', 'sencha'],
    ['Golden Osmanthus Oolong (Huang Jin Gui)', 'huangjin-gui'],
    ['Osmanthus Oolong', 'osmanthus-oolong'],
    ['Charcoal Roasted Tieguanyin', 'tieguanyin-nongxiang'],
    ['Muzha Tie Guan Yin, Taiwan', 'muzha-tieguanyin'],
    ['Ali Shan High Mountain Oolong 150g', 'alishan'],
    ['Lapsang Souchong Loose Leaf', 'lapsang-smoked'],
    ['Kaga Bocha roasted stem', 'kaga-bocha'],
  ])('%s → %s', (title, id) => {
    expect(classify(title)?.id).toBe(id)
  })

  it('finds nothing in unrelated titles', () => {
    expect(classify('Organic Green Tea Bags')).toBeNull()
  })
})

describe('purity filter', () => {
  it.each([
    'Earl Grey Oolong',
    'Peach Oolong',
    'Vanilla Milk Oolong',
    'Masala Chai',
    'Darjeeling First Flush',
    'Matcha Latte Mix',
    'Jasmine Green Tea with Natural Flavors',
    'Organic Rooibos',
    'Matcha Whisk (Chasen)',
  ])('rejects %s', title => {
    expect(purity(title).ok).toBe(false)
  })

  it.each([
    'Jasmine Pearls',
    'Genmaicha',
    'Lapsang Souchong',
    'Sun Moon Lake Assam Black Tea',
    'Jin Xuan Milk Oolong',
    'Jiu Qu Hong Mei red plum black tea',
    'Ruby #18 black tea',
  ])('keeps %s', title => {
    expect(purity(title).ok).toBe(true)
  })

  it('productIs requires both purity and a match', () => {
    const tgy = getTea('tieguanyin-qingxiang')!
    expect(productIs('Anxi Tieguanyin Spring 2024', tgy)).toBe(true)
    expect(productIs('Vanilla Tieguanyin', tgy)).toBe(false)
    expect(productIs('Da Hong Pao', tgy)).toBe(false)
  })
})

describe('identical & similar', () => {
  it('identical stays inside the family, base first', () => {
    const ids = identicalTo('tieguanyin-qingxiang').map(t => t.family)
    expect(ids[0]).toBe('tieguanyin')
    expect(new Set(ids)).toEqual(new Set(['tieguanyin']))
  })

  it('similar never returns the same family and spans nodes', () => {
    const sims = similarTo('tieguanyin-qingxiang')
    expect(sims.length).toBe(6)
    expect(sims.every(r => r.tea.family !== 'tieguanyin')).toBe(true)
  })

  it('Tieguanyin’s nearest kin are light floral oolongs', () => {
    const top = similarTo('tieguanyin-qingxiang', 3).map(r => classOf(r.tea))
    expect(top.every(c => c === 'cn.oolong' || c === 'tw.oolong')).toBe(true)
  })

  it('Gyokuro’s nearest kin are shaded or steamed Japanese greens', () => {
    const top = similarTo('gyokuro', 3)
    expect(top.every(r => r.tea.node.startsWith('jp'))).toBe(true)
  })

  it('every similar result explains itself', () => {
    for (const r of similarTo('da-hong-pao')) expect(r.reasons.length).toBeGreaterThan(0)
  })
})

describe('survey recommendations', () => {
  it('roasty + mineral + medium-heavy fire → Wuyi rock tea', () => {
    const ids = topIds({oxidation: 0.45, fire: 'medium', aromas: ['mineral', 'chestnut'], body: 0.8})
    expect(getTea(ids[0])!.node).toBe('cn.oolong.minbei')
  })

  it('marine + umami + fresh → Japanese shaded/steamed tea', () => {
    const ids = topIds({oxidation: 0, fire: 'none', aromas: ['marine'], umami: 1, body: 0.7})
    expect(ids.every(id => getTea(id)!.node.startsWith('jp'))).toBe(true)
    expect(ids).toContain('gyokuro')
  })

  it('aged + earthy → dark tea or shou Pu’er', () => {
    const ids = topIds({oxidation: 0.85, aromas: ['earthy', 'woody'], age: 'yes', body: 0.85})
    expect(['cn.dark', 'cn.puer']).toContain(classOf(getTea(ids[0])!))
  })

  it('"no aged tea" is a hard constraint', () => {
    const {picks, further} = recommend(survey({aromas: ['earthy', 'woody'], age: 'no'}))
    for (const r of [...picks, further]) expect(r!.tea.profile.age).toBeLessThanOrEqual(0.35)
  })

  it('a disliked anchor removes its whole family', () => {
    const ids = topIds({anchors: {'dian-hong': 'dislike'}, oxidation: 0.9, aromas: ['malt']})
    expect(ids.some(id => getTea(id)!.family === 'dian-hong')).toBe(false)
  })

  it('smoke only appears when chosen', () => {
    expect(topIds({oxidation: 0.9, aromas: ['fruit']})).not.toContain('lapsang-smoked')
    expect(topIds({oxidation: 0.9, aromas: ['smoke']})[0]).toBe('lapsang-smoked')
  })

  it('picks come from distinct families and "further" from a new class', () => {
    const {picks, further} = recommend(survey({oxidation: 0.3, aromas: ['floral']}))
    expect(new Set(picks.map(r => r.tea.family)).size).toBe(picks.length)
    expect(picks.map(r => classOf(r.tea))).not.toContain(classOf(further!.tea))
  })

})

describe('bitterness as a pleasure', () => {
  it('welcoming bitterness and astringency with a fresh leaf → sheng Pu’er', () => {
    const ids = topIds({bitterness: 1, astringency: 1, aromas: ['floral', 'fruit'], body: 0.8, oxidation: 0.1})
    expect(ids.some(id => getTea(id)!.node === 'cn.puer.sheng')).toBe(true)
  })

  it('every similar result explains itself, for every tea', async () => {
    const {TEAS} = await import('./teas')
    for (const t of TEAS) for (const r of similarTo(t.id)) expect(r.reasons.length).toBeGreaterThan(0)
  })
})
