/**
 * Piccolo motore di effetti sonori dell'interfaccia, basato sulla Web Audio
 * API: nessun file audio da scaricare, nessuna dipendenza esterna. Ogni
 * suono è un breve tono sintetizzato (oscillatore + inviluppo di volume),
 * pensato per essere gradevole e discreto — un feedback, non un jingle.
 *
 * L'AudioContext viene creato SOLO al primo utilizzo (mai al caricamento
 * della pagina): i browser bloccano l'audio finché non c'è stata
 * un'interazione dell'utente, quindi crearlo prima darebbe solo un warning
 * in console senza alcun beneficio.
 *
 * Tutte le funzioni sono "safe by design": se l'audio non è disponibile per
 * qualunque motivo (browser non supportato, contesto sospeso, ecc.) falliscono
 * in silenzio, perché il suono è un arricchimento dell'esperienza, mai un
 * requisito funzionale — non deve mai interrompere o rompere l'interazione.
 */

const MUTE_STORAGE_KEY = 'retroavia-lab:sound-muted'

let audioCtx: AudioContext | null = null
let muted = readMutedFromStorage()
const listeners = new Set<(muted: boolean) => void>()

/**
 * Stato iniziale dei suoni: SPENTI finché l'utente non li accende.
 *
 * È una scelta deliberata e non un dettaglio: un sito che inizia a emettere
 * suoni al primo tocco è il genere di cosa che fa chiudere la scheda, in
 * particolare da telefono e in pubblico — cioè esattamente la situazione in
 * cui la maggior parte dei clienti apre un link arrivato su Instagram. Chi li
 * vuole li accende dal pulsante 🔊 nell'intestazione, e la scelta viene
 * ricordata.
 */
function readMutedFromStorage(): boolean {
  try {
    const stored = localStorage.getItem(MUTE_STORAGE_KEY)
    // Solo un "0" esplicito (cioè una scelta consapevole di attivarli)
    // accende i suoni: se non c'è nulla salvato, restano spenti.
    return stored !== '0'
  } catch {
    return true
  }
}

function getContext(): AudioContext | null {
  if (muted) return null
  try {
    if (!audioCtx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      audioCtx = new Ctor()
    }
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume()
    }
    return audioCtx
  } catch {
    return null
  }
}

export function isSoundMuted(): boolean {
  return muted
}

export function setSoundMuted(value: boolean): void {
  muted = value
  try {
    localStorage.setItem(MUTE_STORAGE_KEY, value ? '1' : '0')
  } catch {
    // Se localStorage non è disponibile (modalità privata, ecc.) va bene lo stesso:
    // la preferenza semplicemente non sopravvive a un refresh.
  }
  listeners.forEach((listener) => listener(muted))
}

export function toggleSoundMuted(): boolean {
  setSoundMuted(!muted)
  return muted
}

/** Si iscrive ai cambi di stato mute/unmute (usato dal pulsante in Header). Restituisce la funzione di disiscrizione. */
export function onSoundMutedChange(listener: (muted: boolean) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

interface ToneStep {
  /** Frequenza in Hz. */
  freq: number
  /** Istante di inizio, in secondi relativi all'avvio del suono. */
  at: number
  /** Durata della nota, in secondi. */
  duration: number
  /** Volume di picco (0..1). */
  gain?: number
  type?: OscillatorType
}

/** Riproduce una sequenza di toni con un inviluppo morbido (attack/release), per evitare click sgradevoli. */
function playTones(steps: ToneStep[]) {
  const ctx = getContext()
  if (!ctx) return
  try {
    const now = ctx.currentTime
    const master = ctx.createGain()
    master.gain.value = 0.22
    master.connect(ctx.destination)

    steps.forEach(({ freq, at, duration, gain = 1, type = 'sine' }) => {
      const osc = ctx.createOscillator()
      const env = ctx.createGain()
      osc.type = type
      osc.frequency.value = freq
      const start = now + at
      const attack = Math.min(0.012, duration * 0.3)
      const release = Math.min(0.08, duration * 0.6)
      env.gain.setValueAtTime(0, start)
      env.gain.linearRampToValueAtTime(gain, start + attack)
      env.gain.linearRampToValueAtTime(0, start + duration + release)
      osc.connect(env)
      env.connect(master)
      osc.start(start)
      osc.stop(start + duration + release + 0.02)
    })
  } catch {
    // Riproduzione audio non riuscita: nessun effetto collaterale, l'interazione prosegue normalmente.
  }
}

/** Click leggero per pulsanti e controlli generici della toolbar. */
export function playClick(): void {
  playTones([{ freq: 720, at: 0, duration: 0.045, gain: 0.6, type: 'triangle' }])
}

/** Suono più "morbido" per la navigazione all'indietro. */
export function playBack(): void {
  playTones([
    { freq: 520, at: 0, duration: 0.05, gain: 0.5, type: 'sine' },
    { freq: 360, at: 0.045, duration: 0.07, gain: 0.45, type: 'sine' },
  ])
}

/** Doppio tono ascendente quando l'immagine scatta magneticamente al centro. */
export function playSnap(): void {
  playTones([{ freq: 1040, at: 0, duration: 0.035, gain: 0.5, type: 'sine' }])
}

/** Piccolo arpeggio ascendente quando un'immagine viene caricata con successo. */
export function playUpload(): void {
  playTones([
    { freq: 523.25, at: 0, duration: 0.09, gain: 0.55, type: 'triangle' },
    { freq: 659.25, at: 0.07, duration: 0.09, gain: 0.55, type: 'triangle' },
    { freq: 783.99, at: 0.14, duration: 0.14, gain: 0.6, type: 'triangle' },
  ])
}

/** Arpeggio "di successo" quando l'esportazione del PNG finale è completata. */
export function playExportSuccess(): void {
  playTones([
    { freq: 587.33, at: 0, duration: 0.09, gain: 0.5, type: 'sine' },
    { freq: 739.99, at: 0.08, duration: 0.09, gain: 0.5, type: 'sine' },
    { freq: 987.77, at: 0.16, duration: 0.2, gain: 0.6, type: 'sine' },
  ])
}

/** Tono breve e discreto per un'azione negativa/di errore. */
export function playError(): void {
  playTones([{ freq: 220, at: 0, duration: 0.12, gain: 0.5, type: 'sawtooth' }])
}
