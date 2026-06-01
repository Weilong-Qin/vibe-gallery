import React from 'react'
import type { ProfileData } from '../../../types/index.js'
import { SocialIcon } from '../SocialIcons.js'
import { MarkdownText } from '../MarkdownText.js'

function formatUrl(key: string, url: string): string {
  if (key === 'email' && !url.startsWith('mailto:')) return `mailto:${url}`
  return url
}

export function Profile({ profile }: { profile: ProfileData }) {
  return (
    <div className="profile">
      {profile.avatarUrl && (
        <img
          className="profile__avatar"
          src={profile.avatarUrl}
          alt={profile.name}
          loading="lazy"
          decoding="async"
          width={96}
          height={96}
        />
      )}
      <h1 className="profile__name">{profile.name}</h1>
      {profile.bio && <MarkdownText content={profile.bio} className="profile__bio" />}
      {profile.links.length > 0 && (
        <div className="profile__links">
          {profile.links.map((link) => (
            <a
              key={link.key}
              className="profile__link"
              href={formatUrl(link.key, link.url)}
              target={link.key === 'email' ? undefined : '_blank'}
              rel="noopener noreferrer"
              title={link.key}
            >
              <span className="profile__link-icon">
                <SocialIcon icon={link.icon} />
              </span>
              {link.key}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
