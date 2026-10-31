// @vitest-environment jsdom
import {renderHook} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {useSpriteUrl} from './useSpriteUrl'

describe('useSpriteUrl', () => {
  const create = vi.fn(() => 'blob:sprite')
  const revoke = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('URL', Object.assign(URL, {createObjectURL: create, revokeObjectURL: revoke}))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    create.mockClear()
    revoke.mockClear()
  })

  it('creates the URL in an effect, not during render, and revokes it on unmount', () => {
    let during = -1
    const {result, unmount} = renderHook(() => {
      const url = useSpriteUrl('<svg/>')
      if (during < 0) during = create.mock.calls.length
      return url
    })
    expect(during).toBe(0)
    expect(create).toHaveBeenCalledTimes(1)
    expect(result.current).toBe('blob:sprite')
    unmount()
    expect(revoke).toHaveBeenCalledWith('blob:sprite')
  })
})
