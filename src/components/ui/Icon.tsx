import type { SVGProps } from 'react'

export type IconName =
  | 'play'
  | 'book'
  | 'trophy'
  | 'chart'
  | 'camera'
  | 'camera-off'
  | 'volume'
  | 'volume-off'
  | 'sun'
  | 'moon'
  | 'back'
  | 'check'
  | 'close'
  | 'refresh'
  | 'target'
  | 'users'
  | 'hand'
  | 'bolt'
  | 'info'
  | 'lock'
  | 'star'
  | 'settings'

const PATHS: Record<IconName, string> = {
  play: 'M8 5.5v13l11-6.5z',
  book: 'M4 5.5A1.5 1.5 0 0 1 5.5 4H19v14.5H5.5A1.5 1.5 0 0 0 4 20zM4 18.5A1.5 1.5 0 0 1 5.5 17H19v3H5.5A1.5 1.5 0 0 1 4 18.5zM8 8h7M8 11.5h5',
  trophy: 'M7 4h10v4a5 5 0 0 1-10 0zM7 6H4.5A1.5 1.5 0 0 0 3 7.5v.5a3.5 3.5 0 0 0 3.5 3.5H7M17 6h2.5A1.5 1.5 0 0 1 21 7.5v.5a3.5 3.5 0 0 1-3.5 3.5H17M12 13v4m-3 3h6m-5 0a1 1 0 0 0 1-1v-2h2v2a1 1 0 0 0 1 1',
  chart: 'M4 20V10m6 10V4m6 16v-7m4 7H2',
  camera: 'M4 8.5A1.5 1.5 0 0 1 5.5 7h1.7a1 1 0 0 0 .83-.45l.94-1.4A1 1 0 0 1 9.8 4.7h4.4a1 1 0 0 1 .83.45l.94 1.4a1 1 0 0 0 .83.45h1.7A1.5 1.5 0 0 1 20 8.5v8A1.5 1.5 0 0 1 18.5 18h-13A1.5 1.5 0 0 1 4 16.5zM12 15.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  'camera-off': 'M3 3l18 18M7.5 7H5.5A1.5 1.5 0 0 0 4 8.5v8A1.5 1.5 0 0 0 5.5 18h13M9.8 4.7h4.4a1 1 0 0 1 .83.45l.94 1.4a1 1 0 0 0 .83.45h1.7A1.5 1.5 0 0 1 20 8.5v5.2M15.5 15.6a3 3 0 0 1-4.1-4.1',
  volume: 'M5 9.5h3l4-3.5v12l-4-3.5H5zM16 9.5a3.5 3.5 0 0 1 0 5M18.5 7a7 7 0 0 1 0 10',
  'volume-off': 'M5 9.5h3l4-3.5v12l-4-3.5H5zM16.5 10l4 4m0-4-4 4',
  sun: 'M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9zM12 2.5v2m0 15v2M2.5 12h2m15 0h2M5.2 5.2l1.4 1.4m10.8 10.8 1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4',
  moon: 'M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z',
  back: 'M15 5l-7 7 7 7',
  check: 'M4.5 12.5l5 5 10-11',
  close: 'M6 6l12 12M18 6L6 18',
  refresh: 'M20 11a8 8 0 1 0-.7 4.5M20 5v6h-6',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  users: 'M9 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 5a3.5 3.5 0 0 1 0 6.8M17.5 14.2A6.5 6.5 0 0 1 21.5 20',
  hand: 'M8 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5v-4a1.5 1.5 0 0 1 3 0v4.5m0-3a1.5 1.5 0 0 1 3 0V14c0 3.9-2.6 7-6.5 7S8 18 6.5 15.5L5 13a1.5 1.5 0 0 1 2.4-1.8L8 12.5V11',
  bolt: 'M13.5 3 5 13.5h6L10.5 21 19 10.5h-6z',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5.5M12 7.6v.1',
  lock: 'M6.5 11V8a5.5 5.5 0 0 1 11 0v3M5.5 11h13v9h-13z',
  star: 'm12 3.8 2.5 5.1 5.6.8-4 4 .9 5.6-5-2.6-5 2.6.9-5.6-4-4 5.6-.8z',
  settings:
    'M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM19.4 13.5a1.4 1.4 0 0 0 .3 1.5l.1.1a1.7 1.7 0 1 1-2.4 2.4l-.1-.1a1.4 1.4 0 0 0-2.4 1v.3a1.7 1.7 0 1 1-3.4 0v-.2a1.4 1.4 0 0 0-2.4-1l-.1.1a1.7 1.7 0 1 1-2.4-2.4l.1-.1a1.4 1.4 0 0 0-1-2.4H5.4a1.7 1.7 0 1 1 0-3.4h.2a1.4 1.4 0 0 0 1-2.4l-.1-.1a1.7 1.7 0 1 1 2.4-2.4l.1.1a1.4 1.4 0 0 0 2.4-1V4.4a1.7 1.7 0 1 1 3.4 0v.2a1.4 1.4 0 0 0 2.4 1l.1-.1a1.7 1.7 0 1 1 2.4 2.4l-.1.1a1.4 1.4 0 0 0 1 2.4h.3a1.7 1.7 0 1 1 0 3.4h-.2a1.4 1.4 0 0 0-1.3.9z',
}

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
}

export function Icon({ name, size = 20, ...rest }: IconProps) {
  const filled = name === 'play' || name === 'star' || name === 'bolt'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
