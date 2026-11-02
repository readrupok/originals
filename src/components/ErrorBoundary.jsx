import { Component } from 'react';

/**
 * Last line of defence: if a page throws while rendering, the reader sees a
 * short message and a way back instead of a blank screen. Written in both
 * languages because the site's copy may be what failed to load.
 */
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error('[site] render failed', error, info?.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const box = { maxWidth: 520, margin: '18vh auto 0', padding: '0 16px', textAlign: 'center', fontFamily: 'system-ui, sans-serif', color: '#151515', lineHeight: 1.6 };
    const btn = { marginTop: 20, padding: '10px 22px', border: '2px solid #151515', borderRadius: 999, background: '#ffd84d', font: 'inherit', fontWeight: 700, cursor: 'pointer' };
    return (
      <div role="alert" style={box}>
        <h1 style={{ fontSize: 24, margin: '0 0 8px' }}>কিছু একটা ভুল হয়েছে</h1>
        <p style={{ margin: 0 }}>Something went wrong on this page. Please reload — if it keeps happening, try again in a few minutes.</p>
        <button type="button" style={btn} onClick={() => window.location.reload()}>আবার লোড করুন / Reload</button>
        <p style={{ marginTop: 14 }}><a href="/" style={{ color: '#151515' }}>হোম / Home</a></p>
      </div>
    );
  }
}
