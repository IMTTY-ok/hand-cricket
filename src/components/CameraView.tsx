import type { ReactNode, RefObject } from 'react'
import type { CameraError, CameraStatus, DetectStatus } from '../vision/cameraTypes'
import type { StabilityState } from '../vision/gestureStability'
import { Icon } from './ui/Icon'

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement | null> | ((el: HTMLVideoElement | null) => void)
  canvasRef: RefObject<HTMLCanvasElement | null>
  cameraStatus: CameraStatus
  cameraError: CameraError | null
  detectStatus: DetectStatus
  modelError: string | null
  stability: StabilityState
  handCount: number
  onRetry: () => void
  children?: ReactNode
  /** Show the dashed "put your hand here" framing guide. */
  guide?: boolean
  /** Extra label shown top-right (e.g. "PLAYER · BATTING"). */
  badge?: ReactNode
  compact?: boolean
}

function statusPill(cameraStatus: CameraStatus, detectStatus: DetectStatus) {
  if (cameraStatus === 'starting') return { tone: 'bg-warn-soft text-warn', text: 'Starting camera…' }
  if (cameraStatus === 'error') return { tone: 'bg-danger-soft text-danger', text: 'Camera offline' }
  if (detectStatus === 'loading') return { tone: 'bg-warn-soft text-warn', text: 'Loading tracker…' }
  if (detectStatus === 'error') return { tone: 'bg-danger-soft text-danger', text: 'Tracker error' }
  return { tone: 'bg-success-soft text-success', text: 'Camera live'}
}

export function CameraView({
  videoRef,
  canvasRef,
  cameraStatus,
  cameraError,
  detectStatus,
  modelError,
  stability,
  handCount,
  onRetry,
  children,
  guide = true,
  badge,
  compact = false,
}: CameraViewProps) {
  const pill = statusPill(cameraStatus, detectStatus)
  const ready = cameraStatus === 'ready'
  const handPresent = handCount > 0
  const showGuide = guide && ready && handCount === 0

  return (
    <div
      className={[
        'relative w-full overflow-hidden rounded-3xl bg-black border border-border grain',
        compact ? 'aspect-[4/3] sm:aspect-video' : 'aspect-[4/5] sm:aspect-[4/3] lg:aspect-video',
      ].join(' ')}
    >
      <video
        className="absolute inset-0 size-full object-cover mirror"
        playsInline
        muted
        autoPlay
        ref={videoRef}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 size-full object-cover mirror pointer-events-none"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/70 pointer-events-none" />

      {/* Live landmark skeleton is mounted by the screen that owns the refs. */}
      {children}

      {ready && (
        <>
          <div className="absolute left-3 top-3 flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur ${pill.tone}`}
            >
              <span className="size-1.5 rounded-full bg-current animate-pulse" />
              {pill.text}
            </span>
            {badge && (
              <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur bg-black/45 text-white/90 border border-white/10">
                {badge}
              </span>
            )}
          </div>

          {showGuide && (
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <div className="relative w-[58%] max-w-[260px] aspect-[3/4] rounded-[28px] border-2 border-dashed border-accent/45 animate-sweep">
                <span className="absolute inset-x-0 -top-9 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-accent/85">
                  Place hand here
                </span>
              </div>
            </div>
          )}

          {handPresent && (
            <div className="absolute left-3 bottom-3 flex items-center gap-1.5 rounded-full bg-success/90 text-black px-3 py-1.5 text-[11px] font-bold backdrop-blur animate-scale-in">
              <Icon name="check" size={13} strokeWidth={3} /> Hand detected
            </div>
          )}
        </>
      )}

      {/* Status / error layer */}
      {cameraStatus === 'starting' && (
        <div className="absolute inset-0 grid place-items-center bg-black/70">
          <div className="flex flex-col items-center gap-3 text-white/80">
            <span className="size-8 rounded-full border-2 border-white/25 border-t-accent animate-spin" />
            <p className="text-sm">Starting camera…</p>
          </div>
        </div>
      )}

      {cameraStatus === 'idle' && !cameraError && (
        <div className="absolute inset-0 grid place-items-center">
          <div className="flex flex-col items-center gap-2 text-white/70">
            <Icon name="camera-off" size={26} />
            <p className="text-sm">Camera is off</p>
          </div>
        </div>
      )}

      {cameraStatus === 'error' && cameraError && (
        <div className="absolute inset-0 grid place-items-center bg-black/85 p-6 text-center">
          <div className="max-w-sm animate-fade-in">
            <div className="mx-auto mb-3 size-11 grid place-items-center rounded-2xl bg-danger-soft text-danger">
              <Icon name="camera-off" size={22} />
            </div>
            <h3 className="text-white font-bold text-lg">{cameraError.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-white/70">{cameraError.message}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-5 inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-accent text-on-accent font-semibold text-sm hover:brightness-105 transition"
            >
              <Icon name="refresh" size={16} /> Try again
            </button>
          </div>
        </div>
      )}

      {cameraStatus === 'ready' && detectStatus === 'error' && (
        <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-black/80 border border-white/10 p-3 text-center">
          <p className="text-xs text-white/80">{modelError}</p>
        </div>
      )}

      {cameraStatus === 'ready' && detectStatus !== 'error' && (
        <div
          className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-8 pointer-events-none"
          aria-live="polite"
        >
          <p
            className={[
              'text-center text-[13px] font-semibold transition-all duration-200',
              stability.status === 'locked'
                ? 'text-accent'
                : stability.status === 'seeking'
                  ? 'text-white/85'
                  : 'text-white/60',
            ].join(' ')}
          >
            {stability.message}
          </p>
        </div>
      )}
    </div>
  )
}
