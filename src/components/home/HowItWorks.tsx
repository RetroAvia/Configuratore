import { howItWorksSteps } from '../../data/howItWorks'
import Reveal from '../common/Reveal'
import { useLanguage } from '../../i18n/LanguageContext'

export default function HowItWorks() {
  const { t, tr } = useLanguage()
  return (
    <section className="mt-24">
      <Reveal className="text-center">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">{t('howItWorks.eyebrow')}</h2>
        <p className="mt-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{t('howItWorks.title')}</p>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {howItWorksSteps.map((step, index) => (
          <Reveal key={step.title} delayMs={index * 90} className="step-connector relative">
            <div className="group flex h-full flex-col items-center rounded-2xl border border-border bg-surface p-6 text-center transition-all duration-500 ease-fluid hover:-translate-y-1.5 hover:border-accent/50 hover:shadow-xl hover:shadow-accent/10">
              <span
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-xl shadow-lg shadow-primary/20 transition-transform duration-500 ease-fluid group-hover:scale-110"
                style={{ backgroundImage: 'linear-gradient(135deg, #c1272d, #e8b04b)' }}
                aria-hidden="true"
              >
                {step.icon}
              </span>
              <span className="mt-4 text-[11px] font-bold uppercase tracking-widest text-accent">
                {t('howItWorks.step', { n: index + 1 })}
              </span>
              <h3 className="mt-1 text-base font-bold text-ink">{tr(step.title, step.titleI18n)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{tr(step.description, step.descriptionI18n)}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
