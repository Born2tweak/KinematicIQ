import { useEffect, useRef } from 'react'

const REDRAW_INTERVAL_MS = 100
const LINE_COLOR = '#4ade80'
const PADDING = 4

export interface DepthSparklineData {
  depthHistory: { t: number; y: number }[]
}

interface DepthSparklineProps {
  dataRef: React.RefObject<DepthSparklineData>
}

function draw(canvas: HTMLCanvasElement, depthHistory: { t: number; y: number }[]): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { width, height } = canvas
  ctx.clearRect(0, 0, width, height)

  if (depthHistory.length < 2) return

  const values = depthHistory.map((sample) => sample.y)
  const minY = Math.min(...values)
  const maxY = Math.max(...values)
  const range = maxY - minY || 1

  const innerWidth = width - PADDING * 2
  const innerHeight = height - PADDING * 2

  ctx.beginPath()
  depthHistory.forEach((sample, i) => {
    const x = PADDING + (i / (depthHistory.length - 1)) * innerWidth
    const normalized = (sample.y - minY) / range
    const y = PADDING + (1 - normalized) * innerHeight
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  ctx.strokeStyle = LINE_COLOR
  ctx.lineWidth = 2
  ctx.stroke()
}

export function DepthSparkline({ dataRef }: DepthSparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const id = setInterval(() => {
      const canvas = canvasRef.current
      const data = dataRef.current
      if (!canvas || !data) return
      draw(canvas, data.depthHistory)
    }, REDRAW_INTERVAL_MS)
    return () => clearInterval(id)
  }, [dataRef])

  return (
    <canvas
      ref={canvasRef}
      className="depth-sparkline"
      width={200}
      height={48}
      aria-hidden
    />
  )
}
