import { useEffect, useRef, useState } from 'react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Icon } from './ui/Icon'

interface NamePromptProps {
  open: boolean
  initial?: string
  /** When true the dialog cannot be dismissed — used for the first run. */
  required?: boolean
  onSave: (name: string) => void
  onClose?: () => void
}

export function NamePrompt({ open, initial = '', required = false, onSave, onClose }: NamePromptProps) {
  const [value, setValue] = useState(initial)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (open) setValue(initial)
  }, [open, initial])

  const submit = () => {
    const name = value.trim().slice(0, 20)
    if (!name) {
      inputRef.current?.focus()
      return
    }
    onSave(name)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissable={!required}
      title={initial ? 'Change your name' : "What's your name?"}
    >
      <p className="text-sm text-dim leading-relaxed">
        {initial
          ? 'Your name appears on the scoreboard and leaderboard.'
          : 'We use this on the scoreboard and the leaderboard. You can change it any time.'}
      </p>

      <label htmlFor="player-name" className="sr-only">
        Enter your name
      </label>
      <input
        id="player-name"
        ref={inputRef}
        type="text"
        value={value}
        maxLength={20}
        autoComplete="nickname"
        placeholder="Enter your name"
        autoFocus
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
        }}
        className="mt-4 w-full h-12 px-4 rounded-xl bg-surface-2 border border-border text-base text-text placeholder:text-faint focus:border-accent/60 focus:outline-none transition-colors"
      />

      <div className="mt-5 grid gap-2.5">
        <Button variant="primary" size="lg" block onClick={submit} disabled={!value.trim()}>
          <Icon name="check" size={17} /> Continue
        </Button>
        {!required && (
          <Button variant="ghost" size="md" block onClick={onClose}>
            Cancel
          </Button>
        )}
      </div>
    </Modal>
  )
}
