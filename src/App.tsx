import { useCallback, useEffect, useMemo, useState } from 'react'
import { applyTheme, updateSettings, useSettings } from './app/settings'
import type { Screen } from './app/screens'
import { NamePrompt } from './components/NamePrompt'
import { Game } from './pages/Game'
import { Home } from './pages/Home'
import { HowToPlay } from './pages/HowToPlay'
import { LeaderboardPage } from './pages/LeaderboardPage'
import { Practice } from './pages/Practice'
import { Statistics } from './pages/Statistics'
import { loadHandLandmarker } from './vision/handDetection'
import { HandTrackerProvider } from './vision/handTrackerCore'
import { sound } from './utils/sound'

const IDLE_ACTIVITY = { camera: false, detect: false }

export default function App() {
  const settings = useSettings()
  const [screen, setScreen] = useState<Screen>('home')
  const [activity, setActivity] = useState(IDLE_ACTIVITY)
  const [nameOpen, setNameOpen] = useState(false)

  /* Theme + audio follow the persisted settings. */
  useEffect(() => {
    applyTheme(settings.theme)
  }, [settings.theme])

  useEffect(() => {
    sound.setEnabled(settings.sound)
  }, [settings.sound])

  /* First run: ask for a name (and unlock the AudioContext on the same gesture). */
  useEffect(() => {
    if (!settings.nameSet) setNameOpen(true)
  }, [settings.nameSet])

  useEffect(() => {
    const unlock = () => sound.unlock()
    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('keydown', unlock, { once: true })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  /* Start downloading the hand model while the user reads the home screen. */
  useEffect(() => {
    const idle = (window as unknown as { requestIdleCallback?: (cb: () => void) => number })
      .requestIdleCallback
    const cancel = (id: number) =>
      (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id)
    let id = 0
    const warm = () => void loadHandLandmarker().catch(() => undefined)
    if (idle) id = idle(warm)
    else {
      const t = window.setTimeout(warm, 1500)
      return () => window.clearTimeout(t)
    }
    return () => cancel?.(id)
  }, [])

  const onActivity = useCallback((next: { camera: boolean; detect: boolean }) => {
    setActivity((prev) =>
      prev.camera === next.camera && prev.detect === next.detect ? prev : next
    )
  }, [])

  const navigate = useCallback((next: Screen) => {
    if (next !== 'game') setActivity(IDLE_ACTIVITY)
    setScreen(next)
  }, [])

  const cameraActive = useMemo(
    () => (screen === 'game' && activity.camera) || screen === 'practice',
    [screen, activity.camera],
  )
  const detectActive = useMemo(
    () => (screen === 'game' && activity.detect) || screen === 'practice',
    [screen, activity.detect],
  )

  return (
    <HandTrackerProvider cameraActive={cameraActive} detectActive={detectActive}>
      <div className="min-h-full">
        {screen === 'home' && (
          <Home
            settings={settings}
            onPlay={() => navigate('game')}
            onNavigate={navigate}
            onChangeName={() => setNameOpen(true)}
          />
        )}
        {screen === 'howto' && <HowToPlay onBack={() => navigate('home')} />}
        {screen === 'practice' && <Practice onBack={() => navigate('home')} />}
        {screen === 'leaderboard' && <LeaderboardPage onBack={() => navigate('home')} />}
        {screen === 'stats' && (
          <Statistics onBack={() => navigate('home')} onChangeName={() => setNameOpen(true)} />
        )}
        {screen === 'game' && <Game onExit={navigate} onActivity={onActivity} />}
      </div>

      <NamePrompt
        open={nameOpen}
        required={!settings.nameSet}
        initial={settings.playerName}
        onSave={(name) => {
          updateSettings({ playerName: name, nameSet: true })
          setNameOpen(false)
        }}
        onClose={() => setNameOpen(false)}
      />
    </HandTrackerProvider>
  )
}
