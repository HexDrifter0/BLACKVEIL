import { Component, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  moduleName?: string
}

type State = {
  hasError: boolean
}

/**
 * Contains failed lazy imports and render errors so one optional workspace
 * module cannot leave the whole application on a blank screen.
 */
export default class ModuleErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error): void {
    console.error(`[BLACKVEIL] Failed to load ${this.props.moduleName ?? 'workspace'} module.`, error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="module-placeholder" role="alert" aria-live="assertive">
          <div className="placeholder-icon">!</div>
          <h2>{this.props.moduleName ?? 'Workspace'} could not be loaded</h2>
          <p>The module failed to load. Your local workspace data has not been intentionally changed.</p>
          <button className="primary-btn" type="button" onClick={() => window.location.reload()}>
            Reload BLACKVEIL
          </button>
        </section>
      )
    }

    return this.props.children
  }
}
