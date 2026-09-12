import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import InstagramIcon from '../icons/InstagramIcon'
import { isSoundMuted, onSoundMutedChange, playClick, toggleSoundMuted } from '../../utils/sound'

const INSTAGRAM_URL = 'https://www.instagram.com/retroavia_/'

export default function Header() {
  const [muted, setMuted] = useState(false)

  // Legge lo stato reale (persistito) solo dopo il mount, per evitare un
  // mismatch fra rendering server/iniziale e localStorage del browser.
  useEffect(() => {
    setMuted(isSoundMuted())
    return onSoundMutedChange(setMuted)
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-page/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          onClick={() => playClick()}
          className="flex items-center gap-2.5 rounded-lg text-lg font-extrabold tracking-tight text-ink transition-opacity hover:opacity-80"
        >
          <img
            src="/logo.png"
            alt="RetroAvia"
            className="h-9 w-9 rounded-xl object-cover shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
          />
          <span>
            RetroAvia <span className="text-accent">Lab</span>
          </span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="RetroAvia su Instagram"
            title="Seguici su Instagram"
            className="grid h-10 w-10 place-items-center rounded-full border border-border text-ink-muted transition-colors hover:border-primary/60 hover:text-primary"
          >
            <InstagramIcon className="h-5 w-5" />
          </a>
          <button
            type="button"
            onClick={() => setMuted(toggleSoundMuted())}
            aria-label={muted ? 'Attiva i suoni' : 'Disattiva i suoni'}
            title={muted ? 'Attiva i suoni' : 'Disattiva i suoni'}
            className="grid h-10 w-10 place-items-center rounded-full border border-border text-ink-muted transition-colors hover:border-primary/60 hover:text-primary"
          >
            <span aria-hidden="true">{muted ? '🔇' : '🔊'}</span>
          </button>
        </div>
      </div>
    </header>
  )
}
