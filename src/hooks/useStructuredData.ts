import { useEffect } from 'react'

/**
 * Inserisce nel `<head>` un tag `<script type="application/ld+json">` con
 * dati strutturati Schema.org per la pagina corrente (rimosso quando la
 * pagina cambia). A differenza dei bot di anteprima di WhatsApp/Instagram
 * (che leggono solo l'HTML statico), Google esegue JavaScript e può quindi
 * leggere questi dati — utile per un'eventuale comparsa nei risultati di
 * ricerca con prezzo/disponibilità del prodotto.
 */
export function useStructuredData(data: Record<string, unknown> | null): void {
  useEffect(() => {
    if (!data) return

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(data)
    document.head.appendChild(script)

    return () => {
      // `remove()` invece di `head.removeChild(script)`: se per qualunque
      // motivo il tag fosse già stato tolto dal documento, `removeChild`
      // lancerebbe un'eccezione durante la pulizia, facendo cadere l'intero
      // albero React in un punto in cui non c'è modo di recuperare.
      script.remove()
    }
  }, [data])
}
