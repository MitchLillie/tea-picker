// @vitest-environment jsdom
import {renderHook} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {usePaperGrain} from './usePaperGrain'

const flush = () => new Promise(r => setTimeout(r, 0))

describe('usePaperGrain', () => {
  let resolveBlob: (b: Blob | null) => void
  const create = vi.fn(() => 'blob:grain')
  const revoke = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('URL', Object.assign(URL, {createObjectURL: create, revokeObjectURL: revoke}))
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      createImageData: (w: number, h: number) => ({data: new Uint8ClampedArray(w * h * 4)}),
      putImageData: vi.fn(),
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(cb => {
      resolveBlob = cb
    })
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    create.mockClear()
    revoke.mockClear()
  })

  it('sets --paper-grain, then revokes and removes it on unmount', async () => {
    const {unmount} = renderHook(() => usePaperGrain())
    resolveBlob(new Blob(['x']))
    await flush()
    expect(create).toHaveBeenCalledTimes(1)
    expect(document.documentElement.style.getPropertyValue('--paper-grain')).toBe('url(blob:grain)')
    unmount()
    expect(revoke).toHaveBeenCalledWith('blob:grain')
    expect(document.documentElement.style.getPropertyValue('--paper-grain')).toBe('')
  })

  it('creates no URL when unmounted before toBlob resolves', async () => {
    const {unmount} = renderHook(() => usePaperGrain())
    unmount()
    resolveBlob(new Blob(['x']))
    await flush()
    expect(create).not.toHaveBeenCalled()
    expect(document.documentElement.style.getPropertyValue('--paper-grain')).toBe('')
  })
})
