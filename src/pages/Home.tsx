import { useStats, winRate } from '../app/stats'
import type { Screen } from '../app/screens'
import type { Settings } from '../app/settings'
import { updateSettings } from '../app/settings'
import { Button } from '../components/ui/Button'
import { Icon, type IconName } from '../components/ui/Icon'
import { PlayerStats } from '../components/PlayerStats'

interface HomeProps {
  settings: Settings
  onPlay: () => void
  onNavigate: (screen: Screen) => void
  onChangeName: () => void
}

const MENU: { screen: Screen; label: string; icon: IconName }[] = [
  { screen: 'practice', label: 'Practice', icon: 'hand' },
  { screen: 'leaderboard', label: 'Leaderboard', icon: 'trophy' },
  { screen: 'stats', label: 'Statistics', icon: 'chart' },
  { screen: 'howto', label: 'How to play', icon: 'book' },
]

export function Home({ settings, onPlay, onNavigate, onChangeName }: HomeProps) {
  const stats = useStats()

  return (
    <div className="relative z-10 mx-auto w-full max-w-5xl px-4 sm:px-6 pb-10">
      <header className="flex items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-2.5">
          <span className="size-9 grid place-items-center rounded-xl bg-accent text-on-accent shadow-[0_8px_24px_-10px_rgba(212,244,60,0.8)]">
            <Icon name="hand" size={19} />
          </span>
          <span className="text-[13px] font-extrabold tracking-[0.14em] uppercase">
            Hand Cricket
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => updateSettings({ sound: !settings.sound })}
            aria-pressed={settings.sound}
            aria-label={settings.sound ? 'Mute sound' : 'Unmute sound'}
            title={settings.sound ? 'Sound on' : 'Sound off'}
            className="size-9 grid place-items-center rounded-xl border border-border bg-surface-2 text-dim hover:text-text transition-colors"
          >
            <Icon name={settings.sound ? 'volume' : 'volume-off'} size={17} />
          </button>
          <button
            type="button"
            onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
            aria-label={`Switch to ${settings.theme === 'dark' ? 'light' : 'dark'} theme`}
            className="size-9 grid place-items-center rounded-xl border border-border bg-surface-2 text-dim hover:text-text transition-colors"
          >
            <Icon name={settings.theme === 'dark' ? 'sun' : 'moon'} size={17} />
          </button>
          <button
            type="button"
            onClick={onChangeName}
            className="hidden sm:inline-flex items-center gap-2 h-9 pl-2 pr-3 rounded-xl border border-border bg-surface-2 text-xs font-semibold text-dim hover:text-text transition-colors"
          >
            <span className="size-6 grid place-items-center rounded-lg bg-accent-soft text-accent text-[11px] font-black">
              {(settings.playerName || 'P').slice(0, 1).toUpperCase()}
            </span>
            {settings.playerName || 'Set name'}
          </button>
        </div>
      </header>

      <main className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-10 lg:min-h-[62vh]">
        <section className="text-center lg:text-left animate-fade-up">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-dim">
            <span className="size-1.5 rounded-full bg-success animate-pulse" />
            Camera-powered cricket
          </p>

          <h1 className="mt-5 text-[clamp(2.6rem,11vw,5rem)] font-extrabold tracking-[-0.04em] leading-[0.92]">
            HAND
            <br />
            <span className="text-accent">CRICKET</span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-dim text-balance">
            Your hand. Your game. Your cricket.
          </p>

          <p className="mt-2 max-w-md mx-auto lg:mx-0 text-sm text-faint leading-relaxed">
            Show 1–6 with your fingers. The camera reads your gesture, the computer picks its
            number — match and you&apos;re out, differ and you score.
          </p>

          <div className="mt-7 flex flex-col sm:flex-row gap-2.5 justify-center lg:justify-start">
            <Button variant="primary" size="lg" onClick={onPlay} className="sm:min-w-[200px]">
              <Icon name="play" size={18} /> Play now
            </Button>
            <Button variant="secondary" size="lg" onClick={() => onNavigate('practice')}>
              <Icon name="hand" size={18} /> Practice
            </Button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {MENU.slice(1).map((item) => (
              <Button
                key={item.screen}
                variant="ghost"
                size="md"
                block
                onClick={() => onNavigate(item.screen)}
              >
                <Icon name={item.icon} size={16} /> {item.label}
              </Button>
            ))}
          </div>
        </section>

        <section className="space-y-3 animate-fade-up" style={{ animationDelay: '90ms' }}>
          <PlayerStats stats={stats} compact />

          <div className="card p-4 sm:p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-faint font-bold mb-3">
              Gesture reference
            </p>
            <ul className="grid grid-cols-3 gap-2">
              {[
                ['1', 'Index'],
                ['2', 'Two'],
                ['3', 'Three'],
                ['4', 'Four'],
                ['5', 'Palm'],
                ['6', 'Fist'],
              ].map(([n, label]) => (
                <li
                  key={n}
                  className="rounded-xl bg-surface-2 border border-border px-2 py-2.5 text-center"
                >
                  <span className="block text-xl font-extrabold leading-none text-accent">{n}</span>
                  <span className="mt-1 block text-[10px] uppercase tracking-wider text-faint">
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={onChangeName}
            className="w-full card px-4 py-3 flex items-center justify-between text-left hover:border-border-strong transition-colors"
          >
            <span className="text-xs text-dim">
              Playing as{' '}
              <strong className="text-text">{settings.playerName || 'not set'}</strong>
            </span>
            <span className="text-[11px] font-semibold text-accent">Change</span>
          </button>

          <p className="text-[11px] leading-relaxed text-faint px-1">
            Your camera is used only to detect your hand gesture. Video is processed locally and
            is not uploaded.
          </p>

          <p className="text-[11px] text-faint px-1">
            {stats.matchesPlayed > 0
              ? `${stats.wins} wins from ${stats.matchesPlayed} matches · ${winRate(stats)} win rate`
              : 'No matches yet — your record starts with the first game.'}
          </p>
        </section>
      </main>
    </div>
  )
}
