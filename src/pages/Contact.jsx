import React, { useState } from 'react';
import { api } from '../services/api';
import { IArrowRight, IPlay, ISpinner } from '../components/icons';
import { SOCIAL_ICONS, SOCIAL_COLORS } from '../components/SocialIcons';

export default function Contact({ lang, t }) {
  const [sent, setSent] = useState(false);
  // ?topic=licensing (from the Partners page, for one) preselects a topic. The
  // topics are positional labels in Page Content, so names map to indices.
  const [topic, setTopic] = useState(() => {
    const TOPIC_INDEX = { broadcast: 0, licensing: 1, collaboration: 2, partnership: 2, press: 3, other: 4 };
    try {
      const named = new URLSearchParams(window.location.search).get('topic');
      return TOPIC_INDEX[named] ?? 0;
    } catch {
      return 0;
    }
  });
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [apiErr, setApiErr] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setApiErr(null);

    const subject = (t.topics || [])[topic] || 'General';
    const result = await api.sendContact({
      name: formData.name,
      email: formData.email,
      subject,
      message: formData.message
    });

    setSubmitting(false);
    if (result.ok) {
      setSent(true);
    } else {
      setApiErr(result.error || 'Something went wrong. Please try again.');
    }
  };

  const handleReset = () => {
    setSent(false);
    setApiErr(null);
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div style={{ color: '#151515' }}>
      <section
        data-screen-label="Contact"
        style={{
          maxWidth: 1440,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
          gap: 'clamp(24px, 3vw, 48px)',
          alignItems: 'start',
          padding: 'clamp(28px, 4.5vh, 64px) clamp(12px, 1.8vw, 24px) clamp(48px, 6vh, 80px)'
        }}
      >
        {/* Left Column: Info & YouTube channel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span
            style={{
              alignSelf: 'flex-start',
              padding: '6px 14px',
              border: '2px solid #151515',
              borderRadius: 999,
              background: '#fff',
              fontWeight: 800,
              fontSize: 13,
              boxShadow: '3px 3px 0 #151515'
            }}
          >
            {t.eyebrowContact}
          </span>
          <h1
            style={{
              margin: 0,
              fontFamily: "'Sora', 'Hind Siliguri', sans-serif",
              fontWeight: 800,
              fontSize: 'clamp(40px, 5.5vw, 84px)',
              lineHeight: 0.98,
              letterSpacing: '-.045em',
              textWrap: 'balance'
            }}
          >
            {t.h1Contact}
          </h1>
          <p style={{ margin: 0, maxWidth: 440, fontSize: 'clamp(16px, 1.3vw, 19px)', lineHeight: 1.6, color: '#55524a' }}>
            {t.bodyContact}
          </p>

          <a
            href={t.ytUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              alignSelf: 'flex-start',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginTop: 6,
              padding: '12px 18px 12px 12px',
              borderRadius: 16,
              background: '#fff',
              border: '2px solid #151515',
              boxShadow: '4px 4px 0 #151515',
              textDecoration: 'none',
              transition: 'transform 0.15s'
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translate(-2px, -2px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 46,
                height: 46,
                borderRadius: 12,
                background: '#e11d48',
                color: '#fff',
                fontSize: 16
              }}
            >
              <IPlay />
            </span>
            <span style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#6b675e' }}>YouTube</span>
              <span style={{ fontWeight: 800, fontSize: 16 }}>{t.ytHandle}</span>
            </span>
          </a>

          {(t.socials || []).some(s => s.k !== 'youtube') && (
            <div data-testid="contact-socials" style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {t.socials.filter(s => s.k !== 'youtube').map(({ k, name, url }) => {
                const Icon = SOCIAL_ICONS[k];
                return (
                  <a
                    key={k}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer me"
                    aria-label={name}
                    title={name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 46,
                      height: 46,
                      borderRadius: 12,
                      background: SOCIAL_COLORS[k],
                      color: '#fff',
                      fontSize: 20,
                      border: '2px solid #151515',
                      boxShadow: '3px 3px 0 #151515',
                      transition: 'transform 0.15s'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'translate(-2px, -2px)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
                  >
                    <Icon />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Comic Speech Bubble Form */}
        <div style={{ position: 'relative' }}>
          {sent ? (
            <div
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 14,
                padding: 'clamp(28px, 4vw, 48px)',
                borderRadius: 28,
                background: '#fff',
                border: '2px solid #151515',
                boxShadow: '10px 10px 0 #151515',
                animation: 'rs-in 0.4s ease-out'
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 150,
                  height: 150,
                  background: '#151515',
                  color: '#f4f1ea',
                  clipPath:
                    'polygon(50% 0, 61% 20%, 83% 10%, 79% 34%, 100% 42%, 82% 58%, 94% 80%, 70% 78%, 60% 100%, 47% 82%, 26% 96%, 25% 72%, 2% 70%, 16% 52%, 0 32%, 24% 28%, 20% 6%, 40% 18%)',
                  fontFamily: "'Bangers', 'Hind Siliguri', cursive",
                  fontSize: 34,
                  letterSpacing: '.04em',
                  transform: 'rotate(-10deg)',
                  animation: 'rs-wig 2s ease-in-out infinite'
                }}
              >
                {t.pow}
              </span>
              <span style={{ fontFamily: "'Sora', 'Hind Siliguri', sans-serif", fontWeight: 800, fontSize: 'clamp(28px, 3vw, 42px)', lineHeight: 1.05 }}>
                {t.sentH}
              </span>
              <span style={{ fontSize: 17 }}>{t.sentB}</span>
              <button
                onClick={handleReset}
                style={{
                  marginTop: 6,
                  padding: '12px 20px',
                  borderRadius: 12,
                  border: '2px solid #151515',
                  background: '#fff',
                  font: 'inherit',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: 'pointer',
                  boxShadow: '3px 3px 0 #151515'
                }}
              >
                {t.again}
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
                padding: 'clamp(22px, 3vw, 40px)',
                borderRadius: 32,
                background: '#fff',
                border: '2px solid #151515',
                boxShadow: '10px 10px 0 #151515'
              }}
            >
              {/* Comic Bubble Pointer Tail */}
              <span
                style={{
                  position: 'absolute',
                  left: 48,
                  bottom: -30,
                  width: 44,
                  height: 30,
                  background: '#fff',
                  clipPath: 'polygon(0 0, 100% 0, 10% 100%)',
                  filter: 'drop-shadow(0 0 0 #151515)'
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: 44,
                  bottom: -34,
                  width: 52,
                  height: 36,
                  background: '#151515',
                  clipPath: 'polygon(0 0, 100% 0, 8% 100%)',
                  zIndex: -1
                }}
              />

              {/* Topic Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{t.topic}</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {t.topics.map((label, idx) => {
                    const on = idx === topic;
                    return (
                      <button
                        type="button"
                        key={label}
                        onClick={() => setTopic(idx)}
                        style={{
                          padding: '8px 15px',
                          borderRadius: 12,
                          font: 'inherit',
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: '2px solid #151515',
                          background: on ? '#151515' : '#fff',
                          color: on ? '#f4f1ea' : '#151515',
                          boxShadow: on ? 'none' : '3px 3px 0 #151515',
                          transition: 'all 0.15s'
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Inputs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 14 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, fontWeight: 700 }}>
                  {t.name}
                  <input
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    style={{
                      minHeight: 52,
                      padding: '0 16px',
                      borderRadius: 12,
                      border: '2px solid #151515',
                      background: '#f9f7f1',
                      font: 'inherit',
                      fontSize: 16
                    }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, fontWeight: 700 }}>
                  {t.email}
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      minHeight: 52,
                      padding: '0 16px',
                      borderRadius: 12,
                      border: '2px solid #151515',
                      background: '#f9f7f1',
                      font: 'inherit',
                      fontSize: 16
                    }}
                  />
                </label>
              </div>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, fontWeight: 700 }}>
                {t.msg}
                <textarea
                  required
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  style={{
                    minHeight: 150,
                    padding: '14px 16px',
                    borderRadius: 12,
                    border: '2px solid #151515',
                    background: '#f9f7f1',
                    font: 'inherit',
                    fontSize: 16,
                    resize: 'vertical'
                  }}
                />
              </label>

              {apiErr && (
                <p style={{ margin: 0, padding: '10px 14px', borderRadius: 10, background: '#fee2e2', border: '1.5px solid #fca5a5', color: '#991b1b', fontSize: 14, fontWeight: 600 }}>
                  {apiErr}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  alignSelf: 'flex-start',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '15px 26px',
                  borderRadius: 14,
                  border: '2px solid #151515',
                  background: submitting ? '#6f6758' : '#151515',
                  color: '#f4f1ea',
                  font: 'inherit',
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: submitting ? 'none' : '5px 5px 0 #6d28d9',
                  transition: 'transform 0.15s, background 0.15s'
                }}
                onMouseEnter={e => !submitting && (e.currentTarget.style.transform = 'translate(-2px, -2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
              >
                {submitting ? <><ISpinner /> {t.sending}</> : <>{t.send} <IArrowRight /></>}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
