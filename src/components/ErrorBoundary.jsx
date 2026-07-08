import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    this.setState({ info })
    console.error('[ErrorBoundary]', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          <h2 style={{ color: '#dc2626' }}>渲染崩溃</h2>
          <div style={{ marginTop: 12 }}>
            <strong>Error:</strong> {String(this.state.error?.message || this.state.error)}
          </div>
          <pre style={{ marginTop: 12, fontSize: 11, color: '#44403c' }}>
            {this.state.error?.stack}
          </pre>
          {this.state.info?.componentStack && (
            <pre style={{ marginTop: 12, fontSize: 11, color: '#78716c' }}>
              {this.state.info.componentStack}
            </pre>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
