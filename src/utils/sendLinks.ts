const RETROAVIA_EMAIL = 'retroaviaofficial@gmail.com'
const RETROAVIA_INSTAGRAM_DM = 'https://ig.me/m/retroavia_'
const RETROAVIA_INSTAGRAM_PROFILE = 'https://www.instagram.com/retroavia_/'

export { RETROAVIA_EMAIL, RETROAVIA_INSTAGRAM_DM, RETROAVIA_INSTAGRAM_PROFILE }

/**
 * Costruisce il link "mailto:" pre-compilato per inviare l'idea di
 * personalizzazione a RetroAvia. Un sito statico non può allegare file in
 * automatico a un'email: il link prepara solo oggetto e testo, ricordando
 * all'utente di allegare a mano il render appena scaricato. Il render
 * contiene già l'intero collage (tutte le immagini caricate, composte
 * insieme), quindi basta un solo file da allegare.
 */
export function buildMailtoHref(productName: string): string {
  const subject = `Idea di personalizzazione – ${productName}`

  const body = [
    'Ciao RetroAvia,',
    '',
    `vorrei informazioni per questa personalizzazione: ${productName}.`,
    'Ho scaricato il render finale: lo allego qui sotto.',
    '',
    '(Prima di inviare, ricordati di allegare manualmente il file appena scaricato dal browser.)',
  ].join('\n')

  return `mailto:${RETROAVIA_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

/** Link diretto per aprire una conversazione Instagram con RetroAvia. */
export function buildInstagramDmHref(): string {
  return RETROAVIA_INSTAGRAM_DM
}
