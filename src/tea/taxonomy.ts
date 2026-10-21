import type {Practice, Tradition} from './types'

export interface TaxonNode {
  id: string
  name: {en: string; native: string}
  /** One or two sentences: what defines this branch in processing terms. */
  about: string
  tradition: Tradition
  children?: TaxonNode[]
  /** Brewing default for teas under this node: practice, °C, grams per 100 ml. */
  brew?: {practice: Practice; tempC: number; gPer100ml: number}
}

const GONGFU_GREEN = {practice: 'bowl', tempC: 80, gPer100ml: 3} as const
const GONGFU_HOT = {practice: 'gongfu', tempC: 98, gPer100ml: 6} as const

/**
 * Chinese classes follow GB/T 30766-2014 《茶叶分类》: six basic classes defined
 * by processing (not leaf colour or cultivar), plus reprocessed teas.
 * Pu'er follows GB/T 22111-2008, which defines it as a geographical-indication
 * product spanning a sun-dried green base (生) and a pile-fermented dark tea (熟).
 */
export const TAXONOMY: TaxonNode[] = [
  {
    id: 'cn',
    tradition: 'cn',
    name: {en: 'China', native: '中国茶'},
    about:
      'Six basic classes, told apart by how the leaf is processed — above all, how far it is allowed to oxidise and whether microbes take part.',
    children: [
      {
        id: 'cn.green',
        tradition: 'cn',
        name: {en: 'Green tea', native: '绿茶'},
        about:
          'Enzymes are killed by heat (杀青) straight after picking, so the leaf does not oxidise. Sub-classes are named for how the leaf is finally dried.',
        brew: GONGFU_GREEN,
        children: [
          {
            id: 'cn.green.pan',
            tradition: 'cn',
            name: {en: 'Pan-fired green', native: '炒青'},
            about:
              'Fired and shaped in a hot wok. The pan gives chestnut and toasted-bean aromas.',
            brew: GONGFU_GREEN,
          },
          {
            id: 'cn.green.bake',
            tradition: 'cn',
            name: {en: 'Baked green', native: '烘青'},
            about:
              'Killed in the pan, then dried over gentle heat in baskets. The leaf keeps its shape and a softer, often orchid-like aroma.',
            brew: GONGFU_GREEN,
          },
          {
            id: 'cn.green.sun',
            tradition: 'cn',
            name: {en: 'Sun-dried green', native: '晒青'},
            about:
              'Killed in the pan and dried in the sun. Yunnan sun-dried maocha is the raw material for sheng Pu’er.',
            brew: {practice: 'gongfu', tempC: 90, gPer100ml: 5},
          },
          {
            id: 'cn.green.steam',
            tradition: 'cn',
            name: {en: 'Steamed green', native: '蒸青'},
            about:
              'Killed with steam, the Tang-dynasty method later carried to Japan. Very green, vegetal and marine.',
            brew: GONGFU_GREEN,
          },
        ],
      },
      {
        id: 'cn.yellow',
        tradition: 'cn',
        name: {en: 'Yellow tea', native: '黄茶'},
        about:
          'Processed like green tea, plus a "sealed yellowing" step (闷黄): the warm, damp leaf rests wrapped, mellowing grassiness into sweet corn and chestnut.',
        brew: {practice: 'bowl', tempC: 85, gPer100ml: 3},
        children: [
          {
            id: 'cn.yellow.bud',
            tradition: 'cn',
            name: {en: 'Yellow bud', native: '黄芽茶'},
            about: 'Single buds only.',
          },
          {
            id: 'cn.yellow.small',
            tradition: 'cn',
            name: {en: 'Yellow small-leaf', native: '黄小茶'},
            about: 'One bud with one or two tender leaves.',
          },
          {
            id: 'cn.yellow.large',
            tradition: 'cn',
            name: {en: 'Yellow large-leaf', native: '黄大茶'},
            about:
              'Mature leaf and stem, heavily fired over charcoal for a toasted, burnt-sugar character.',
          },
        ],
      },
      {
        id: 'cn.white',
        tradition: 'cn',
        name: {en: 'White tea', native: '白茶'},
        about:
          'No kill-green and no rolling: the leaf is only withered and dried, so it oxidises slowly and lightly. Fuding and Zhenghe in Fujian are the classic origins. White tea is prized aged.',
        brew: {practice: 'gongfu', tempC: 90, gPer100ml: 5},
        children: [
          {
            id: 'cn.white.bud',
            tradition: 'cn',
            name: {en: 'White bud', native: '芽型'},
            about: 'Downy single buds — Silver Needle.',
          },
          {
            id: 'cn.white.leaf',
            tradition: 'cn',
            name: {en: 'White leaf', native: '叶型'},
            about:
              'Bud with leaves, graded from White Peony through Gongmei to Shoumei as the pick grows more mature.',
          },
          {
            id: 'cn.white.aged',
            tradition: 'cn',
            name: {en: 'Aged white', native: '老白茶'},
            about:
              'White tea stored for years, often pressed into cakes. Fresh hay and flowers turn into jujube, lotus leaf and medicinal wood.',
            brew: GONGFU_HOT,
          },
        ],
      },
      {
        id: 'cn.oolong',
        tradition: 'cn',
        name: {en: 'Oolong', native: '乌龙茶 · 青茶'},
        about:
          'The leaf is tossed until its edges bruise (做青) and partly oxidise, then killed, rolled and often charcoal-roasted. Oolongs are grouped by region.',
        brew: GONGFU_HOT,
        children: [
          {
            id: 'cn.oolong.minbei',
            tradition: 'cn',
            name: {en: 'Northern Fujian — Wuyi rock tea', native: '闽北 · 武夷岩茶'},
            about:
              'Long twisted strips, medium to heavy oxidation and a deep charcoal roast. Valued for 岩韵, the mineral "rock rhyme" of the Wuyi cliffs.',
          },
          {
            id: 'cn.oolong.minnan',
            tradition: 'cn',
            name: {en: 'Southern Fujian — Anxi', native: '闽南 · 安溪'},
            about:
              'Leaf rolled into tight balls. Made fresh and floral (清香), traditionally roasted (浓香) or aged (陈香).',
          },
          {
            id: 'cn.oolong.guangdong',
            tradition: 'cn',
            name: {en: 'Guangdong — Phoenix Dancong', native: '广东 · 凤凰单丛'},
            about:
              'Long strips from single-bush lineages on Phoenix Mountain. Each lineage is named for the aroma it naturally carries (香型).',
          },
        ],
      },
      {
        id: 'cn.black',
        tradition: 'cn',
        name: {en: 'Black tea', native: '红茶'},
        about:
          'Withered, rolled and fully oxidised. In China it is called 红茶, "red tea", after the colour of the liquor. Broken-leaf grades are excluded here.',
        brew: {practice: 'gongfu', tempC: 92, gPer100ml: 5},
        children: [
          {
            id: 'cn.black.xiaozhong',
            tradition: 'cn',
            name: {en: 'Souchong', native: '小种红茶'},
            about:
              'The original black tea, from Tongmu in the Wuyi mountains. Traditionally dried over pine fires.',
          },
          {
            id: 'cn.black.gongfu',
            tradition: 'cn',
            name: {en: 'Gongfu black', native: '工夫红茶'},
            about:
              'Whole-leaf black teas rolled with care ("gongfu"), from Anhui, Yunnan, Fujian and beyond.',
          },
        ],
      },
      {
        id: 'cn.dark',
        tradition: 'cn',
        name: {en: 'Dark tea', native: '黑茶'},
        about:
          'Leaf is piled damp (渥堆) so microbes ferment it, then usually pressed. Earthy, smooth, and it keeps improving with age.',
        brew: GONGFU_HOT,
        children: [
          {
            id: 'cn.dark.hunan',
            tradition: 'cn',
            name: {en: 'Hunan Anhua', native: '湖南黑茶'},
            about:
              'Dried over pine fires on 七星灶 stoves. Includes Fu brick with its "golden flowers" (金花) of Eurotium cristatum.',
          },
          {
            id: 'cn.dark.hubei',
            tradition: 'cn',
            name: {en: 'Hubei green brick', native: '湖北青砖'},
            about: 'Pressed bricks from Chibi, traded along the Tea Road to Mongolia.',
          },
          {
            id: 'cn.dark.sichuan',
            tradition: 'cn',
            name: {en: 'Sichuan border tea', native: '四川边茶'},
            about: 'Ya’an Tibetan tea, carried along the Tea Horse Road.',
          },
          {
            id: 'cn.dark.guangxi',
            tradition: 'cn',
            name: {en: 'Guangxi Liu Bao', native: '广西六堡'},
            about:
              'From Wuzhou. Cellar-aged in baskets, it develops a characteristic betel-nut and wood aroma.',
          },
        ],
      },
      {
        id: 'cn.puer',
        tradition: 'cn',
        name: {en: 'Pu’er', native: '普洱茶'},
        about:
          'A protected Yunnan origin (GB/T 22111-2008) covering two teas. Sheng starts as sun-dried green tea and ages slowly. Shou is pile-fermented into a dark tea in weeks.',
        brew: GONGFU_HOT,
        children: [
          {
            id: 'cn.puer.sheng',
            tradition: 'cn',
            name: {en: 'Sheng (raw) Pu’er', native: '生普'},
            about:
              'Sun-dried large-leaf maocha, pressed. Bright, bitter-sweet and long-finishing when young; it ages toward camphor and wood. Identity is the mountain.',
          },
          {
            id: 'cn.puer.shou',
            tradition: 'cn',
            name: {en: 'Shou (ripe) Pu’er', native: '熟普'},
            about:
              'Maocha pile-fermented since 1973. Dark, thick and earthy, with notes of date and cocoa.',
          },
        ],
      },
      {
        id: 'cn.scented',
        tradition: 'cn',
        name: {en: 'Scented tea', native: '花茶 · 再加工茶'},
        about:
          'A reprocessed tea: finished leaf is layered with fresh blossoms, repeatedly, until it takes their perfume (窨制). No flavourings.',
        brew: {practice: 'bowl', tempC: 85, gPer100ml: 3},
        children: [
          {
            id: 'cn.scented.flower',
            tradition: 'cn',
            name: {en: 'Flower-scented', native: '窨花茶'},
            about: 'Jasmine above all; also osmanthus.',
          },
        ],
      },
    ],
  },
  {
    id: 'tw',
    tradition: 'tw',
    name: {en: 'Taiwan', native: '台灣茶'},
    about:
      'Fujian oolong craft carried across the strait in the 19th century, then refined on Taiwan’s high mountains.',
    children: [
      {
        id: 'tw.oolong',
        tradition: 'tw',
        name: {en: 'Taiwanese oolong', native: '台灣烏龍'},
        about:
          'From barely oxidised strips to honeyed, insect-bitten leaf; from cool-mountain greenness to deep charcoal roast.',
        brew: {practice: 'gongfu', tempC: 95, gPer100ml: 5},
        children: [
          {
            id: 'tw.oolong.strip',
            tradition: 'tw',
            name: {en: 'Strip-style Baozhong', native: '條形包種'},
            about: 'The lightest oolong: open twisted strips, intensely floral.',
          },
          {
            id: 'tw.oolong.ball',
            tradition: 'tw',
            name: {en: 'Rolled high-mountain', native: '球形高山'},
            about:
              'Lightly oxidised, rolled into balls. Grown above 1,000 m, where cool mist slows the leaf and builds sweetness.',
          },
          {
            id: 'tw.oolong.roasted',
            tradition: 'tw',
            name: {en: 'Traditionally roasted', native: '傳統焙火'},
            about: 'Rolled oolongs given a charcoal roast: Dong Ding and Muzha.',
          },
          {
            id: 'tw.oolong.bitten',
            tradition: 'tw',
            name: {en: 'Insect-bitten', native: '蜒仔著涎'},
            about:
              'Summer leaf bitten by leafhoppers, which triggers honey and muscat aromas. Heavily oxidised.',
          },
        ],
      },
      {
        id: 'tw.black',
        tradition: 'tw',
        name: {en: 'Taiwanese black', native: '台灣紅茶'},
        about:
          'Sun Moon Lake. Large-leaf Assamica was planted at Yuchi in the 1920s, alongside later Taiwanese cultivars.',
        brew: {practice: 'gongfu', tempC: 92, gPer100ml: 4},
        children: [
          {
            id: 'tw.black.sunmoonlake',
            tradition: 'tw',
            name: {en: 'Sun Moon Lake', native: '日月潭紅茶'},
            about: 'Malty and full, with natural notes of cinnamon and mint.',
          },
        ],
      },
    ],
  },
  {
    id: 'jp',
    tradition: 'jp',
    name: {en: 'Japan', native: '日本茶'},
    about:
      'Almost all Japanese tea is green, and nearly all of it is steamed. Its style comes from shading, steaming time, and which part of the plant is used.',
    children: [
      {
        id: 'jp.sencha',
        tradition: 'jp',
        name: {en: 'Sencha', native: '煎茶'},
        about:
          'Sun-grown, steamed, rolled into needles. Steaming length sets the style, from light 普通蒸し to deep 深蒸し.',
        brew: {practice: 'kyusu', tempC: 75, gPer100ml: 4},
        children: [
          {
            id: 'jp.sencha.steamed',
            tradition: 'jp',
            name: {en: 'Steamed sencha', native: '蒸し製煎茶'},
            about:
              'Futsū-mushi (~30–40 s steam) through fukamushi (60 s and more, cloudy and thick).',
          },
        ],
      },
      {
        id: 'jp.shaded',
        tradition: 'jp',
        name: {en: 'Shaded tea', native: '被覆茶'},
        about:
          'Bushes are covered before harvest. Less sunlight keeps theanine high, which gives intense umami and the marine aroma 覆い香.',
        brew: {practice: 'kyusu', tempC: 55, gPer100ml: 8},
        children: [
          {
            id: 'jp.shaded.leaf',
            tradition: 'jp',
            name: {en: 'Shaded leaf', native: '玉露 · かぶせ'},
            about:
              'Gyokuro is shaded about 20 days or more; kabusecha about a week.',
          },
          {
            id: 'jp.shaded.tencha',
            tradition: 'jp',
            name: {en: 'Tencha & matcha', native: '碾茶 · 抹茶'},
            about:
              'Shaded leaf that is steamed and dried flat without rolling (tencha), then stone-ground into matcha.',
            brew: {practice: 'whisk', tempC: 75, gPer100ml: 2},
          },
        ],
      },
      {
        id: 'jp.parts',
        tradition: 'jp',
        name: {en: 'Sorted teas', native: '出物'},
        about:
          'Stems, buds and fine particles sorted out when sencha and gyokuro are refined (仕上げ).',
        brew: {practice: 'kyusu', tempC: 75, gPer100ml: 4},
        children: [
          {
            id: 'jp.parts.sorted',
            tradition: 'jp',
            name: {en: 'Stem, bud & fine', native: '茎 · 芽 · 粉'},
            about: 'Kukicha and karigane (stem), mecha (bud), konacha (fine).',
          },
        ],
      },
      {
        id: 'jp.bancha',
        tradition: 'jp',
        name: {en: 'Bancha & roasted', native: '番茶 · 焙じ茶'},
        about:
          'Later or more mature harvests: everyday teas, often roasted or mixed with roasted rice.',
        brew: {practice: 'kyusu', tempC: 95, gPer100ml: 4},
        children: [
          {
            id: 'jp.bancha.plain',
            tradition: 'jp',
            name: {en: 'Bancha', native: '番茶'},
            about: 'Mature-leaf steamed green tea. Light, gentle, low in caffeine.',
          },
          {
            id: 'jp.bancha.roasted',
            tradition: 'jp',
            name: {en: 'Roasted & rice', native: '焙じ茶 · 玄米茶'},
            about:
              'Hōjicha is roasted over high heat (Kyoto, 1920s); genmaicha mixes leaf with roasted rice.',
          },
        ],
      },
      {
        id: 'jp.guri',
        tradition: 'jp',
        name: {en: 'Curled tea', native: '玉緑茶'},
        about:
          'Kyushu teas left curled rather than needle-rolled. Some are pan-fired in the Ming Chinese manner (釜炒り), others steamed (蒸し製).',
        brew: {practice: 'kyusu', tempC: 80, gPer100ml: 4},
        children: [
          {
            id: 'jp.guri.pan',
            tradition: 'jp',
            name: {en: 'Pan-fired', native: '釜炒り茶'},
            about:
              'Ureshino, Aoyagi and Takachiho. The kettle gives a toasty aroma (釜香).',
          },
          {
            id: 'jp.guri.steam',
            tradition: 'jp',
            name: {en: 'Steamed guricha', native: '蒸し製玉緑茶'},
            about: 'Steamed, then tumbled into commas.',
          },
        ],
      },
      {
        id: 'jp.ferment',
        tradition: 'jp',
        name: {en: 'Post-fermented', native: '後発酵茶'},
        about:
          'Rare regional teas fermented by lactic bacteria (and moulds), with roots older than sencha.',
        brew: {practice: 'kyusu', tempC: 98, gPer100ml: 3},
        children: [
          {
            id: 'jp.ferment.lactic',
            tradition: 'jp',
            name: {en: 'Lactic-fermented', native: '乳酸発酵茶'},
            about: 'Awa bancha (Tokushima) and Goishicha (Kōchi). Gently sour.',
          },
        ],
      },
    ],
  },
]

const index = new Map<string, {node: TaxonNode; path: TaxonNode[]}>()
const walk = (nodes: TaxonNode[], trail: TaxonNode[]) => {
  for (const node of nodes) {
    const path = [...trail, node]
    index.set(node.id, {node, path})
    if (node.children) walk(node.children, path)
  }
}
walk(TAXONOMY, [])

export const getNode = (id: string) => index.get(id)?.node

/** Root → node, inclusive. */
export const getPath = (id: string): TaxonNode[] => index.get(id)?.path ?? []

export const isLeafNode = (id: string) => {
  const node = getNode(id)
  return Boolean(node && !node.children?.length)
}

/** Nearest brewing default walking up from the node. */
export const getBrew = (id: string) =>
  [...getPath(id)].reverse().find(n => n.brew)?.brew

const GLYPH_BY_PREFIX: [string, string][] = [
  ['cn.green', '绿'],
  ['cn.yellow', '黄'],
  ['cn.white', '白'],
  ['cn.oolong', '青'],
  ['cn.black', '红'],
  ['cn.dark', '黑'],
  ['cn.puer', '普'],
  ['cn.scented', '花'],
  ['cn', '中'],
  ['tw', '台'],
  ['jp', '日'],
]

/** The calligraphic character that heads a branch of the Atlas. */
export const glyphFor = (nodeId: string) =>
  GLYPH_BY_PREFIX.find(([p]) => nodeId === p || nodeId.startsWith(`${p}.`))?.[1] ?? '茶'
