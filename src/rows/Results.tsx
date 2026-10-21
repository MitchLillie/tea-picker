import {useMemo} from 'react'

import {useApp} from '../state/app'
import {recommend} from '../tea/match'
import {EMPTY_ANSWERS} from '../tea/profile'
import {InkButton, Page, PickerSays, SectionTitle} from '../ui/kit'

import {ShopShelf} from './ShopShelf'
import {TeaCard} from './TeaCard'

export function Results() {
  const {palate, push, pop} = useApp()
  const {picks, further} = useMemo(() => recommend(palate ?? EMPTY_ANSWERS), [palate])
  return (
    <Page glyph="品" title="Your teas" subtitle="Poured for your palate">
      <PickerSays>These three, I think. And one more — a step beyond where you usually walk.</PickerSays>
      <div className="mt-8 space-y-8">
        {picks.map((r, i) => (
          <TeaCard
            key={r.tea.id}
            tea={r.tea}
            reasons={r.reasons}
            badge={['First cup', 'Second cup', 'Third cup'][i]}
            onOpen={() => push({id: 'tea', teaId: r.tea.id})}
          >
            <ShopShelf tea={r.tea} />
          </TeaCard>
        ))}
      </div>
      {further && (
        <>
          <SectionTitle glyph="人">A step further</SectionTitle>
          <TeaCard
            tea={further.tea}
            reasons={further.reasons}
            badge="Beyond your path"
            onOpen={() => push({id: 'tea', teaId: further.tea.id})}
          >
            <ShopShelf tea={further.tea} />
          </TeaCard>
        </>
      )}
      <div className="mt-10">
        <InkButton variant="ghost" onClick={pop} className="w-full">
          Adjust my answers
        </InkButton>
      </div>
    </Page>
  )
}
