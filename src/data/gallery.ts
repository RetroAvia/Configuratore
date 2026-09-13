import type { Localized } from '../i18n/locale'

export interface GalleryItem {
  image: string
  alt: string
  caption: string
  captionI18n?: Localized
}

/**
 * Foto reali di lavori consegnati ai clienti, mostrate in home come prova
 * sociale. Per aggiungere un nuovo lavoro basta aggiungere un oggetto a
 * questo array (immagine in `public/gallery/`, formato consigliato: JPEG,
 * lato lungo ~1400px).
 */
export const galleryItems: GalleryItem[] = [
  {
    image: '/gallery/casio-f91w-spiderman-watch.jpg',
    alt: 'Casio F-91W personalizzato con quadrante Spider-Man',
    caption: 'Casio F-91W — tema Spider-Man',
  },
  {
    image: '/gallery/box-3d-spiderman.jpg',
    alt: 'Box 3D personalizzato Casio x Spider-Man',
    caption: 'Box 3D su misura, abbinato all’orologio',
    captionI18n: {
      en: 'Custom 3D box, matched to the watch',
      es: 'Caja 3D a medida, a juego con el reloj',
      fr: 'Boîte 3D sur mesure, assortie à la montre',
    },
  },
  {
    image: '/gallery/gba-sp-gameboy-boot.jpg',
    alt: 'Game Boy Advance SP con scocca viola trasparente',
    caption: 'Game Boy Advance SP — scocca trasparente',
    captionI18n: {
      en: 'Game Boy Advance SP — clear shell',
      es: 'Game Boy Advance SP — carcasa transparente',
      fr: 'Game Boy Advance SP — coque transparente',
    },
  },
  {
    image: '/gallery/gba-advance-dragonite.jpg',
    alt: 'Game Boy personalizzato con grafica Dragonite Pokémon',
    caption: 'Game Boy — tema Pokémon Dragonite',
    captionI18n: {
      en: 'Game Boy — Pokémon Dragonite theme',
      es: 'Game Boy — tema Pokémon Dragonite',
      fr: 'Game Boy — thème Pokémon Dracolosse',
    },
  },
  {
    image: '/gallery/pokemon-3d-cases-trio.jpg',
    alt: 'Tre custodie stampate in 3D con incisioni Pokémon',
    caption: 'Custodie 3D su misura',
    captionI18n: {
      en: 'Custom 3D-printed cases',
      es: 'Fundas impresas en 3D a medida',
      fr: 'Étuis imprimés en 3D sur mesure',
    },
  },
]
