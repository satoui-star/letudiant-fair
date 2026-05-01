/**
 * Icon — professional stroke-style SVG icons matching the L'Étudiant editorial aesthetic.
 * Renders inline so they inherit `currentColor` and any size from the parent text/CSS.
 *
 * Usage:
 *   <Icon name="calendar" />           // 16px, currentColor
 *   <Icon name="chart" size={20} />
 *   <Icon name="lock" style={{ color: '#EC1F27' }} />
 */

import type { CSSProperties } from 'react'

export type IconName =
  | 'calendar'
  | 'chart'
  | 'users'
  | 'user'
  | 'target'
  | 'lock'
  | 'phone'
  | 'qr'
  | 'scan'
  | 'share'
  | 'upload'
  | 'download'
  | 'check'
  | 'check-circle'
  | 'x'
  | 'x-circle'
  | 'alert'
  | 'info'
  | 'lightbulb'
  | 'clock'
  | 'hourglass'
  | 'search'
  | 'school'
  | 'graduation'
  | 'book'
  | 'briefcase'
  | 'building'
  | 'pin'
  | 'map'
  | 'video'
  | 'image'
  | 'mic'
  | 'mail'
  | 'link'
  | 'settings'
  | 'flask'
  | 'trash'
  | 'refresh'
  | 'wallet'
  | 'heart'
  | 'globe'
  | 'scale'
  | 'film'
  | 'monitor'
  | 'compass'
  | 'eye'
  | 'message'
  | 'trend'
  | 'edit'
  | 'sparkle'
  | 'arrow-right'
  | 'arrow-left'
  | 'arrow-up-down'
  | 'document'
  | 'folder'
  | 'star'
  | 'inbox'
  | 'list'
  | 'plus'
  | 'minus'
  | 'dot'

interface IconProps {
  name: IconName
  size?: number | string
  strokeWidth?: number
  className?: string
  style?: CSSProperties
  'aria-hidden'?: boolean
  'aria-label'?: string
}

const SVG_DEFAULTS = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export default function Icon({
  name,
  size = 16,
  strokeWidth = 1.75,
  className,
  style,
  ...rest
}: IconProps) {
  const ariaHidden = rest['aria-hidden'] ?? !rest['aria-label']
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    className,
    style: { display: 'inline-block', verticalAlign: '-0.15em', flexShrink: 0, ...style } as CSSProperties,
    'aria-hidden': ariaHidden,
    'aria-label': rest['aria-label'],
    role: rest['aria-label'] ? 'img' : undefined,
    ...SVG_DEFAULTS,
    strokeWidth,
  }

  switch (name) {
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      )
    case 'chart':
      return (
        <svg {...common}>
          <path d="M3 21V3M3 21h18" />
          <path d="M7 16v-5M11 16V8M15 16v-3M19 16V6" />
        </svg>
      )
    case 'users':
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20c.5-3.5 3.3-6 6.5-6s6 2.5 6.5 6" />
          <path d="M16 4a3.5 3.5 0 0 1 0 7" />
          <path d="M18 14c2.5.6 4 2.8 4 5.5" />
        </svg>
      )
    case 'user':
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c1-4.5 4.5-7 8-7s7 2.5 8 7" />
        </svg>
      )
    case 'target':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'lock':
      return (
        <svg {...common}>
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      )
    case 'phone':
      return (
        <svg {...common}>
          <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
          <path d="M11 18h2" />
        </svg>
      )
    case 'qr':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <path d="M14 14h3v3M21 14v3M14 21h3M21 17v4h-4" />
        </svg>
      )
    case 'scan':
      return (
        <svg {...common}>
          <path d="M3 8V5a2 2 0 0 1 2-2h3" />
          <path d="M16 3h3a2 2 0 0 1 2 2v3" />
          <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
          <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
          <path d="M3 12h18" />
        </svg>
      )
    case 'share':
      return (
        <svg {...common}>
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4" />
        </svg>
      )
    case 'upload':
      return (
        <svg {...common}>
          <path d="M12 4v12M7 9l5-5 5 5" />
          <path d="M5 20h14" />
        </svg>
      )
    case 'download':
      return (
        <svg {...common}>
          <path d="M12 4v12M7 11l5 5 5-5" />
          <path d="M5 20h14" />
        </svg>
      )
    case 'check':
      return (
        <svg {...common}>
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      )
    case 'check-circle':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12.5l3 3 5-6" />
        </svg>
      )
    case 'x':
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      )
    case 'x-circle':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9 9l6 6M15 9l-6 6" />
        </svg>
      )
    case 'alert':
      return (
        <svg {...common}>
          <path d="M12 3.5L1.5 21h21L12 3.5z" />
          <path d="M12 10v5M12 18v.5" />
        </svg>
      )
    case 'info':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v6M12 7.5v.5" />
        </svg>
      )
    case 'lightbulb':
      return (
        <svg {...common}>
          <path d="M9 18h6M10 21h4" />
          <path d="M12 3a6 6 0 0 0-3.5 10.8c.6.5.9 1.2.9 2L9.5 18h5l.1-2.2c0-.8.3-1.5.9-2A6 6 0 0 0 12 3z" />
        </svg>
      )
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3.5 2" />
        </svg>
      )
    case 'hourglass':
      return (
        <svg {...common}>
          <path d="M6 3h12M6 21h12" />
          <path d="M7 3v3a5 5 0 0 0 2 4l3 2 3-2a5 5 0 0 0 2-4V3" />
          <path d="M7 21v-3a5 5 0 0 1 2-4l3-2 3 2a5 5 0 0 1 2 4v3" />
        </svg>
      )
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="M16 16l5 5" />
        </svg>
      )
    case 'school':
    case 'building':
      return (
        <svg {...common}>
          <path d="M3 21h18" />
          <path d="M5 21V8l7-4 7 4v13" />
          <path d="M9 21v-6h6v6" />
          <path d="M9 11h.5M14.5 11h.5" />
        </svg>
      )
    case 'graduation':
      return (
        <svg {...common}>
          <path d="M2 9l10-4 10 4-10 4-10-4z" />
          <path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" />
          <path d="M22 9v5" />
        </svg>
      )
    case 'book':
      return (
        <svg {...common}>
          <path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4V4z" />
          <path d="M20 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8V4z" />
        </svg>
      )
    case 'briefcase':
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
          <path d="M3 13h18" />
        </svg>
      )
    case 'pin':
      return (
        <svg {...common}>
          <path d="M12 21s7-7 7-12a7 7 0 0 0-14 0c0 5 7 12 7 12z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      )
    case 'map':
      return (
        <svg {...common}>
          <path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2z" />
          <path d="M9 4v14M15 6v14" />
        </svg>
      )
    case 'video':
    case 'film':
      return (
        <svg {...common}>
          <rect x="3" y="6" width="14" height="12" rx="2" />
          <path d="M17 10l4-2v8l-4-2z" />
        </svg>
      )
    case 'image':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="9" cy="10" r="1.5" />
          <path d="M21 16l-5-5-9 9" />
        </svg>
      )
    case 'mic':
      return (
        <svg {...common}>
          <rect x="9" y="3" width="6" height="12" rx="3" />
          <path d="M5 11a7 7 0 0 0 14 0" />
          <path d="M12 18v3" />
        </svg>
      )
    case 'mail':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" />
        </svg>
      )
    case 'link':
      return (
        <svg {...common}>
          <path d="M10 14a4 4 0 0 1 0-5.7l3-3a4 4 0 0 1 5.7 5.7l-1.5 1.5" />
          <path d="M14 10a4 4 0 0 1 0 5.7l-3 3a4 4 0 0 1-5.7-5.7l1.5-1.5" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 14a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V20a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H4a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H10a1.7 1.7 0 0 0 1-1.5V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V10a1.7 1.7 0 0 0 1.5 1H20a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      )
    case 'flask':
      return (
        <svg {...common}>
          <path d="M9 3h6M10 3v6L4.5 19a2 2 0 0 0 1.7 3h11.6a2 2 0 0 0 1.7-3L14 9V3" />
          <path d="M7 14h10" />
        </svg>
      )
    case 'trash':
      return (
        <svg {...common}>
          <path d="M4 7h16M9 7V4h6v3" />
          <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
          <path d="M10 12v5M14 12v5" />
        </svg>
      )
    case 'refresh':
      return (
        <svg {...common}>
          <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" />
          <path d="M3 21v-5h5" />
        </svg>
      )
    case 'wallet':
      return (
        <svg {...common}>
          <path d="M3 7a2 2 0 0 1 2-2h12v4" />
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <circle cx="17" cy="13.5" r="1.2" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'heart':
      return (
        <svg {...common}>
          <path d="M12 20s-7-4.5-9-9.5C1.5 6 5 3 8 4.5c1.6.8 3 2.5 4 4 1-1.5 2.4-3.2 4-4 3-1.5 6.5 1.5 5 6-2 5-9 9.5-9 9.5z" />
        </svg>
      )
    case 'globe':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
      )
    case 'scale':
      return (
        <svg {...common}>
          <path d="M12 3v18M5 6h14" />
          <path d="M5 6l-3 7c0 2 1.3 3 3 3s3-1 3-3L5 6z" />
          <path d="M19 6l-3 7c0 2 1.3 3 3 3s3-1 3-3l-3-7z" />
          <path d="M7 21h10" />
        </svg>
      )
    case 'monitor':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="13" rx="2" />
          <path d="M9 21h6M12 17v4" />
        </svg>
      )
    case 'compass':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M15 9l-2 5-5 2 2-5 5-2z" />
        </svg>
      )
    case 'eye':
      return (
        <svg {...common}>
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )
    case 'message':
      return (
        <svg {...common}>
          <path d="M21 12a8 8 0 0 1-12 7l-5 1 1-5a8 8 0 1 1 16-3z" />
        </svg>
      )
    case 'trend':
      return (
        <svg {...common}>
          <path d="M3 17l6-6 4 4 8-8" />
          <path d="M14 7h7v7" />
        </svg>
      )
    case 'edit':
      return (
        <svg {...common}>
          <path d="M4 20h4l11-11-4-4L4 16v4z" />
          <path d="M14 6l4 4" />
        </svg>
      )
    case 'sparkle':
      return (
        <svg {...common}>
          <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
          <path d="M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3" />
        </svg>
      )
    case 'arrow-right':
      return (
        <svg {...common}>
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      )
    case 'arrow-left':
      return (
        <svg {...common}>
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
      )
    case 'arrow-up-down':
      return (
        <svg {...common}>
          <path d="M7 4v16M4 7l3-3 3 3" />
          <path d="M17 20V4M14 17l3 3 3-3" />
        </svg>
      )
    case 'document':
      return (
        <svg {...common}>
          <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6z" />
          <path d="M14 3v6h6M8 13h8M8 17h6" />
        </svg>
      )
    case 'folder':
      return (
        <svg {...common}>
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
        </svg>
      )
    case 'star':
      return (
        <svg {...common}>
          <path d="M12 3l2.7 5.5 6 .9-4.3 4.2 1 6L12 16.7l-5.4 2.9 1-6L3.3 9.4l6-.9L12 3z" />
        </svg>
      )
    case 'inbox':
      return (
        <svg {...common}>
          <path d="M3 13l2-9h14l2 9" />
          <path d="M3 13v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6" />
          <path d="M3 13h5l2 3h4l2-3h5" />
        </svg>
      )
    case 'list':
      return (
        <svg {...common}>
          <path d="M8 6h13M8 12h13M8 18h13" />
          <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
          <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
          <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      )
    case 'minus':
      return (
        <svg {...common}>
          <path d="M5 12h14" />
        </svg>
      )
    case 'dot':
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
        </svg>
      )
  }
}
