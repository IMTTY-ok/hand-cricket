import { PageHeader } from '../components/PageHeader'
import { PlayerStats } from '../components/PlayerStats'
import { resetStats, useStats } from '../app/stats'
import { resetSettings, updateSettings, useSettings, type Theme } from '../app/settings'
import { DIFFICULTY_OPTIONS, OVER_OPTIONS } from '../app/screens'
import { Segmented } from '../components/ui/Segmented'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { useState } from 'react'

interface StatisticsProps {
  onBack: () => void
  onChangeName: () => void
}

export function Statistics({ onBack, onChangeName }: StatisticsProps) {
  const stats = useStats()
  const settings = useSettings()
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="relative z-10 mx-auto w-full max-w-2xl px-4 sm:px-6 pb-12">
      <PageHeader title="Statistics" subtitle="Your career on this device" onBack={onBack} />

      <div className="mt-5 space-y-4">
        <PlayerStats stats={stats} />

        <div className="card p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-faint font-bold mb-4">
            Preferences
          </p>

          <div className="space-y-5">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 border border-border px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">Player name</p>
                <p className="text-[11px] text-faint truncate">
                  {settings.playerName || 'Not set'}
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={onChangeName}>
                Change
              </Button>
            </div>

            <Segmented
              legend="Default difficulty"
              options={DIFFICULTY_OPTIONS}
              value={settings.difficulty}
              onChange={(difficulty) => updateSettings({ difficulty })}
              compact
            />
            <Segmented
              legend="Default match length"
              options={OVER_OPTIONS}
              value={settings.totalOvers}
              onChange={(totalOvers) => updateSettings({ totalOvers })}
              compact
            />
            <Segmented
              legend="Theme"
              options={[
                { value: 'dark' as Theme, label: 'Dark' },
                { value: 'light' as Theme, label: 'Light' },
              ]}
              value={settings.theme}
              onChange={(theme) => {
                updateSettings({ theme })
                document.documentElement.dataset.theme = theme
              }}
              compact
            />

            <div className="grid grid-cols-2 gap-2.5">
              <Button
                variant={settings.sound ? 'quiet' : 'secondary'}
                size="md"
                block
                aria-pressed={settings.sound}
                onClick={() => updateSettings({ sound: !settings.sound })}
              >
                {settings.sound ? 'Sound on' : 'Sound off'}
              </Button>
              <Button
                variant={settings.haptics ? 'quiet' : 'secondary'}
                size="md"
                block
                aria-pressed={settings.haptics}
                onClick={() => updateSettings({ haptics: !settings.haptics })}
              >
                {settings.haptics ? 'Haptics on' : 'Haptics off'}
              </Button>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <p className="text-sm font-bold">Danger zone</p>
          <p className="mt-1 text-xs text-faint leading-relaxed">
            Clearing removes every match, statistic and leaderboard entry stored in this browser.
          </p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            <Button variant="secondary" size="sm" onClick={() => setConfirming(true)}>
              Reset all data
            </Button>
          </div>
        </div>

        <p className="text-[11px] text-faint leading-relaxed px-1">
          Statistics are stored with localStorage on this device. Camera footage is never recorded
          or stored.
        </p>
      </div>

      <Modal open={confirming} onClose={() => setConfirming(false)} title="Reset all data?">
        <p className="text-sm text-dim leading-relaxed">
          This permanently deletes your career statistics, settings and local leaderboard. It
          cannot be undone.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-2.5">
          <Button variant="secondary" block onClick={() => setConfirming(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            block
            onClick={() => {
              resetStats()
              resetSettings()
              setConfirming(false)
            }}
          >
            Reset everything
          </Button>
        </div>
      </Modal>
    </div>
  )
}
