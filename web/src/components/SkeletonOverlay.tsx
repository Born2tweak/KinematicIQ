import { forwardRef } from 'react'

export { drawSkeleton, clearSkeleton } from '../cv/drawSkeleton'
export type { DrawSkeletonOptions } from '../cv/drawSkeleton'

export const SkeletonOverlay = forwardRef<HTMLCanvasElement>(
  function SkeletonOverlay(_props, ref) {
    return (
      <canvas
        ref={ref}
        className="skeleton-overlay camera-stage__media"
        aria-hidden
      />
    )
  },
)
