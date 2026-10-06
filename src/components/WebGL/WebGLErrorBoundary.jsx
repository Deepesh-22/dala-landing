import { Component } from 'react';

export default class WebGLErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || String(error) };
  }

  componentDidCatch(error, info) {
    console.error('[WebGL] crash:', error?.message || error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      // Still show children attempt is gone — use fallback
      // but log so we can see in console
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
