import { memo, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import InstagramIcon from '../icons/InstagramIcon'
import { playClick } from '../../utils/sound'
import {
  buildInstagramDmHref,
  buildMailtoHref,
  buildWhatsAppHref,
  isMailtoRisky,
  RETROAVIA_INSTAGRAM_PROFILE,
} from '../../utils/sendLinks'
import type { OrderSummaryLine } from '../../utils/pricing'
import { formatPriceDelta, formatTotal } from '../../utils/pricing'
import { useAnimatedNumber } from '../../hooks/useAnimatedNumber'
import { useLanguage } from '../../i18n/LanguageContext'
import { trackEvent } from '../../utils/analytics'
import { copyToClipboard } from '../../utils/share'
import type { ContactInfo } from '../../types/order'

interface SendPanelProps {
  productName: string
  hasGenerated: boolean
  isExporting: boolean
  onGenerate: () => void
  onDownload: () => void
  /** Righe del riepilogo opzioni (una per gruppo), o null se il prodotto non ha un pannello Opzioni e Prezzo. */
  orderSummaryLines: OrderSummaryLine[] | null
  /** Totale stimato in euro, o null se il prodotto non ha pricing. */
  total: number | null
  /** Note libere inserite dall'utente nel pannello Opzioni e Prezzo. */
  notes: string
  /** Riepilogo già formattato come testo semplice, pronto per email/copia (include anche note, contatti e link). */
  orderSummaryText: string | null
  /** Genera il "biglietto preventivo": un'unica immagine (render + riepilogo + totale) pensata per Instagram. */
  onGenerateQuoteCard: () => void
  isGeneratingQuoteCard: boolean
  /** Codice breve della richiesta, da citare nelle conversazioni. */
  orderCode: string | null
  /** Link che riapre il configuratore su questa esatta configurazione. */
  configUrl: string | null
  /** Dati di contatto (facoltativi) inseriti dal cliente. */
  contact: ContactInfo
  onContactChange: (contact: ContactInfo) => void
  /** Dichiarazione sui diritti dell'immagine caricata: finché è falsa, l'invio resta bloccato. */
  rightsAccepted: boolean
  onRightsAcceptedChange: (value: boolean) => void
  /** Condivisione nativa del render (disponibile quasi solo su telefono). */
  canShareRender: boolean
  onShareRender: () => void
  isSharing: boolean
}

/**
 * Azione di invio verso un canale esterno (email, Instagram, WhatsApp).
 *
 * Quando l'invio è bloccato (dichiarazione sui diritti non spuntata) viene
 * reso un pulsante disattivato invece del link: un tag `<a>` non si può
 * disabilitare davvero — resta cliccabile con il mouse, raggiungibile da
 * tastiera e apribile dal menu contestuale anche con `aria-disabled`.
 *
 * È definito fuori dal componente padre di proposito: dichiararlo all'interno
 * creerebbe un tipo di componente nuovo a ogni render, costringendo React a
 * smontare e rimontare questi elementi invece di aggiornarli.
 */
function SendAction({
  href,
  disabled,
  disabledTitle,
  onClick,
  className,
  style,
  external,
  children,
}: {
  href: string
  disabled: boolean
  disabledTitle: string
  onClick?: () => void
  className: string
  style?: CSSProperties
  external?: boolean
  children: ReactNode
}) {
  if (disabled) {
    return (
      <button type="button" disabled className={className} style={style} title={disabledTitle}>
        {children}
      </button>
    )
  }
  return (
    <a
      href={href}
      onClick={onClick}
      className={className}
      style={style}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
    >
      {children}
    </a>
  )
}

/**
 * Pannello sempre visibile non appena il collage ha almeno un'immagine:
 * mostra il riepilogo dell'ordine (se il prodotto ha un pannello Opzioni e
 * Prezzo) e come far arrivare l'idea a RetroAvia.
 *
 * Trattandosi di un sito 100% statico (senza alcun server dietro), la
 * richiesta viaggia sempre attraverso un canale scelto dal cliente. Per
 * ridurre al minimo i passaggi manuali — che sono il punto in cui si perdono
 * più richieste — il pannello offre, in ordine di comodità:
 *
 *  1. CONDIVISIONE NATIVA (telefono): render + riepilogo passati direttamente
 *     all'app scelta dal cliente, senza scaricare e ri-allegare nulla.
 *  2. WHATSAPP, se un numero è configurato: è l'unico canale che permette di
 *     precompilare davvero il testo del messaggio.
 *  3. EMAIL: testo precompilato, allegato da aggiungere a mano.
 *  4. INSTAGRAM: nessuna precompilazione possibile, quindi si offre il
 *     "biglietto preventivo" (una sola immagine con render + riepilogo) e la
 *     copia del testo.
 *
 * In tutti i casi il messaggio contiene il CODICE RICHIESTA e il LINK alla
 * configurazione: sono i due elementi che permettono a RetroAvia di riaprire
 * e modificare il preventivo senza doverlo ricostruire a mano.
 */
function SendPanel({
  productName,
  hasGenerated,
  isExporting,
  onGenerate,
  onDownload,
  orderSummaryLines,
  total,
  notes,
  orderSummaryText,
  onGenerateQuoteCard,
  isGeneratingQuoteCard,
  orderCode,
  configUrl,
  contact,
  onContactChange,
  rightsAccepted,
  onRightsAcceptedChange,
  canShareRender,
  onShareRender,
  isSharing,
}: SendPanelProps) {
  const { t, locale } = useLanguage()
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const mailtoHref = buildMailtoHref(productName, orderSummaryText ?? undefined)
  const instagramHref = buildInstagramDmHref()
  const whatsappHref = buildWhatsAppHref(productName, orderSummaryText ?? undefined)
  const animatedTotal = useAnimatedNumber(total ?? 0)
  const mailtoRisky = isMailtoRisky(mailtoHref)

  const handleCopySummary = async () => {
    playClick()
    if (!orderSummaryText) return
    if (await copyToClipboard(orderSummaryText)) {
      setCopied(true)
      trackEvent('summary_copied', { product: productName })
      setTimeout(() => setCopied(false), 2500)
    }
  }

  const handleCopyLink = async () => {
    playClick()
    if (!configUrl) return
    if (await copyToClipboard(configUrl)) {
      setCopiedLink(true)
      trackEvent('config_link_copied', { product: productName })
      setTimeout(() => setCopiedLink(false), 2500)
    }
  }

  const updateContact = (patch: Partial<ContactInfo>) => onContactChange({ ...contact, ...patch })

  const primaryButtonClass =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40'
  const secondaryButtonClass =
    'inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm font-bold text-ink transition-all hover:border-primary/60 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40'
  const inputClass =
    'mt-1 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus-visible:outline-2 focus-visible:outline-accent'

  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-border bg-surface p-5 shadow-xl sm:p-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">{t('sendPanel.heading')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t('sendPanel.description')}</p>
      </div>

      {orderSummaryLines && orderSummaryLines.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface-2 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-sm font-medium text-ink">
              <span aria-hidden="true">🧾</span>
              {t('sendPanel.orderSummaryHeading')}
            </p>
            {orderCode && (
              <span className="rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 font-mono text-[11px] font-bold tracking-wide text-accent">
                {orderCode}
              </span>
            )}
          </div>
          <ul className="mt-3 flex flex-col gap-1.5">
            {orderSummaryLines.map((line) => (
              <li key={line.groupId} className="flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 truncate text-ink-muted">{line.groupTitle}</span>
                <span className="shrink-0 text-right font-medium text-ink">
                  {line.optionLabel}
                  <span className="ml-1.5 font-mono text-ink-muted">{formatPriceDelta(line.priceDelta, locale)}</span>
                </span>
              </li>
            ))}
          </ul>
          {notes.trim() && (
            <p className="mt-3 whitespace-pre-wrap border-t border-border pt-3 text-xs leading-relaxed text-ink-muted">
              <span className="font-medium text-ink">{t('sendPanel.notesPrefix')}</span>
              {notes.trim()}
            </p>
          )}
          {total !== null && (
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm font-bold text-ink">{t('sendPanel.totalLabel')}</span>
              <span className="font-mono text-lg font-extrabold text-accent">{formatTotal(animatedTotal, locale)}</span>
            </div>
          )}
        </div>
      )}

      {/* Passaggio 1: genera il render */}
      <div className="rounded-2xl border border-border bg-surface-2 p-4">
        <p className="text-sm font-medium text-ink">{t('sendPanel.step1Heading')}</p>
        <p className="mt-1 text-xs text-ink-muted">{t('sendPanel.step1Description')}</p>
        <button
          type="button"
          onClick={() => {
            playClick()
            onGenerate()
          }}
          disabled={isExporting}
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
          style={{ backgroundImage: 'linear-gradient(90deg, #c1272d, #e8b04b)' }}
        >
          {isExporting ? (
            t('sendPanel.generating')
          ) : (
            <>
              <span aria-hidden="true">📨</span>
              {hasGenerated ? t('sendPanel.regenerate') : t('sendPanel.generateAndDownload')}
            </>
          )}
        </button>
        {hasGenerated && !isExporting && (
          <p className="animate-gentle-pop mt-2 text-xs font-medium text-success">{t('sendPanel.downloadedConfirm')}</p>
        )}
      </div>

      {/* Passaggio 2: invio */}
      <div className="rounded-2xl border border-border bg-surface-2 p-4">
        <p className="text-sm font-medium text-ink">{t('sendPanel.step2Heading')}</p>
        <p className="mt-1 text-xs text-ink-muted">{t('sendPanel.step2Description')}</p>

        {/* Contatti facoltativi: senza, una richiesta arrivata a metà è
            irrecuperabile perché non si sa a chi rispondere. */}
        <div className="mt-3 rounded-xl border border-border bg-surface p-3">
          <p className="text-xs font-semibold text-ink">
            <span aria-hidden="true">👤</span> {t('sendPanel.contactHeading')}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">{t('sendPanel.contactHint')}</p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div>
              <label htmlFor="contact-name" className="text-[11px] font-medium text-ink-muted">
                {t('sendPanel.contactName')}
              </label>
              <input
                id="contact-name"
                type="text"
                autoComplete="name"
                maxLength={60}
                value={contact.name}
                onChange={(e) => updateContact({ name: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="text-[11px] font-medium text-ink-muted">
                {t('sendPanel.contactEmail')}
              </label>
              <input
                id="contact-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                maxLength={120}
                value={contact.email}
                onChange={(e) => updateContact({ email: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="contact-instagram" className="text-[11px] font-medium text-ink-muted">
                {t('sendPanel.contactInstagram')}
              </label>
              <input
                id="contact-instagram"
                type="text"
                maxLength={40}
                placeholder="@nome"
                value={contact.instagram}
                onChange={(e) => updateContact({ instagram: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Dichiarazione sui diritti dell'immagine: l'utente carica quello che
            vuole (loghi, personaggi, foto altrui) e chi realizza il pezzo è
            RetroAvia. Una spunta esplicita prima dell'invio è la tutela minima. */}
        <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-xl border border-border bg-surface p-3 text-xs leading-relaxed text-ink-muted">
          <input
            type="checkbox"
            checked={rightsAccepted}
            onChange={(e) => onRightsAcceptedChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
          />
          <span>{t('sendPanel.rightsLabel')}</span>
        </label>

        <button
          type="button"
          onClick={() => {
            playClick()
            onDownload()
          }}
          disabled={!hasGenerated}
          className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-primary/60 disabled:pointer-events-none disabled:opacity-40"
        >
          <span aria-hidden="true">⬇️</span>
          {t('sendPanel.downloadAgain')}
        </button>

        {/* Condivisione nativa: su telefono è il percorso più corto in assoluto
            (render + testo direttamente nella conversazione scelta), quindi
            quando è disponibile viene mostrata per prima. */}
        {canShareRender && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => {
                playClick()
                onShareRender()
              }}
              disabled={!hasGenerated || isSharing || !rightsAccepted}
              className={`${primaryButtonClass} w-full`}
              style={{ backgroundImage: 'linear-gradient(90deg, #c1272d, #e8b04b)' }}
            >
              <span aria-hidden="true">📲</span>
              {isSharing ? t('sendPanel.sharing') : t('sendPanel.shareNative')}
            </button>
            <p className="mt-1.5 text-center text-[11px] text-ink-muted">{t('sendPanel.shareHint')}</p>
          </div>
        )}

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SendAction
            href={mailtoHref}
            disabled={!rightsAccepted}
            disabledTitle={t('sendPanel.rightsRequired')}
            onClick={() => {
              playClick()
              trackEvent('email_send_clicked', { product: productName })
            }}
            className={primaryButtonClass}
            style={{ backgroundImage: 'linear-gradient(90deg, #c1272d, #e8b04b)' }}
          >
            <span aria-hidden="true">✉️</span>
            {t('sendPanel.sendEmail')}
          </SendAction>
          <SendAction
            href={instagramHref}
            external
            disabled={!rightsAccepted}
            disabledTitle={t('sendPanel.rightsRequired')}
            onClick={() => {
              playClick()
              trackEvent('instagram_send_clicked', { product: productName })
            }}
            className={secondaryButtonClass}
          >
            <InstagramIcon className="h-4 w-4" />
            {t('sendPanel.sendInstagram')}
          </SendAction>
        </div>

        {whatsappHref && (
          <SendAction
            href={whatsappHref}
            external
            disabled={!rightsAccepted}
            disabledTitle={t('sendPanel.rightsRequired')}
            onClick={() => {
              playClick()
              trackEvent('whatsapp_send_clicked', { product: productName })
            }}
            className={`${secondaryButtonClass} mt-3 w-full`}
          >
            <span aria-hidden="true">💬</span>
            {t('sendPanel.sendWhatsapp')}
          </SendAction>
        )}

        {!rightsAccepted && (
          <p role="status" className="mt-2 text-center text-[11px] font-medium text-accent">
            {t('sendPanel.rightsRequired')}
          </p>
        )}

        {mailtoRisky && rightsAccepted && (
          <p className="mt-2 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-[11px] leading-relaxed text-ink-muted">
            <span aria-hidden="true">⚠️</span> {t('sendPanel.mailtoWarning')}
          </p>
        )}

        {orderSummaryLines && (
          <div className="mt-3 rounded-xl border border-dashed border-accent/40 bg-accent/5 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-ink">
              <span aria-hidden="true">🎟️</span>
              {t('sendPanel.instagramRecommended')}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">{t('sendPanel.instagramRecommendedDescription')}</p>
            <button
              type="button"
              onClick={() => {
                playClick()
                onGenerateQuoteCard()
              }}
              disabled={!hasGenerated || isGeneratingQuoteCard}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-accent/50 bg-page px-4 py-2.5 text-sm font-bold text-accent transition-colors hover:bg-accent/10 disabled:pointer-events-none disabled:opacity-40"
            >
              <span aria-hidden="true">🖼️</span>
              {isGeneratingQuoteCard ? t('sendPanel.generatingQuoteCard') : t('sendPanel.generateQuoteCard')}
            </button>
            {!hasGenerated && (
              <p className="mt-1.5 text-[11px] text-ink-muted">{t('sendPanel.generateQuoteCardHint')}</p>
            )}
          </div>
        )}

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {orderSummaryText && (
            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-primary/60 hover:text-ink"
            >
              <span aria-hidden="true">{copied ? '✅' : '📋'}</span>
              {copied ? t('sendPanel.copiedSummary') : t('sendPanel.copySummary')}
            </button>
          )}
          {configUrl && (
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-2.5 text-xs font-semibold text-ink-muted transition-colors hover:border-primary/60 hover:text-ink"
            >
              <span aria-hidden="true">{copiedLink ? '✅' : '🔗'}</span>
              {copiedLink ? t('sendPanel.copiedLink') : t('sendPanel.copyLink')}
            </button>
          )}
        </div>

        {configUrl && <p className="mt-2 text-center text-[11px] leading-relaxed text-ink-muted">{t('sendPanel.copyLinkHint')}</p>}

        <p className="mt-3 text-center text-xs text-ink-muted">
          {t('sendPanel.noOpenFooter')}{' '}
          <a href={RETROAVIA_INSTAGRAM_PROFILE} target="_blank" rel="noreferrer" className="underline hover:text-accent">
            {t('sendPanel.noOpenFooterLink')}
          </a>
          .
        </p>
      </div>
    </div>
  )
}

export default memo(SendPanel)
