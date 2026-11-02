import React from 'react';

// Brand marks (simple-icons, CC0) — lucide-react does not ship brand logos
const svg = (children, props = {}) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false" style={{ display: 'inline-block', verticalAlign: '-0.125em', flex: 'none' }} {...props}>
    {children}
  </svg>
);

export const IYouTube = () => svg(<path fill="currentColor" d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.87.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81ZM9.55 15.57V8.43L15.82 12l-6.27 3.57Z" />);

export const IFacebook = () => svg(<path fill="currentColor" d="M9.1 23.69v-7.98H6.63v-3.67H9.1v-1.58c0-4.09 1.85-5.98 5.86-5.98.4 0 .96.04 1.47.1.39.04.77.11 1.14.2v3.32c-.22-.02-.44-.03-.65-.04-.25 0-.49-.01-.73-.01-.71 0-1.26.1-1.68.31-.28.14-.52.36-.68.62-.26.42-.37 1-.37 1.75v1.3h3.92l-.39 2.1-.29 1.56h-3.24v8.25C19.4 23.24 24 18.18 24 12.04c0-6.63-5.37-12-12-12S0 5.41 0 12.04c0 5.63 3.87 10.35 9.1 11.65Z" />);

export const IInstagram = () => svg(
  <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="17.6" cy="6.4" r="0.6" fill="currentColor" />
  </g>
);

export const ITikTok = () => svg(<path fill="currentColor" d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03a10.7 10.7 0 0 1-4.2-.97c-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07Z" />);

export const SOCIAL_ICONS = { youtube: IYouTube, facebook: IFacebook, instagram: IInstagram, tiktok: ITikTok };

// Brand colors for icon tiles
export const SOCIAL_COLORS = { youtube: '#e11d48', facebook: '#1877f2', instagram: '#d62976', tiktok: '#151515' };

// Square brand-colored icon links for dark backgrounds; renders nothing when none are set
export function SocialButtons({ socials, exclude = 'youtube' }) {
  const list = (socials || []).filter(s => s.k !== exclude);
  if (!list.length) return null;
  return <span style={{ display: 'flex', gap: 10 }}>{list.map(({ k, name, url }) => {
    const Icon = SOCIAL_ICONS[k];
    return (
      <a
        key={k}
        href={url}
        target="_blank"
        rel="noopener noreferrer me"
        aria-label={name}
        title={name}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none', width: 48, height: 48, borderRadius: 14, background: SOCIAL_COLORS[k], color: '#fff', border: '2px solid #f4f1ea', fontSize: 22, textDecoration: 'none' }}
      >
        <Icon />
      </a>
    );
  })}</span>;
}
