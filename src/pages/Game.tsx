import { useCallback, useEffect, useRef, useState } from 'react'
import { DIFFICULTY_OPTIONS, OVER_OPTIONS, type Screen } from '../app/screens'
import { updateSettings, useSettings } from '../app/settings'
import { applyMatchSummary, getStats, leaderboardPoints } from '../app/stats'
import { Button } from '../components/ui/Button'
import { Icon } from '../components/ui/Icon'
import { Segmented } from '../components/ui/Segmented'
import { CameraView } from '../components/CameraView'
import { Countdown } from '../components/Countdown'
import { GestureDisplay } from '../components/GestureDisplay'
import { MatchResult } from '../components/MatchResult'
import { OutcomeFlash } from '../components/OutcomeFlash'
import { ScoreBoard } from '../components/ScoreBoard'
import { Toss, type TossOutcome } from '../components/Toss'
import { oversLabel } from '../game/cricketRules'
import { chooseComputerNumber } from '../game/computerAI'
import {
  bowlingSide,
  createMatch,
  processBall,
  sideName,
  startSecondInnings,
} from '../game/gameEngine'
import { summarizeMatch } from '../game/summary'
import type { BallEvent, MatchConfig, MatchState, Side } from '../game/types'
import { submitScore } from '../firebase/leaderboard'
import { useHandTrackerContext } from '../vision/handTrackerCore'
import { buzz, type Pattern } from '../utils/haptics'
import { sound } from '../utils/sound'

type Stage = 'setup' | 'camera' | 'toss' | 'countdown' | 'play' | 'break' | 'result'
type BallPhase = 'awaiting' | 'handover' | 'locked' | 'revealed'

interface GameProps {
  onExit: (screen: Screen) => void
  onActivity: (activity: { camera: boolean; detect: boolean }) => void
}

const DEFAULT_OPPONENT = 'Computer'
const MAX_WICKETS = 3

export function Game({ onExit, onActivity }: GameProps) {
  const settings = useSettings()
  const tracker = useHandTrackerContext()

  const [stage, setStage] = useState<Stage>('setup')
  const [config, setConfig] = useState<MatchConfig>({
    mode: 'pvc',
    playerName: settings.playerName || 'You',
    opponentName: DEFAULT_OPPONENT,
    totalOvers: settings.totalOvers,
    maxWickets: MAX_WICKETS,
    difficulty: settings.difficulty,
  })
  const [p2Name, setP2Name] = useState('')
  const [match, setMatch] = useState<MatchState | null>(null)
  const [ballPhase, setBallPhase] = useState<BallPhase>('awaiting')
  const [turnSide, setTurnSide] = useState<Side>('A')
  const [picks, setPicks] = useState<{ A: number | null; B: number | null }>({ A: null, B: null })
  const [flash, setFlash] = useState<BallEvent | null>(null)
  const [handSeen, setHandSeen] = useState(false)

  const matchRef = useRef<MatchState | null>(null)
  const timers = useRef<number[]>([])
  const recordedRef = useRef(false)
  const handledLockRef = useRef(false)

  matchRef.current = match

  const isPvp = config.mode === 'pvp'
  const haptic = useCallback(
    (p: Pattern) => {
      if (settings.haptics) buzz(p)
    },
    [settings.haptics],
  )

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }, [])

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), [])

  /* --------------------------------------------------------------- *
   * Camera / detection lifecycle
   * --------------------------------------------------------------- */
  useEffect(() => {
    const camera = stage !== 'setup'
    const detect = stage === 'camera' || (stage === 'play' && ballPhase === 'awaiting')
    onActivity({ camera, detect })
  }, [stage, ballPhase, onActivity])

  useEffect(() => {
    if (tracker.handCount > 0) setHandSeen(true)
  }, [tracker.handCount])

  /* --------------------------------------------------------------- *
   * A gesture locked → drive the ball forward
   * --------------------------------------------------------------- */
  const settleBall = useCallback(
    (finalPicks: { A: number | null; B: number | null }) => {
      const m = matchRef.current
      if (!m) return
      const batter = finalPicks[m.battingSide]
      const bowler = finalPicks[bowlingSide(m.battingSide)]
      if (batter === null || bowler === null) return

      const next = processBall(m, batter, bowler)
      matchRef.current = next
      setMatch(next)

      const ev = next.lastEvent
      if (!ev) return
      setFlash(ev)

      if (ev.out) {
        sound.play('wicket')
        haptic('wicket')
      } else if (ev.outcome === 'six') {
        sound.play('six')
        haptic('victory')
      } else if (ev.outcome === 'four') {
        sound.play('four')
        haptic('tap')
      } else if (ev.runs > 0) {
        sound.play('run')
        haptic('tap')
      } else {
        sound.play('tap')
      }
    },
    [haptic],
  )

  const revealOpponent = useCallback(
    (current: { A: number | null; B: number | null }) => {
      const m = matchRef.current
      if (!m) return

      let final = current
      if (m.config.mode !== 'pvp') {
        const humanBatting = m.battingSide === 'A'
        const aiNumber = chooseComputerNumber({
          history: humanBatting ? m.human.batting : m.human.bowling,
          difficulty: m.config.difficulty,
          role: humanBatting ? 'bowling' : 'batting',
        })
        final = { ...current, B: aiNumber }
        setPicks(final)
      }

      setBallPhase('revealed')
      later(() => settleBall(final), 950)
    },
    [later, settleBall],
  )

  const handleLocked = useCallback(
    (number: number) => {
      const m = matchRef.current
      if (!m) return

      sound.play('lock')
      haptic('tap')

      const next = { ...picks, [turnSide]: number } as { A: number | null; B: number | null }
      setPicks(next)

      if (m.config.mode === 'pvp' && turnSide === m.battingSide) {
        later(() => setBallPhase('handover'), 450)
        return
      }

      setBallPhase('locked')
      later(() => revealOpponent(next), 600)
    },
    [picks, turnSide, later, revealOpponent, haptic],
  )

  const stability = tracker.stability
  const resetLock = tracker.resetLock
  useEffect(() => {
    if (stage !== 'play' || ballPhase !== 'awaiting') return
    if (stability.status !== 'locked' || stability.number === null) return
    if (handledLockRef.current) return
    handledLockRef.current = true
    handleLocked(stability.number)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stability.status, stability.number, stage, ballPhase])

  const resetForNextBall = useCallback(() => {
    handledLockRef.current = false
    resetLock()
  }, [resetLock])

  const onFlashDone = useCallback(() => {
    setFlash(null)
    const m = matchRef.current
    if (!m) return

    if (m.phase === 'inningsBreak') {
      setStage('break')
      return
    }
    if (m.phase === 'result') {
      setStage('result')
      return
    }

    setPicks({ A: null, B: null })
    setTurnSide(m.config.mode === 'pvp' ? m.battingSide : 'A')
    resetForNextBall()
    setBallPhase('awaiting')
  }, [resetForNextBall])

  /* --------------------------------------------------------------- *
   * Stage transitions
   * --------------------------------------------------------------- */
  const beginSetup = () => {
    const next: MatchConfig = {
      ...config,
      playerName: settings.playerName || 'You',
      opponentName: config.mode === 'pvp' ? p2Name.trim() || 'Player 2' : DEFAULT_OPPONENT,
    }
    updateSettings({ difficulty: next.difficulty, totalOvers: next.totalOvers })
    setConfig(next)
    setHandSeen(false)
    setStage('camera')
  }

  const handleToss = ({ winnerSide, chose }: TossOutcome) => {
    const loser: Side = winnerSide === 'A' ? 'B' : 'A'
    const firstBatting = chose === 'bat' ? winnerSide : loser
    const m = createMatch(config, firstBatting)
    matchRef.current = m
    setMatch(m)
    setPicks({ A: null, B: null })
    setTurnSide(config.mode === 'pvp' ? firstBatting : 'A')
    recordedRef.current = false
    setStage('countdown')
  }

  const beginCountdown = () => {
    resetForNextBall()
    setBallPhase('awaiting')
    setStage('play')
  }

  const startChase = () => {
    const m = matchRef.current
    if (!m) return
    const next = startSecondInnings(m)
    matchRef.current = next
    setMatch(next)
    setPicks({ A: null, B: null })
    setTurnSide(next.config.mode === 'pvp' ? next.battingSide : 'A')
    resetForNextBall()
    setStage('countdown')
  }

  const readyForBowler = () => {
    const m = matchRef.current
    if (!m) return
    resetForNextBall()
    setTurnSide(bowlingSide(m.battingSide))
    setBallPhase('awaiting')
  }

  const playAgain = () => {
    recordedRef.current = false
    matchRef.current = null
    setMatch(null)
    setPicks({ A: null, B: null })
    setFlash(null)
    setHandSeen(false)
    resetForNextBall()
    setStage('toss')
  }

  /* Record stats + leaderboard exactly once per finished match. */
  useEffect(() => {
    if (stage !== 'result' || !match || recordedRef.current) return
    recordedRef.current = true

    const summary = summarizeMatch(match)
    applyMatchSummary(summary)

    if (match.config.mode !== 'pvp') {
      void submitScore(match.config.playerName || 'Player', leaderboardPoints(getStats()))
    }

    sound.play(summary.isWin ? 'victory' : summary.isTie ? 'defeat' : 'defeat')
    if (summary.isWin) haptic('victory')
    else if (summary.isLoss) haptic('defeat')
  }, [stage, match, haptic])

  /* --------------------------------------------------------------- *
   * Render helpers
   * --------------------------------------------------------------- */
  const canStartMatch = tracker.camera.status === 'ready' && (handSeen || tracker.detectStatus === 'error')

  const headerScore = match && stage !== 'setup' && stage !== 'camera' && stage !== 'toss'
  const leftNumber =
    ballPhase === 'handover' || !match ? null : isPvp ? picks[match.battingSide] : picks.A
  const rightNumber =
    !match ? null : isPvp ? picks[bowlingSide(match.battingSide)] : picks.B

  return (
    <div className="relative z-10 mx-auto w-full max-w-6xl px-4 sm:px-6 pb-10">
      <header className="flex items-center justify-between gap-3 py-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="size-9 shrink-0 grid place-items-center rounded-xl bg-accent text-on-accent">
            <Icon name="hand" size={19} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-extrabold tracking-[0.14em] uppercase leading-none">
              Hand Cricket
            </p>
            {stage !== 'setup' && (
              <p className="mt-1 text-[11px] text-faint truncate">
                {config.mode === 'pvp' ? 'Same device' : `${config.difficulty} · ${config.totalOvers} ov`}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {headerScore && match && (
            <div className="hidden sm:flex items-center gap-3 rounded-xl border border-border bg-surface-2 px-3.5 py-2">
              <span className="text-sm font-extrabold tabular">
                {match.scores[match.battingSide].runs} / {match.scores[match.battingSide].wickets}
              </span>
              <span className="h-4 w-px bg-border" />
              <span className="text-xs text-dim tabular">
                {oversLabel(match.scores[match.battingSide].balls)} ov
              </span>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => onExit('home')} aria-label="Leave match">
            <Icon name="close" size={16} /> Exit
          </Button>
        </div>
      </header>

      {/* ---------------- SETUP ---------------- */}
      {stage === 'setup' && (
        <section className="max-w-xl mx-auto card p-6 sm:p-7 animate-fade-up">
          <h1 className="text-2xl font-extrabold tracking-tight">Match setup</h1>
          <p className="mt-1.5 text-sm text-dim">Pick a mode, length and opponent.</p>

          <div className="mt-6 space-y-5">
            <Segmented
              legend="Game mode"
              options={[
                { value: 'pvc', label: 'Vs Computer', hint: 'Play the AI' },
                { value: 'pvp', label: 'Same device', hint: 'Two players, turns' },
              ]}
              value={config.mode}
              onChange={(mode) =>
                setConfig((c) => ({
                  ...c,
                  mode: mode as MatchConfig['mode'],
                  opponentName: mode === 'pvp' ? p2Name.trim() || 'Player 2' : DEFAULT_OPPONENT,
                }))
              }
            />

            {config.mode === 'pvp' && (
              <div>
                <label
                  htmlFor="p2name"
                  className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-faint mb-2.5"
                >
                  Player 2 name
                </label>
                <input
                  id="p2name"
                  type="text"
                  value={p2Name}
                  maxLength={20}
                  placeholder="Player 2"
                  onChange={(e) => {
                    setP2Name(e.target.value)
                    setConfig((c) => ({ ...c, opponentName: e.target.value.trim() || 'Player 2' }))
                  }}
                  className="w-full h-11 px-4 rounded-xl bg-surface-2 border border-border text-sm text-text placeholder:text-faint focus:border-accent/60 focus:outline-none transition-colors"
                />
              </div>
            )}

            <Segmented
              legend="Match length"
              options={OVER_OPTIONS}
              value={config.totalOvers}
              onChange={(totalOvers) => setConfig((c) => ({ ...c, totalOvers }))}
              columns={3}
              compact
            />

            <Segmented
              legend="Difficulty"
              options={DIFFICULTY_OPTIONS}
              value={config.difficulty}
              onChange={(difficulty) => setConfig((c) => ({ ...c, difficulty }))}
              columns={3}
              compact
            />

            <div className="rounded-xl bg-surface-2 border border-border px-4 py-3 text-xs text-faint leading-relaxed">
              Each side bats {config.totalOvers} over{config.totalOvers === 1 ? '' : 's'} or until{' '}
              {MAX_WICKETS} wickets fall. The chase ends the moment the target is reached.
            </div>

            <Button variant="primary" size="lg" block onClick={beginSetup}>
              Continue to camera check <Icon name="back" size={17} className="rotate-180" />
            </Button>
          </div>
        </section>
      )}

      {/* ---------------- CAMERA CHECK ---------------- */}
      {stage === 'camera' && (
        <section className="max-w-2xl mx-auto animate-fade-up">
          <div className="text-center mb-5">
            <p className="text-[11px] uppercase tracking-[0.3em] text-accent font-bold">
              Camera check
            </p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight">
              Place your hand inside the box
            </h1>
            <p className="mt-2 text-sm text-dim max-w-md mx-auto">
              Your camera is used only to detect your hand gesture. Video is processed locally and
              is not uploaded.
            </p>
          </div>

          <CameraView
            videoRef={tracker.videoRef}
            canvasRef={tracker.canvasRef}
            cameraStatus={tracker.camera.status}
            cameraError={tracker.camera.error}
            detectStatus={tracker.detectStatus}
            modelError={tracker.modelError}
            stability={stability}
            handCount={tracker.handCount}
            onRetry={() => void tracker.startCamera()}
            guide
          />

          <div className="mt-5 grid gap-2.5">
            <Button
              variant="primary"
              size="lg"
              block
              disabled={!canStartMatch}
              onClick={() => setStage('toss')}
            >
              {canStartMatch ? 'Start match' : 'Waiting for your hand…'}
            </Button>
            <Button variant="ghost" size="md" block onClick={() => setStage('setup')}>
              Back to setup
            </Button>
          </div>

          <ul className="mt-5 grid sm:grid-cols-3 gap-2 text-[11px] text-faint">
            <li className="rounded-xl bg-surface-2 border border-border px-3 py-2.5">
              <strong className="text-dim block mb-0.5">Good light</strong>
              Face a window or lamp — not a bright window behind you.
            </li>
            <li className="rounded-xl bg-surface-2 border border-border px-3 py-2.5">
              <strong className="text-dim block mb-0.5">One hand</strong>
              Keep a single hand in frame, roughly an arm&apos;s length away.
            </li>
            <li className="rounded-xl bg-surface-2 border border-border px-3 py-2.5">
              <strong className="text-dim block mb-0.5">Hold steady</strong>
              Pause for half a second so the number can lock.
            </li>
          </ul>
        </section>
      )}

      {/* ---------------- TOSS ---------------- */}
      {stage === 'toss' && (
        <section className="py-6">
          <Toss
            playerName={config.playerName}
            opponentName={config.opponentName}
            isComputer={config.mode === 'pvc'}
            onComplete={handleToss}
          />
          <div className="mt-8 text-center">
            <Button variant="ghost" size="sm" onClick={() => setStage('camera')}>
              <Icon name="back" size={15} /> Back to camera check
            </Button>
          </div>
        </section>
      )}

      {/* ---------------- COUNTDOWN ---------------- */}
      {stage === 'countdown' && <Countdown onDone={beginCountdown} />}

      {/* ---------------- LIVE PLAY ---------------- */}
      {stage === 'play' && match && (
        <section className="grid gap-4 lg:grid-cols-[1.45fr_1fr] lg:items-start">
          <div className="space-y-4 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.16em] font-bold text-dim">
                {sideName(match, match.battingSide)} batting
              </p>
              <p className="text-[11px] text-faint">
                Ball {match.scores[match.battingSide].balls + 1} of{' '}
                {config.totalOvers * 6}
              </p>
            </div>

            <div className="relative">
              <CameraView
                videoRef={tracker.videoRef}
                canvasRef={tracker.canvasRef}
                cameraStatus={tracker.camera.status}
                cameraError={tracker.camera.error}
                detectStatus={tracker.detectStatus}
                modelError={tracker.modelError}
                stability={stability}
                handCount={tracker.handCount}
                onRetry={() => void tracker.startCamera()}
                badge={`${sideName(match, match.battingSide)} · batting`}
                guide={ballPhase === 'awaiting'}
                compact
              />
              <OutcomeFlash event={flash} onDone={onFlashDone} />
            </div>

            {ballPhase === 'handover' ? (
              <div className="card p-5 text-center animate-fade-up">
                <div className="mx-auto mb-3 size-10 grid place-items-center rounded-xl bg-accent-soft text-accent">
                  <Icon name="lock" size={18} />
                </div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-faint font-bold">
                  Number locked
                </p>
                <p className="mt-2 text-lg font-extrabold">
                  {sideName(match, match.battingSide)} showed a number
                </p>
                <p className="mt-1 text-sm text-dim">
                  Hand the device to {sideName(match, bowlingSide(match.battingSide))}.
                </p>
                <Button variant="primary" size="lg" block className="mt-4" onClick={readyForBowler}>
                  I&apos;m ready — show my number
                </Button>
              </div>
            ) : (
              <GestureDisplay
                playerLabel={isPvp ? sideName(match, match.battingSide) : 'You'}
                computerLabel={
                  isPvp ? sideName(match, bowlingSide(match.battingSide)) : 'Computer'
                }
                playerNumber={leftNumber}
                computerNumber={rightNumber}
                phase={
                  ballPhase === 'awaiting'
                    ? 'waiting'
                    : ballPhase === 'revealed'
                      ? 'revealed'
                      : 'locked'
                }
                progress={ballPhase === 'awaiting' ? stability.progress : 1}
                confidence={stability.confidence}
                hint={
                  isPvp
                    ? `${sideName(match, turnSide)}, show your number`
                    : 'Show your number using your hand'
                }
              />
            )}
          </div>

          <aside className="space-y-4 min-w-0">
            <ScoreBoard state={match} />

            <div className="card p-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 size-7 shrink-0 grid place-items-center rounded-lg bg-accent-soft text-accent">
                  <Icon name="info" size={15} />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold">
                    {tracker.camera.status === 'error'
                      ? 'Camera connection lost'
                      : match.target !== null
                        ? `Target ${match.target} — need ${Math.max(
                            match.target - match.scores[match.battingSide].runs,
                            0,
                          )} more`
                        : 'Same number = out'}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-faint">
                    {tracker.camera.status === 'error'
                      ? 'Your match is paused. Reconnect the camera to keep playing.'
                      : 'Different numbers = runs for the batter. Hold your gesture steady to lock it in.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="hidden lg:block card p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-faint font-bold mb-3">
                Gesture guide
              </p>
              <ul className="grid grid-cols-6 gap-1.5 text-center">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <li
                    key={n}
                    className="rounded-lg bg-surface-2 border border-border py-2 text-sm font-extrabold text-dim"
                  >
                    {n}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-faint leading-relaxed">
                Fingers for 1–5, closed fist for 6.
              </p>
            </div>
          </aside>
        </section>
      )}

      {/* ---------------- INNINGS BREAK ---------------- */}
      {stage === 'break' && match && (
        <section className="max-w-md mx-auto text-center py-6 animate-fade-up">
          <p className="text-[11px] uppercase tracking-[0.3em] text-accent font-bold">
            Innings break
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
            {sideName(match, match.firstBattingSide)} {match.scores[match.firstBattingSide].runs}/
            {match.scores[match.firstBattingSide].wickets}
          </h1>
          <p className="mt-1.5 text-sm text-dim tabular">
            {oversLabel(match.scores[match.firstBattingSide].balls)} overs ·{' '}
            {match.config.totalOvers} over match
          </p>

          <div className="mt-6 card p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-faint font-bold">
              Target
            </p>
            <p className="mt-1 text-5xl font-extrabold text-accent tabular leading-none">
              {match.target}
            </p>
            <p className="mt-2 text-sm text-dim">
              {sideName(match, match.battingSide)} need {match.target} to win
            </p>
          </div>

          <Button variant="primary" size="lg" block className="mt-5" onClick={startChase}>
            Start the chase
          </Button>
        </section>
      )}

      {/* ---------------- RESULT ---------------- */}
      {stage === 'result' && match && (
        <section className="py-4">
          <MatchResult
            state={match}
            onPlayAgain={playAgain}
            onMenu={() => onExit('home')}
            onStats={() => onExit('stats')}
          />
        </section>
      )}
    </div>
  )
}
