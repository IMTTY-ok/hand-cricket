import { winRate, type CareerStats } from '../app/stats'
import { Icon } from './ui/Icon'

interface PlayerStatsProps {
  stats: CareerStats
  compact?: boolean
}

function Item({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl bg-surface-2 border border-border px-3.5 py-3">
      <p className="text-[10px] uppercase tracking-[0.14em] text-faint font-bold">{label}</p>
      <p className="mt-1 text-xl font-extrabold tabular leading-none">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-faint">{hint}</p>}
    </div>
  )
}

export function PlayerStats({ stats, compact = false }: PlayerStatsProps) {
  if (compact) {
    return (
      <div className="card p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-faint font-bold mb-2.5">
          Your record
        </p>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-2xl font-extrabold leading-none tabular">{stats.matchesPlayed}</p>
            <p className="text-[11px] text-faint mt-1">Matches</p>
          </div>
          <div className="h-9 w-px bg-border" />
          <div>
            <p className="text-2xl font-extrabold leading-none text-accent tabular">{stats.wins}</p>
            <p className="text-[11px] text-faint mt-1">Wins</p>
          </div>
          <div className="h-9 w-px bg-border" />
          <div>
            <p className="text-2xl font-extrabold leading-none tabular">{winRate(stats)}</p>
            <p className="text-[11px] text-faint mt-1">Win rate</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="size-8 grid place-items-center rounded-xl bg-accent-soft text-accent">
          <Icon name="star" size={16} />
        </span>
        <div>
          <h2 className="text-sm font-bold tracking-tight">Career</h2>
          <p className="text-[11px] text-faint">Stored on this device</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <Item label="Matches" value={String(stats.matchesPlayed)} />
        <Item label="Wins" value={String(stats.wins)} />
        <Item label="Losses" value={String(stats.losses)} />
        <Item label="Win rate" value={winRate(stats)} />
        <Item label="Highest score" value={String(stats.highestScore)} />
        <Item label="Best in a win" value={String(stats.bestScore)} />
        <Item label="Total runs" value={String(stats.totalRuns)} />
        <Item label="Sixes" value={String(stats.sixes)} />
        <Item label="Fours" value={String(stats.fours)} />
        <Item label="Wickets" value={String(stats.wickets)} />
        <Item label="Ties" value={String(stats.ties)} />
        <Item
          label="Avg / match"
          value={
            stats.matchesPlayed ? (stats.totalRuns / stats.matchesPlayed).toFixed(1) : '0.0'
          }
        />
      </div>
    </div>
  )
}
