import { useCallback, useEffect, useRef, useState } from 'react'

export type ToastVariant = 'error' | 'success'

export interface ToastItem {
  id: number
  message: string
  variant: ToastVariant
}

const AUTO_DISMISS_MS = 6000

/**
 * Coda di notifiche flottanti (toast): usata al posto di un singolo
 * messaggio di errore scritto in un angolo della pagina, per rendere
 * visibili anche errori che accadono quando l'area di caricamento
 * dell'immagine non è più a schermo (es. "hai raggiunto il massimo di
 * immagini", fallimento nella generazione del render). Ogni toast si
 * chiude da solo dopo qualche secondo, oppure subito se l'utente lo chiude
 * a mano.
 */
export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)
  // I timer di chiusura automatica vanno annullati allo smontaggio: un toast
  // mostrato appena prima di cambiare pagina lascerebbe altrimenti in coda un
  // aggiornamento di stato su un componente che non esiste più.
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback(
    (message: string, variant: ToastVariant = 'error') => {
      idRef.current += 1
      const id = idRef.current
      setToasts((current) => [...current, { id, message, variant }])
      timersRef.current.push(setTimeout(() => dismissToast(id), AUTO_DISMISS_MS))
    },
    [dismissToast],
  )

  useEffect(() => {
    const timers = timersRef
    return () => {
      timers.current.forEach(clearTimeout)
      timers.current = []
    }
  }, [])

  return { toasts, pushToast, dismissToast }
}
