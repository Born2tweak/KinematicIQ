import { afterEach, describe, expect, it, vi } from 'vitest'
import { pickMimeType, startCaptureRecording } from './captureRecorder'
import {
  clearPendingCapture,
  setPendingCaptureMedia,
  setPendingCaptureTape,
  takePendingCapture,
} from './pendingCapture'
import type { PoseTape } from '../eval/poseTape'

describe('pickMimeType', () => {
  it('prefers the first supported candidate', () => {
    expect(pickMimeType(() => true)).toBe('video/webm;codecs=vp9')
  })

  it('falls through to a later candidate', () => {
    expect(pickMimeType((t) => t === 'video/mp4')).toBe('video/mp4')
  })

  it('returns null when nothing is supported', () => {
    expect(pickMimeType(() => false)).toBeNull()
  })

  it('treats a browser that throws on an unknown type as unsupported', () => {
    expect(
      pickMimeType(() => {
        throw new Error('nope')
      }),
    ).toBeNull()
  })
})

describe('startCaptureRecording', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is inert without a stream and never throws', async () => {
    const recorder = startCaptureRecording(null)
    expect(recorder.recording).toBe(false)
    await expect(recorder.stop()).resolves.toBeNull()
  })

  it('is inert when the browser has no MediaRecorder', async () => {
    vi.stubGlobal('MediaRecorder', undefined)
    const recorder = startCaptureRecording({} as MediaStream)
    expect(recorder.recording).toBe(false)
    await expect(recorder.stop()).resolves.toBeNull()
  })

  it('is inert when no candidate codec is supported', async () => {
    class Never {
      static isTypeSupported() {
        return false
      }
    }
    vi.stubGlobal('MediaRecorder', Never)
    const recorder = startCaptureRecording({} as MediaStream)
    expect(recorder.recording).toBe(false)
    await expect(recorder.stop()).resolves.toBeNull()
  })

  it('is inert when the constructor throws, rather than propagating', async () => {
    class Hostile {
      static isTypeSupported() {
        return true
      }
      constructor() {
        throw new Error('unsupported configuration')
      }
    }
    vi.stubGlobal('MediaRecorder', Hostile)
    // A capture must never fail because video could not be recorded.
    expect(() => startCaptureRecording({} as MediaStream)).not.toThrow()
    expect(startCaptureRecording({} as MediaStream).recording).toBe(false)
  })
})

describe('pendingCapture', () => {
  afterEach(() => clearPendingCapture())

  it('hands off media and tape together', () => {
    const tape = { frames: [], meta: {} } as unknown as PoseTape
    setPendingCaptureMedia({
      blob: new Blob(['x']),
      mimeType: 'video/webm',
      source: 'camera',
      durationMs: 1200,
    })
    setPendingCaptureTape(tape)
    const taken = takePendingCapture()
    expect(taken.media?.source).toBe('camera')
    expect(taken.tape).toBe(tape)
  })

  it('clears on take so a second analysis cannot inherit the first footage', () => {
    setPendingCaptureMedia({
      blob: new Blob(['x']),
      mimeType: 'video/webm',
      source: 'upload',
      durationMs: null,
    })
    takePendingCapture()
    expect(takePendingCapture()).toEqual({ media: null, tape: null })
  })
})
