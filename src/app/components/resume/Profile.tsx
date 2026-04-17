import React from 'react'
import type { ProfileData } from '../../../types/index.js'

const SOCIAL_ICONS: Record<string, string> = {
  github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>',
  weibo: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.614-2.759 5.049-6.739 5.443zM11.33 0S5.04.53 5.04 8.406c0 0-2.45 1.085-2.45 3.506 0 0 1.037.133 1.037-.91 0 0 .127-2.152 2.846-2.81 0 0 .129 6.534 7.268 5.564 7.138-.97 8.018-8.317 5.476-11.39C17.675.895 14.62-.352 11.33 0z"/></svg>',
}

function getSocialIcon(key: string): string {
  return SOCIAL_ICONS[key] ?? SOCIAL_ICONS.email.replace('rect', 'circle') // generic fallback
}

function formatUrl(key: string, url: string): string {
  if (key === 'email' && !url.startsWith('mailto:')) return `mailto:${url}`
  return url
}

export function Profile({ profile }: { profile: ProfileData }) {
  return (
    <div style={{ textAlign: 'center' }}>
      {profile.avatarUrl && (
        <img
          src={profile.avatarUrl}
          alt={profile.name}
          style={{
            width: 96,
            height: 96,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '3px solid var(--color-accent)',
            marginBottom: 'var(--space-md)',
          }}
        />
      )}
      <h1 style={{
        fontSize: 'var(--font-size-2xl)',
        fontWeight: 700,
        color: 'var(--color-text)',
        marginBottom: 'var(--space-sm)',
      }}>
        {profile.name}
      </h1>
      {profile.bio && (
        <p style={{
          color: 'var(--color-text-muted)',
          fontSize: 'var(--font-size-base)',
          lineHeight: 1.6,
          marginBottom: 'var(--space-lg)',
          maxWidth: 360,
          margin: '0 auto var(--space-lg)',
        }}>
          {profile.bio}
        </p>
      )}
      {profile.links.length > 0 && (
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
          {profile.links.map((link) => (
            <a
              key={link.key}
              href={formatUrl(link.key, link.url)}
              target={link.key === 'email' ? undefined : '_blank'}
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-xs)',
                color: 'var(--color-text-muted)',
                fontSize: 'var(--font-size-sm)',
                transition: 'color 0.15s',
              }}
              title={link.key}
            >
              <span
                style={{ width: 18, height: 18, display: 'inline-flex' }}
                dangerouslySetInnerHTML={{ __html: getSocialIcon(link.key) }}
              />
              {link.key}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
