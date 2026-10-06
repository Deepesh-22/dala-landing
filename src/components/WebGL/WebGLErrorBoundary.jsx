import { Component } from 'react';

/**
 * Catches WebGL/React errors once. Never re-enters children after failure
 * (avoids Maximum call stack size exceeded loops).
 */
export default class WebGLErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.warn('[WebGL] suppressed:', error?.message || error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
