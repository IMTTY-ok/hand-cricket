import { PageHeader } from '../components/PageHeader'
import { GESTURE_GUIDE } from '../vision/gestureRecognition'
import { Icon, type IconName } from '../components/ui/Icon'

interface HowToPlayProps {
  onBack: () => void
}

const STEPS: { icon: IconName; title: string; body: string }[] = [
  { icon: 'camera', title: 'Show your hand', body: 'Allow the camera and hold your hand inside the frame.' },
  { icon: 'hand', title: 'Pick a number', body: 'Fingers 1–5 map to runs, a closed fist is your 6.' },
  { icon: 'lock', title: 'Hold it steady', body: 'The gesture locks after a few consistent frames.' },
  { icon: 'bolt', title: 'Computer answers', body: 'The opponent reveals its own number from 1–6.' },
  { icon: 'target', title: 'Score or get out', body: 'Different numbers score runs. The same number is out.' },
]

export function HowToPlay({ onBack }: HowToPlayProps) {
  return (
    <div className="relative z-10 mx-auto w-full max-w-3xl px-4 sm:px-6 pb-12">
      <PageHeader title="How to play" subtitle="The whole game in five steps" onBack={onBack} />

      <ol className="mt-6 space-y-3">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            className="card p-4 flex gap-4 animate-fade-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span className="shrink-0 size-10 grid place-items-center rounded-xl bg-accent-soft text-accent">
              <Icon name={step.icon} size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-faint">
                Step {i + 1}
              </p>
              <p className="text-[15px] font-bold mt-0.5">{step.title}</p>
              <p className="text-sm text-dim mt-1 leading-relaxed">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <div className="card p-5 text-center animate-fade-up">
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-faint">
            Different numbers
          </p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <div>
              <p className="text-[11px] text-faint uppercase tracking-wider">You</p>
              <p className="text-5xl font-extrabold text-accent leading-none">4</p>
            </div>
            <span className="text-sm font-bold text-faint">VS</span>
            <div>
              <p className="text-[11px] text-faint uppercase tracking-wider">Computer</p>
              <p className="text-5xl font-extrabold leading-none">2</p>
            </div>
          </div>
          <p className="mt-4 text-lg font-extrabold text-accent">+4 RUNS</p>
        </div>

        <div className="card p-5 text-center animate-fade-up" style={{ animationDelay: '80ms' }}>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-faint">
            Same numbers
          </p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <div>
              <p className="text-[11px] text-faint uppercase tracking-wider">You</p>
              <p className="text-5xl font-extrabold text-danger leading-none">5</p>
            </div>
            <span className="text-sm font-bold text-faint">VS</span>
            <div>
              <p className="text-[11px] text-faint uppercase tracking-wider">Computer</p>
              <p className="text-5xl font-extrabold text-danger leading-none">5</p>
            </div>
          </div>
          <p className="mt-4 text-lg font-extrabold text-danger">OUT!</p>
        </div>
      </div>

      <div className="mt-7 card p-5 animate-fade-up">
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-faint mb-3">
          Gesture reference
        </p>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {GESTURE_GUIDE.map((g) => (
            <li key={g.number} className="rounded-xl bg-surface-2 border border-border p-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-accent leading-none">{g.number}</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-text">
                  {g.label}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-faint">{g.hint}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 card p-5 text-sm text-dim leading-relaxed animate-fade-up">
        <p className="font-bold text-text mb-1.5">Match rules</p>
        <ul className="space-y-1.5 list-disc pl-4 marker:text-accent">
          <li>Each innings lasts your chosen number of overs (1, 3, 5 or 10) or 3 wickets.</li>
          <li>The second team chases a target and wins the moment it reaches it.</li>
          <li>Same score at the end means the match is tied.</li>
        </ul>
      </div>
    </div>
  )
}
