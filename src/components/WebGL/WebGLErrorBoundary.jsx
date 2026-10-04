import { Component } from 'react';

/**
 * Catches R3F / Three.js WebGL init failures so the rest of the app
 * (nav, sections, loader) still renders instead of a blank black page.
 */
export default class WebGLErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'WebGL failed',
    };
  }

  componentDidCatch(error) {
    console.warn('[WebGL] suppressed crash:', error?.message || error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
