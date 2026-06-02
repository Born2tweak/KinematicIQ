import { describe, expect, it } from 'vitest'
import {
  angleBetweenThreePoints,
  distance2D,
  midpoint,
} from './geometry'

describe('geometry', () => {
  it('computes distance between two points', () => {
    expect(distance2D({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
  })

  it('computes midpoint', () => {
    expect(midpoint({ x: 0, y: 0 }, { x: 2, y: 4 })).toEqual({ x: 1, y: 2 })
  })

  it('returns 90° for a right angle at the vertex', () => {
    const angle = angleBetweenThreePoints(
      { x: 1, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 1 },
    )
    expect(angle).not.toBeNull()
    expect(angle!).toBeCloseTo(90, 5)
  })

  it('returns null for degenerate vectors', () => {
    expect(
      angleBetweenThreePoints({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }),
    ).toBeNull()
  })
})
