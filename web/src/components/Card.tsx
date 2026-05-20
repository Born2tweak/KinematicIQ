import type { ReactNode } from 'react'

type CardVariant = 'default' | 'status'

interface CardProps {
  children?: ReactNode
  title?: string
  subtitle?: string
  className?: string
  variant?: CardVariant
}

export function Card({
  children,
  title,
  subtitle,
  className = '',
  variant = 'default',
}: CardProps) {
  const classes = [
    'card',
    variant === 'status' ? 'card--status' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={classes}>
      {title && <h2 className="card__title">{title}</h2>}
      {subtitle && <p className="card__subtitle">{subtitle}</p>}
      {children}
    </div>
  )
}
