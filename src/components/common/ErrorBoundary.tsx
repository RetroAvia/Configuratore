import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useLanguage } from '../../i18n/LanguageContext'

interface ErrorBoundaryClassProps {
  children: ReactNode
  title: string
  description: string
  reloadLabel: string
}

interface ErrorBoundaryClassState {
  hasError: boolean
}

class ErrorBoundaryClass extends Component<ErrorBoundaryClassProps, ErrorBoundaryClassState> {
  state: ErrorBoundaryClassState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryClassState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('RetroAvia Lab · errore non gestito:', error, info.componentStack)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
          <span aria-hidden="true" className="text-4xl">
            ⚠️
          </span>
          <h1 className="text-xl font-bold text-ink">{this.props.title}</h1>
          <p className="text-sm leading-relaxed text-ink-muted">{this.props.description}</p>
          <button
            type="button"
            onClick={this.handleReload}
            className="mt-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-transform duration-300 ease-fluid hover:-translate-y-0.5"
          >
            {this.props.reloadLabel}
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default function AppErrorBoundary({ children }: { children: ReactNode }) {
  const { t } = useLanguage()
  return (
    <ErrorBoundaryClass
      title={t('errorBoundary.title')}
      description={t('errorBoundary.description')}
      reloadLabel={t('errorBoundary.reload')}
    >
      {children}
    </ErrorBoundaryClass>
  )
}
