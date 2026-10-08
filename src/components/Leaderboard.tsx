import type { LeaderboardEntry } from '../firebase/leaderboard'
import { Icon } from './ui/Icon'
import { Button } from './ui/Button'

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  source: 'cloud' | 'local'
  loading: boolean
  error: string | null
  currentName: string
  onRefresh: () => void
}

const RANK_TONES = ['text-warn', 'text-text', 'text-warn/70']

export function Leaderboard({
  entries,
  source,
  loading,
  error,
  currentName,
  onRefresh,
}: LeaderboardProps) {
  return (
    <div className="card overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <span className="size-8 grid place-items-center rounded-xl bg-accent-soft text-accent">
            <Icon name="trophy" size={16} />
          </span>
          <div>
            <h2 className="text-sm font-bold tracking-tight">Top 10 players</h2>
            <p className="text-[11px] text-faint">
              {source === 'cloud' ? 'Synced leaderboard' : 'Saved on this device'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh} aria-label="Refresh leaderboard">
          <Icon name="refresh" size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </header>

      {error && (
        <p className="px-5 py-3 text-xs text-danger bg-danger-soft border-b border-border">
          {error}
        </p>
      )}

      <div className="divide-y divide-border">
        {entries.length === 0 && !loading && (
          <div className="px-5 py-10 text-center">
            <div className="mx-auto mb-3 size-11 grid place-items-center rounded-2xl bg-surface-2 text-faint">
              <Icon name="trophy" size={20} />
            </div>
            <p className="text-sm font-semibold">No scores yet</p>
            <p className="mt-1 text-xs text-faint">Play a match to claim the top spot.</p>
          </div>
        )}

        {entries.map((entry, i) => {
          const isMe = entry.name.trim().toLowerCase() === currentName.trim().toLowerCase()
          return (
            <div
              key={entry.id}
              className={`flex items-center gap-3 px-4 sm:px-5 py-3 ${
                isMe ? 'bg-accent-soft' : ''
              }`}
            >
              <span
                className={`w-7 text-center text-sm font-extrabold tabular ${
                  i < 3 ? RANK_TONES[i] : 'text-faint'
                }`}
              >
                {i + 1}
              </span>
              <span className="flex-1 min-w-0 truncate text-sm font-semibold">
                {entry.name}
                {isMe && <span className="ml-2 text-[10px] uppercase tracking-wider text-accent">you</span>}
              </span>
              <span className="text-sm font-extrabold tabular">{entry.score}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
