import type { Localized } from '../i18n/locale'

export interface HowItWorksStep {
  icon: string
  title: string
  description: string
  titleI18n?: Localized
  descriptionI18n?: Localized
}

/**
 * I passaggi mostrati in home per spiegare il processo, dalla
 * personalizzazione alla consegna. Se il processo reale cambia (tempi,
 * canali di contatto, step aggiuntivi), aggiorna solo questo array.
 */
export const howItWorksSteps: HowItWorksStep[] = [
  {
    icon: '🎨',
    title: 'Personalizza',
    description:
      'Scegli il tuo prodotto, carica una tua immagine nel configuratore e posizionala, ruotala e scalala finché non è come la vuoi.',
    titleI18n: { en: 'Customize', es: 'Personaliza', fr: 'Personnalisez' },
    descriptionI18n: {
      en: 'Choose your product, upload your own image in the configurator, and position, rotate and scale it until it looks just right.',
      es: 'Elige tu producto, sube tu propia imagen en el configurador y colócala, gírala y ajústala hasta que quede como quieres.',
      fr: 'Choisissez votre produit, importez votre image dans le configurateur, puis positionnez-la, tournez-la et ajustez-la à votre goût.',
    },
  },
  {
    icon: '🖼️',
    title: 'Genera il render',
    description: 'Scarica l’anteprima in alta risoluzione: è l’immagine che useremo per realizzare il tuo pezzo.',
    titleI18n: { en: 'Generate the render', es: 'Genera el render', fr: 'Générez le rendu' },
    descriptionI18n: {
      en: 'Download the high-resolution preview: it’s the image we’ll use to craft your piece.',
      es: 'Descarga la vista previa en alta resolución: es la imagen que usaremos para fabricar tu pieza.',
      fr: 'Téléchargez l’aperçu en haute résolution : c’est l’image que nous utiliserons pour fabriquer votre pièce.',
    },
  },
  {
    icon: '📩',
    title: 'Invia e conferma',
    description:
      'Mandacelo su Instagram o via email insieme al riepilogo del prezzo: confermiamo insieme i dettagli prima di iniziare la lavorazione.',
    titleI18n: { en: 'Send it and confirm', es: 'Envíalo y confirma', fr: 'Envoyez et confirmez' },
    descriptionI18n: {
      en: 'Send it to us on Instagram or by email, along with the price summary: we’ll confirm the details together before starting the work.',
      es: 'Envíanoslo por Instagram o email junto con el resumen del precio: confirmamos juntos los detalles antes de empezar el trabajo.',
      fr: 'Envoyez-le-nous sur Instagram ou par email avec le récapitulatif du prix : nous confirmons ensemble les détails avant de commencer la fabrication.',
    },
  },
  {
    icon: '📦',
    title: 'Ricevilo a casa',
    description:
      'Realizziamo il tuo pezzo su misura e te lo spediamo: circa 1 settimana per gli orologi, 4-5 settimane per i Game Boy.',
    titleI18n: { en: 'Receive it at home', es: 'Recíbelo en casa', fr: 'Recevez-le chez vous' },
    descriptionI18n: {
      en: 'We craft your custom piece and ship it to you: about 1 week for watches, 4-5 weeks for Game Boys.',
      es: 'Fabricamos tu pieza a medida y te la enviamos: alrededor de 1 semana para los relojes, 4-5 semanas para las Game Boy.',
      fr: 'Nous fabriquons votre pièce sur mesure et vous l’expédions : environ 1 semaine pour les montres, 4 à 5 semaines pour les Game Boy.',
    },
  },
]
