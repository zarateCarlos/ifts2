import { useEffect, useState } from 'react'
import type { SocialLink } from './site'
import { emptySocialSlots } from './siteSettings'
import {
  ensureInstituteBundle,
  peekInstituteBundle,
  updateSocialLinks,
  SOCIAL_EVENT,
} from '../api/siteSettingsApi'

export function loadSocialLinks(): SocialLink[] {
  const cached = peekInstituteBundle()?.social
  return cached?.length ? cached : emptySocialSlots()
}

export async function saveSocialLinks(links: SocialLink[]) {
  return updateSocialLinks(links)
}

export function useSocialLinks() {
  const [links, setLinks] = useState<SocialLink[]>(() => loadSocialLinks())
  const [loading, setLoading] = useState(() => !peekInstituteBundle())

  useEffect(() => {
    let cancelled = false
    ensureInstituteBundle()
      .then((b) => {
        if (!cancelled) {
          setLinks(b.social.length ? b.social : emptySocialSlots())
        }
      })
      .catch(() => {
        if (!cancelled) setLinks(emptySocialSlots())
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    function sync() {
      void ensureInstituteBundle(true)
        .then((b) => {
          if (!cancelled) {
            setLinks(b.social.length ? b.social : emptySocialSlots())
          }
        })
        .catch(() => {
          if (!cancelled) setLinks(emptySocialSlots())
        })
    }
    window.addEventListener(SOCIAL_EVENT, sync)
    return () => {
      cancelled = true
      window.removeEventListener(SOCIAL_EVENT, sync)
    }
  }, [])

  const visible = links.filter((l) => l.visible && l.href.trim())

  return {
    links: visible,
    all: links,
    loading,
    async setAll(next: SocialLink[]) {
      const saved = await updateSocialLinks(next)
      setLinks(saved.length ? saved : emptySocialSlots())
      return saved
    },
  }
}
