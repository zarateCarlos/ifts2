import { useEffect, useState } from 'react'
import {
  ensureInstituteBundle,
  fetchContact,
  peekInstituteBundle,
  saveInstituteBundle,
  updateContact,
  CONTACT_EVENT,
} from '../api/siteSettingsApi'
import {
  defaultContact,
  defaultProfile,
  type InstituteContact,
  type InstituteProfile,
} from './siteSettings'
import type { SocialLink } from './site'

export type { InstituteContact, InstituteProfile }
export { defaultContact, defaultProfile }

export function mapsEmbedUrl(query: string) {
  const q = query.trim() || defaultContact.mapQuery
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=16&hl=es&output=embed`
}

export function mapsOpenUrl(query: string) {
  const q = query.trim() || defaultContact.mapQuery
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

export function loadInstituteContact(): InstituteContact {
  return peekInstituteBundle()?.profile.contact ?? { ...defaultContact }
}

export async function saveInstituteContact(next: InstituteContact) {
  return updateContact(next)
}

export function useInstituteContact() {
  const [contact, setContact] = useState(loadInstituteContact)
  const [loading, setLoading] = useState(() => !peekInstituteBundle())

  useEffect(() => {
    let cancelled = false
    ensureInstituteBundle()
      .then((b) => {
        if (!cancelled) setContact(b.profile.contact)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    function sync() {
      void fetchContact()
        .then((data) => {
          if (!cancelled) setContact(data)
        })
        .catch(() => {})
    }
    window.addEventListener(CONTACT_EVENT, sync)
    return () => {
      cancelled = true
      window.removeEventListener(CONTACT_EVENT, sync)
    }
  }, [])

  return {
    contact,
    loading,
    async save(next: InstituteContact) {
      const saved = await updateContact(next)
      setContact(saved)
      return saved
    },
  }
}

/** Contacto/horarios desde CMS; marca (nombre/eslogan) siempre estática. */
export function useInstituteProfile() {
  const cached = peekInstituteBundle()?.profile
  const [profile, setProfile] = useState<InstituteProfile>(
    () =>
      cached ?? {
        ...defaultProfile,
        contact: { ...defaultContact },
      },
  )
  const [loading, setLoading] = useState(() => !peekInstituteBundle())

  useEffect(() => {
    let cancelled = false
    ensureInstituteBundle()
      .then((b) => {
        if (!cancelled) setProfile(b.profile)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    function sync() {
      void ensureInstituteBundle(true)
        .then((b) => {
          if (!cancelled) setProfile(b.profile)
        })
        .catch(() => {})
    }
    window.addEventListener(CONTACT_EVENT, sync)
    return () => {
      cancelled = true
      window.removeEventListener(CONTACT_EVENT, sync)
    }
  }, [])

  return {
    profile,
    loading,
    async save(input: {
      hours: string
      contact: InstituteContact
      social: SocialLink[]
    }) {
      const saved = await saveInstituteBundle({
        name: defaultProfile.name,
        description: defaultProfile.description,
        hours: input.hours,
        contact: input.contact,
        social: input.social,
      })
      setProfile(saved)
      return saved
    },
  }
}
