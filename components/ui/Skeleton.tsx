import React from 'react'

interface SkeletonProps {
  className?: string
  variant?: 'line' | 'card' | 'circle' | 'kpi'
}

export function Skeleton({ className = '', variant = 'line' }: SkeletonProps) {
  const base = 'animate-pulse bg-gray-200 rounded'
  if (variant === 'circle') return <div className={`${base} rounded-full ${className}`} style={{ minWidth: 48, minHeight: 48 }} />
  if (variant === 'card') return (
    <div className={`${base} rounded-2xl ${className}`} style={{ minHeight: 160 }} />
  )
  if (variant === 'kpi') return (
    <div className={`rounded-2xl border border-gray-100 p-5 space-y-3 ${className}`}>
      <div className={`${base} h-3 w-24`} />
      <div className={`${base} h-8 w-16`} />
      <div className={`${base} h-2 w-32`} />
    </div>
  )
  return <div className={`${base} h-4 w-full ${className}`} />
}

export function SkeletonList({ count = 4, variant = 'kpi' }: { count?: number; variant?: SkeletonProps['variant'] }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant={variant} />
      ))}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-100 p-4 space-y-3 animate-pulse">
      <div className="bg-gray-200 rounded-xl h-36 w-full" />
      <div className="bg-gray-200 h-4 w-3/4 rounded" />
      <div className="bg-gray-200 h-3 w-1/2 rounded" />
      <div className="flex gap-2">
        <div className="bg-gray-200 h-6 w-16 rounded-full" />
        <div className="bg-gray-200 h-6 w-20 rounded-full" />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      <div className="bg-gray-100 h-10 rounded-lg" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-gray-50 h-14 rounded-lg" />
      ))}
    </div>
  )
}
