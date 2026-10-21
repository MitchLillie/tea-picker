import {useMemo} from 'react'

import {ProductCard, ProductCardSkeleton, useProductSearch} from '@shopify/shop-minis-react'

import {categoriesFor, productIs, TEA_CATEGORY, type MatchMode} from '../tea/catalog'
import type {Tea} from '../tea/types'

interface ShopShelfProps {
  tea: Tea
  mode?: MatchMode
  onEmpty?: () => void
}

/**
 * Live Shop products that genuinely are this tea. Search results are kept
 * only when the title passes the purity filter and names this tea (or, in
 * family mode, its style); everything else is dropped rather than shown.
 */
export function ShopShelf({tea, mode = 'family'}: ShopShelfProps) {
  const primary = useProductSearch({
    query: tea.query,
    first: 24,
    filters: {category: categoriesFor(tea)},
  })
  const primaryMatches = useMemo(
    () => (primary.products ?? []).filter(p => productIs(p.title, tea, mode)),
    [primary.products, tea, mode]
  )
  // Sellers often file tea loosely: widen to the whole Tea category if needed.
  const broaden = !primary.loading && primaryMatches.length < 2
  const wide = useProductSearch({
    query: `${tea.name.en} ${tea.name.roman !== tea.name.en ? tea.name.roman : ''}`.trim(),
    first: 24,
    filters: {category: [TEA_CATEGORY]},
    skip: !broaden,
  })
  const products = useMemo(() => {
    const seen = new Set<string>()
    return [...primaryMatches, ...(wide.products ?? []).filter(p => productIs(p.title, tea, mode))].filter(p =>
      seen.has(p.id) ? false : (seen.add(p.id), true)
    )
  }, [primaryMatches, wide.products, tea, mode])

  const loading = primary.loading || (broaden && wide.loading)

  if (loading && !products.length) {
    return (
      <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-[156px] shrink-0">
            <ProductCardSkeleton />
          </div>
        ))}
      </div>
    )
  }

  if (!products.length) {
    return (
      <p className="rounded-[3px] border border-dashed border-ink-20 px-4 py-3 text-[14px] italic text-ink-60">
        Not in the Shop garden today.
      </p>
    )
  }

  return (
    <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
      {products.map(p => (
        <div key={p.id} className="w-[156px] shrink-0">
          <ProductCard product={p} />
        </div>
      ))}
    </div>
  )
}
