import { useCallback, useEffect, useState } from 'react'
import { PageHeader } from '../components/PageHeader'
import { Leaderboard } from '../components/Leaderboard'
import { fetchLeaderboard, type LeaderboardEntry } from '../firebase/leaderboard'
import { leaderboardPoints, useStats } from '../app/stats'
import { useSettings } from '../app/settings'
import { isCloudEnabled } from '../firebase/config'
import { Button } from '../components/ui/Button'
import { submitScore } from '../firebase/leaderboard'

interface LeaderboardPageProps {
  onBack: () => void
}

export function LeaderboardPage({ onBack }: LeaderboardPageProps) {
  const settings = useSettings()
  const stats = useStats()
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [source, setSource] = useState<'cloud' | 'local'>('local')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchLeaderboard()
      setEntries(res.entries)
      setSource(res.source)
    } catch {
      setError('Could not load the leaderboard right now.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const shareMyScore = async () => {
    await submitScore(settings.playerName || 'Player', leaderboardPoints(stats))
    await load()
  }

  return (
    <div className="relative z-10 mx-auto w-full max-w-2xl px-4 sm:px-6 pb-12">
      <PageHeader title="Leaderboard" subtitle="Top 10 all-time scores" onBack={onBack} />

      <div className="mt-5 space-y-4">
        <div className="card p-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-faint font-bold">
              Your points
            </p>
            <p className="text-2xl font-extrabold tabular leading-tight">
              {leaderboardPoints(stats)}
            </p>
            <p className="text-[11px] text-faint mt-0.5">
              runs + 50 per win + 20 per wicket
            </p>
          </div>
          <Button variant="quiet" size="sm" onClick={() => void shareMyScore()}>
            Submit score
          </Button>
        </div>

        <Leaderboard
          entries={entries}
          source={source}
          loading={loading}
          error={error}
          currentName={settings.playerName}
          onRefresh={() => void load()}
        />

        <p className="text-[11px] text-faint leading-relaxed px-1">
          {isCloudEnabled
            ? 'Scores are synced to a shared leaderboard. Only your name and score are sent — never camera data.'
            : 'Cloud sync is off, so this leaderboard is stored in your browser. Add Firebase environment variables to share it globally.'}
        </p>
      </div>
    </div>
  )
}
