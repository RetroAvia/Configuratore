import type { OptionRequirement, PriceOptionGroup, PriceOptionValue } from '../../types/product'

/**
 * Gruppi di opzioni condivisi da tutte le console Game Boy modificabili
 * (Advance SP, Color, Advance): stesse modifiche disponibili, stessi
 * prezzi. Cambiano da modello a modello solo la batteria/porta di ricarica
 * (vedi `batteriaSpGroup` / `batteriaUsbCGroup` più sotto) e i colori di
 * scocca disponibili, definiti invece in `shellColors.ts` e composti nel
 * file del singolo prodotto tramite `buildColoreScoccaGroup`.
 *
 * Sono oggetti dati semplici e immutabili: possono essere tranquillamente
 * condivisi per riferimento tra i vari prodotti che li usano.
 */

/**
 * ─── REGOLE DI COMPATIBILITÀ ───────────────────────────────────────────────
 *
 * Alcune lavorazioni richiedono per forza di aprire la console e montarle
 * una scocca nuova: non hanno senso se il cliente ha scelto "Solo Game Boy
 * (senza modifiche)". Questa costante è l'unico punto in cui quel vincolo è
 * scritto: è riutilizzata da tutte le opzioni che lo condividono, così
 * cambiare idea (o aggiungere un livello di modifica) si fa in un posto solo.
 *
 * Senza queste regole il configuratore accettava combinazioni impossibili —
 * "nessuna modifica" insieme a display IPS, kit LED e colore scocca — che
 * arrivavano a RetroAvia come preventivi da rinegoziare a mano.
 *
 * PER AGGIUNGERE UNA REGOLA: metti `requires: [RICHIEDE_SCOCCA_NUOVA]` sulla
 * singola opzione (se è solo quella a dipenderne) oppure sul gruppo intero
 * (se non ha senso nemmeno mostrarlo). Il resto — disattivazione visiva,
 * spiegazione all'utente, correzione automatica della selezione e del
 * totale — è già gestito dal motore prezzi (`utils/pricing.ts`).
 */
export const RICHIEDE_SCOCCA_NUOVA: OptionRequirement = {
  groupId: 'livello-modifica',
  optionIds: ['scocca-semplice', 'scocca-personalizzata'],
}

export const livelloDiModificaGroup: PriceOptionGroup = {
  id: 'livello-modifica',
  title: 'Livello di Modifica',
  icon: '🛠️',
  titleI18n: { en: 'Modification Level', es: 'Nivel de Modificación', fr: 'Niveau de Modification' },
  options: [
    {
      id: 'solo-gameboy',
      label: 'Solo Game Boy (senza modifiche)',
      icon: '🕹️',
      priceDelta: 80,
      labelI18n: {
        en: 'Game Boy only (no modifications)',
        es: 'Solo Game Boy (sin modificaciones)',
        fr: 'Game Boy seule (sans modification)',
      },
    },
    {
      id: 'scocca-semplice',
      label: 'Con scocca semplice',
      icon: '🛡️',
      priceDelta: 100,
      labelI18n: { en: 'With simple shell', es: 'Con carcasa simple', fr: 'Avec coque simple' },
    },
    {
      id: 'scocca-personalizzata',
      label: 'Con scocca personalizzata',
      icon: '🎨',
      priceDelta: 120,
      labelI18n: { en: 'With custom shell', es: 'Con carcasa personalizada', fr: 'Avec coque personnalisée' },
    },
  ],
}

export const etichettaGroup: PriceOptionGroup = {
  id: 'etichetta',
  title: 'Etichetta',
  icon: '🏷️',
  titleI18n: { en: 'Label', es: 'Etiqueta', fr: 'Étiquette' },
  options: [
    {
      id: 'nintendo-originale',
      label: 'Nintendo (originale)',
      icon: '🎯',
      priceDelta: 0,
      labelI18n: { en: 'Nintendo (original)', es: 'Nintendo (original)', fr: 'Nintendo (originale)' },
    },
    {
      id: 'personalizzata-normale',
      label: 'Personalizzata normale',
      icon: '🎨',
      priceDelta: 5,
      labelI18n: { en: 'Custom, standard', es: 'Personalizada normal', fr: 'Personnalisée standard' },
    },
    {
      id: 'personalizzata-olografica',
      label: 'Personalizzata olografica',
      icon: '✨',
      priceDelta: 5,
      labelI18n: { en: 'Custom, holographic', es: 'Personalizada holográfica', fr: 'Personnalisée holographique' },
    },
  ],
}

export const audioGroup: PriceOptionGroup = {
  id: 'audio',
  title: 'Audio',
  icon: '🔊',
  titleI18n: { en: 'Audio', es: 'Audio', fr: 'Audio' },
  options: [
    {
      id: 'originale',
      label: 'Originale',
      icon: '🔊',
      priceDelta: 0,
      labelI18n: { en: 'Original', es: 'Original', fr: 'Original' },
    },
    {
      id: 'nuovo',
      label: 'Nuovo',
      icon: '🎵',
      priceDelta: 10,
      labelI18n: { en: 'New', es: 'Nuevo', fr: 'Neuf' },
      // Sostituire l'altoparlante richiede di aprire la console.
      requires: [RICHIEDE_SCOCCA_NUOVA],
    },
  ],
}

export const displayGroup: PriceOptionGroup = {
  id: 'display',
  title: 'Display',
  icon: '📺',
  titleI18n: { en: 'Display', es: 'Pantalla', fr: 'Écran' },
  info: 'Il pannello IPS V3 è uno schermo LCD sostitutivo: colori più vivi e un angolo di visione molto più ampio rispetto al display originale, che resta invece leggibile solo guardandolo quasi frontalmente.',
  infoI18n: {
    en: 'The IPS V3 panel is a replacement LCD screen: brighter colors and a much wider viewing angle than the original display, which is only readable when viewed almost head-on.',
    es: 'El panel IPS V3 es una pantalla LCD de repuesto: colores más vivos y un ángulo de visión mucho más amplio que la pantalla original, que solo se lee bien mirándola casi de frente.',
    fr: 'Le panneau IPS V3 est un écran LCD de remplacement : des couleurs plus vives et un angle de vision bien plus large que l’écran d’origine, lisible uniquement de face.',
  },
  options: [
    {
      id: 'originale',
      label: 'Originale',
      icon: '📺',
      priceDelta: 0,
      labelI18n: { en: 'Original', es: 'Original', fr: 'Original' },
    },
    {
      id: 'ips-v3',
      label: 'IPS V3',
      icon: '✨',
      priceDelta: 60,
      labelI18n: { en: 'IPS V3', es: 'IPS V3', fr: 'IPS V3' },
      // Il pannello va sostituito all'interno della console.
      requires: [RICHIEDE_SCOCCA_NUOVA],
    },
  ],
}

export const kitLedGroup: PriceOptionGroup = {
  id: 'kit-led',
  title: 'Kit LED',
  icon: '💡',
  titleI18n: { en: 'LED Kit', es: 'Kit LED', fr: 'Kit LED' },
  info: 'Illuminazione a LED aggiuntiva integrata nella scocca/nei tasti, per un effetto retroilluminato più vistoso rispetto al modello originale.',
  infoI18n: {
    en: 'Extra LED lighting built into the shell/buttons, for a more eye-catching backlit effect than the original model.',
    es: 'Iluminación LED adicional integrada en la carcasa/botones, para un efecto retroiluminado más llamativo que el modelo original.',
    fr: 'Éclairage LED supplémentaire intégré à la coque/aux boutons, pour un effet rétroéclairé plus marqué que sur le modèle d’origine.',
  },
  options: [
    { id: 'no', label: 'No', icon: '🌙', priceDelta: 0, labelI18n: { en: 'No', es: 'No', fr: 'Non' } },
    {
      id: 'si',
      label: 'Sì',
      icon: '✨',
      priceDelta: 35,
      labelI18n: { en: 'Yes', es: 'Sí', fr: 'Oui' },
      // I LED vanno integrati dentro la scocca.
      requires: [RICHIEDE_SCOCCA_NUOVA],
    },
  ],
}

export const boxPersonalizzatoGroup: PriceOptionGroup = {
  id: 'box-3d',
  title: 'Box 3D Personalizzato',
  icon: '📦',
  titleI18n: { en: 'Custom 3D Box', es: 'Caja 3D Personalizada', fr: 'Boîte 3D Personnalisée' },
  info: 'Scatola stampata in 3D e personalizzata con la tua grafica: pensata per la spedizione o come confezione regalo.',
  infoI18n: {
    en: 'A 3D-printed box customized with your artwork: ideal for shipping or as a gift package.',
    es: 'Caja impresa en 3D y personalizada con tu diseño: pensada para el envío o como caja de regalo.',
    fr: 'Boîte imprimée en 3D et personnalisée avec votre visuel : idéale pour l’expédition ou comme coffret cadeau.',
  },
  options: [
    { id: 'no', label: 'No', icon: '📦', priceDelta: 0, labelI18n: { en: 'No', es: 'No', fr: 'Non' } },
    { id: 'si', label: 'Sì', icon: '🎁', priceDelta: 12, labelI18n: { en: 'Yes', es: 'Sí', fr: 'Oui' } },
  ],
}

export const coverTrasparenteGroup: PriceOptionGroup = {
  id: 'cover-trasparente',
  title: 'Cover Trasparente',
  icon: '🔍',
  titleI18n: { en: 'Clear Cover', es: 'Funda Transparente', fr: 'Coque Transparente' },
  info: 'Guscio protettivo trasparente da applicare sopra la scocca, per proteggerla dai graffi mantenendo la grafica ben visibile.',
  infoI18n: {
    en: 'A clear protective shell to fit over the case, guarding it against scratches while keeping the artwork fully visible.',
    es: 'Carcasa protectora transparente para colocar sobre la funda, que la protege de arañazos manteniendo el diseño bien visible.',
    fr: 'Coque de protection transparente à poser par-dessus, qui protège des rayures tout en laissant le visuel bien visible.',
  },
  options: [
    { id: 'no', label: 'No', icon: '🚫', priceDelta: 0, labelI18n: { en: 'No', es: 'No', fr: 'Non' } },
    { id: 'si', label: 'Sì', icon: '🔷', priceDelta: 5, labelI18n: { en: 'Yes', es: 'Sí', fr: 'Oui' } },
  ],
}

export const gameBoyFornitoGroup: PriceOptionGroup = {
  id: 'gameboy-fornito',
  title: 'Game Boy fornito dal cliente',
  icon: '✅',
  titleI18n: {
    en: 'Game Boy supplied by you',
    es: 'Game Boy proporcionada por el cliente',
    fr: 'Game Boy fournie par le client',
  },
  highlighted: true,
  helperText: 'Se ci invii tu il tuo Game Boy da modificare non dovremo procurartene uno: applichiamo uno sconto.',
  helperTextI18n: {
    en: 'If you send us your own Game Boy to modify, we won’t need to source one for you: a discount applies.',
    es: 'Si nos envías tu propia Game Boy para modificar, no tendremos que conseguirte una: aplicamos un descuento.',
    fr: 'Si vous nous envoyez votre propre Game Boy à modifier, nous n’avons pas besoin de vous en fournir une : une réduction s’applique.',
  },
  options: [
    { id: 'no', label: 'No', icon: '🚫', priceDelta: 0, labelI18n: { en: 'No', es: 'No', fr: 'Non' } },
    { id: 'si', label: 'Sì', icon: '✅', priceDelta: -50, labelI18n: { en: 'Yes', es: 'Sí', fr: 'Oui' } },
  ],
}

export const buttonColorGroup: PriceOptionGroup = {
  id: 'colore-pulsanti',
  title: 'Colore Pulsanti',
  icon: '🎮',
  titleI18n: { en: 'Button Color', es: 'Color de Botones', fr: 'Couleur des Boutons' },
  helperText: "Di serie i pulsanti sono dello stesso colore della scocca scelta qui sopra.",
  helperTextI18n: {
    en: 'By default the buttons match the shell color chosen above.',
    es: 'De serie, los botones son del mismo color que la carcasa elegida arriba.',
    fr: 'Par défaut, les boutons sont de la même couleur que la coque choisie ci-dessus.',
  },
  // Senza una scocca nuova non ci sono pulsanti nuovi da colorare.
  requires: [RICHIEDE_SCOCCA_NUOVA],
  options: [
    {
      id: 'uguale-scocca',
      label: 'Uguale alla scocca',
      icon: '🎮',
      priceDelta: 0,
      labelI18n: { en: 'Same as shell', es: 'Igual que la carcasa', fr: 'Identique à la coque' },
    },
    {
      id: 'diverso',
      label: 'Colore diverso (specificalo nelle note)',
      icon: '🖌️',
      priceDelta: 5,
      labelI18n: {
        en: 'Different color (specify in notes)',
        es: 'Color diferente (especifícalo en las notas)',
        fr: 'Couleur différente (précisez-la dans les notes)',
      },
    },
  ],
}

/** Batteria del Game Boy Advance SP: originale oppure upgrade a 950 mAh. */
export const batteriaSpGroup: PriceOptionGroup = {
  id: 'batteria',
  title: 'Batteria',
  icon: '🔋',
  titleI18n: { en: 'Battery', es: 'Batería', fr: 'Batterie' },
  info: 'La 950 mAh è una batteria maggiorata rispetto a quella originale della SP: più autonomia prima di dover ricaricare.',
  infoI18n: {
    en: 'The 950 mAh is a bigger battery than the SP’s original: more time between charges.',
    es: 'La de 950 mAh es una batería de mayor capacidad que la original de la SP: más autonomía antes de recargar.',
    fr: 'La batterie 950 mAh est plus grande que celle d’origine de la SP : plus d’autonomie avant de recharger.',
  },
  options: [
    {
      id: 'originale',
      label: 'Originale',
      icon: '🔋',
      priceDelta: 0,
      labelI18n: { en: 'Original', es: 'Original', fr: 'Original' },
    },
    {
      id: '950mah',
      label: '950 mAh',
      icon: '⚡',
      priceDelta: 15,
      labelI18n: { en: '950 mAh', es: '950 mAh', fr: '950 mAh' },
      // La batteria va sostituita all'interno della console.
      requires: [RICHIEDE_SCOCCA_NUOVA],
    },
  ],
}

/** Batteria di Game Boy Color e Game Boy Advance: a pile originali, oppure conversione a batteria ricaricabile con porta USB-C. */
export const batteriaUsbCGroup: PriceOptionGroup = {
  id: 'batteria',
  title: 'Batteria',
  icon: '🔋',
  titleI18n: { en: 'Battery', es: 'Batería', fr: 'Batterie' },
  info: "La conversione USB-C sostituisce il vano pile originale con una batteria ricaricabile interna e una porta USB-C, come una console moderna.",
  infoI18n: {
    en: 'The USB-C conversion replaces the original battery compartment with an internal rechargeable battery and a USB-C port, just like a modern console.',
    es: 'La conversión USB-C sustituye el compartimento de pilas original por una batería recargable interna y un puerto USB-C, como una consola moderna.',
    fr: 'La conversion USB-C remplace le compartiment à piles d’origine par une batterie rechargeable interne et un port USB-C, comme une console moderne.',
  },
  options: [
    {
      id: 'originale',
      label: 'Originale (a pile)',
      icon: '🔋',
      priceDelta: 0,
      labelI18n: { en: 'Original (battery-powered)', es: 'Original (a pilas)', fr: 'Original (à piles)' },
    },
    {
      id: 'usb-c',
      label: 'USB-C (ricaricabile)',
      icon: '⚡',
      priceDelta: 39.9,
      labelI18n: { en: 'USB-C (rechargeable)', es: 'USB-C (recargable)', fr: 'USB-C (rechargeable)' },
      // La conversione richiede di aprire la console e modificarne il vano pile.
      requires: [RICHIEDE_SCOCCA_NUOVA],
    },
  ],
}

/** Costruisce il gruppo "Colore Scocca" a partire dalla lista di colori disponibili per un modello specifico. */
export function buildColoreScoccaGroup(colors: PriceOptionValue[]): PriceOptionGroup {
  return {
    id: 'colore-scocca',
    title: 'Colore Scocca',
    icon: '🎨',
    titleI18n: { en: 'Shell Color', es: 'Color de Carcasa', fr: 'Couleur de la Coque' },
    // Il colore si sceglie solo se una scocca nuova viene effettivamente montata.
    requires: [RICHIEDE_SCOCCA_NUOVA],
    options: colors,
  }
}
