import { describe, expect, it } from 'vitest'
import { createMemoryCaptureMediaStore } from './captureMediaStore'
import type { PoseTape } from '../eval/poseTape'

const tape = (label: string) =>
  ({ frames: [], meta: { label } }) as unknown as PoseTape

function media(sessionId: string) {
  const blob = new Blob(['video-bytes'], { type: 'video/webm' })
  return {
    sessionId,
    blob,
    mimeType: 'video/webm',
    source: 'camera' as const,
    durationMs: 4200,
    sizeBytes: blob.size,
  }
}

describe('captureMediaStore', () => {
  it('round-trips media by session id', async () => {
    const store = createMemoryCaptureMediaStore()
    await store.saveMedia(media('s1'))
    const found = await store.getMedia('s1')
    expect(found?.mimeType).toBe('video/webm')
    expect(found?.durationMs).toBe(4200)
  })

  it('round-trips a pose tape by session id', async () => {
    const store = createMemoryCaptureMediaStore()
    await store.saveTape({ sessionId: 's1', tape: tape('one') })
    expect((await store.getTape('s1'))?.meta.label).toBe('one')
  })

  it('returns null for a session with no stored artifacts', async () => {
    const store = createMemoryCaptureMediaStore()
    await expect(store.getMedia('missing')).resolves.toBeNull()
    await expect(store.getTape('missing')).resolves.toBeNull()
  })

  it('keeps sessions independent', async () => {
    const store = createMemoryCaptureMediaStore()
    await store.saveTape({ sessionId: 's1', tape: tape('one') })
    await store.saveTape({ sessionId: 's2', tape: tape('two') })
    expect((await store.getTape('s2'))?.meta.label).toBe('two')
  })

  it('delete removes both the media and the tape for that session only', async () => {
    const store = createMemoryCaptureMediaStore()
    await store.saveMedia(media('s1'))
    await store.saveTape({ sessionId: 's1', tape: tape('one') })
    await store.saveMedia(media('s2'))

    await store.delete('s1')

    expect(await store.getMedia('s1')).toBeNull()
    expect(await store.getTape('s1')).toBeNull()
    expect(await store.getMedia('s2')).not.toBeNull()
  })

  it('deleteAll clears every artifact', async () => {
    const store = createMemoryCaptureMediaStore()
    await store.saveMedia(media('s1'))
    await store.saveTape({ sessionId: 's2', tape: tape('two') })
    await store.deleteAll()
    expect(await store.getMedia('s1')).toBeNull()
    expect(await store.getTape('s2')).toBeNull()
  })
})
