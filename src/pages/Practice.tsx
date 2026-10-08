import { PageHeader } from '../components/PageHeader'
import { CameraView } from '../components/CameraView'
import { useHandTrackerContext } from '../vision/handTrackerCore'
import { GESTURE_GUIDE } from '../vision/gestureRecognition'
import { Icon } from '../components/ui/Icon'

interface PracticeProps {
  onBack: () => void
}

const FINGERS = [
  ['thumb', 'Thumb'],
  ['index', 'Index'],
  ['middle', 'Middle'],
  ['ring', 'Ring'],
  ['pinky', 'Pinky'],
] as const

export function Practice({ onBack }: PracticeProps) {
  const tracker = useHandTrackerContext()
  const { camera, detectStatus, modelError, handCount, gesture, stability, videoRef, canvasRef, startCamera, resetLock } =
    tracker

  // Practice never locks — keep reading so the player can cycle through 1..6.
  const shown = gesture?.number ?? null
  const ready = gesture !== null && gesture.confidence >= 0.6

  return (
    <div className="relative z-10 mx-auto w-full max-w-3xl px-4 sm:px-6 pb-12">
      <PageHeader
        title="Practice mode"
        subtitle="Test every gesture without playing a match"
        onBack={onBack}
      />

      <div className="mt-5 grid gap-4">
        <CameraView
          videoRef={videoRef}
          canvasRef={canvasRef}
          cameraStatus={camera.status}
          cameraError={camera.error}
          detectStatus={detectStatus}
          modelError={modelError}
          stability={stability}
          handCount={handCount}
          onRetry={() => void startCamera()}
          badge="PRACTICE"
          guide
        />

        <div className="card p-5 text-center animate-fade-up">
          <p className="text-[10px] uppercase tracking-[0.24em] text-faint font-bold">
            Detected number
          </p>

          <div className="mt-3 h-[110px] grid place-items-center">
            {shown === null ? (
              <span className="text-5xl font-extrabold text-faint">—</span>
            ) : (
              <span key={shown} className="text-[86px] leading-none font-extrabold animate-pop text-accent tabular">
                {shown}
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center justify-center gap-3 text-xs text-dim">
            <span className="tabular">
              Confidence{' '}
              <strong className={ready ? 'text-success' : 'text-warn'}>
                {gesture ? `${Math.round(gesture.confidence * 100)}%` : '—'}
              </strong>
            </span>
            <span className="h-3 w-px bg-border" />
            <span
              className={`inline-flex items-center gap-1 font-bold ${
                ready ? 'text-success' : 'text-warn'
              }`}
            >
              {ready ? (
                <>
                  <Icon name="check" size={13} strokeWidth={3} /> READY
                </>
              ) : (
                'HOLD STEADY'
              )}
            </span>
          </div>

          <div className="mt-4 flex justify-center gap-1.5 flex-wrap">
            {FINGERS.map(([key, label]) => {
              const active = gesture?.fingers[key] ?? false
              return (
                <span
                  key={key}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                    active
                      ? 'bg-accent-soft border-accent/50 text-accent'
                      : 'bg-surface-2 border-border text-faint'
                  }`}
                  aria-pressed={active}
                >
                  {label}
                </span>
              )
            })}
          </div>

          <button
            type="button"
            onClick={resetLock}
            className="mt-4 text-[11px] font-semibold text-faint hover:text-text transition-colors"
          >
            Reset reading
          </button>
        </div>

        <div className="card p-5 animate-fade-up">
          <p className="text-[10px] uppercase tracking-[0.2em] text-faint font-bold mb-3">
            Try every gesture
          </p>
          <ol className="flex items-center justify-between gap-1">
            {GESTURE_GUIDE.map((g, i) => (
              <li key={g.number} className="flex items-center gap-1 min-w-0">
                <span
                  className={`grid place-items-center size-11 rounded-xl border text-lg font-extrabold shrink-0 transition-all ${
                    shown === g.number
                      ? 'bg-accent text-on-accent border-accent scale-110'
                      : 'bg-surface-2 border-border text-dim'
                  }`}
                  title={g.label}
                >
                  {g.number}
                </span>
                {i < GESTURE_GUIDE.length - 1 && (
                  <span className="text-faint text-xs shrink-0" aria-hidden>
                    ›
                  </span>
                )}
              </li>
            ))}
          </ol>
          <ul className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1">
            {GESTURE_GUIDE.map((g) => (
              <li key={g.number} className="text-[11px] text-faint">
                <strong className="text-dim">{g.number}</strong> · {g.hint}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
