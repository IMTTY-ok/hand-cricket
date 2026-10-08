export type Screen = 'home' | 'howto' | 'practice' | 'leaderboard' | 'stats' | 'game'

export const OVER_OPTIONS = [
  { value: 1 as const, label: '1 over', hint: '6 balls' },
  { value: 2 as const, label: '2 overs', hint: '12 balls · default' },
  { value: 3 as const, label: '3 overs', hint: '18 balls' },
  { value: 5 as const, label: '5 overs', hint: '30 balls' },
  { value: 10 as const, label: '10 overs', hint: '60 balls' },
]

export const DIFFICULTY_OPTIONS = [
  { value: 'easy' as const, label: 'Easy', hint: 'Random opponent' },
  { value: 'medium' as const, label: 'Medium', hint: 'Adaptive opponent' },
  { value: 'hard' as const, label: 'Hard', hint: 'Strategic opponent' },
]
