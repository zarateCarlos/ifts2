import type { SocialLink } from '../data/site'
import {
  defaultContact,
  defaultProfile,
  emptySocialSlots,
  type InstituteContact,
  type InstituteProfile,
} from '../data/siteSettings'
import { hasRemoteApi } from './config'
import { fetchInstitucion } from './publicApi'
import {
  adminGetInstitucion,
  adminSaveDatosSitio,
  adminSaveInstitucion,
  adminSetInstitucionEstado,
} from './adminCms'
import {
  institucionToContact,
  institucionToProfile,
  institucionToSocial,
} from './mappers'
import { isLoggedIn } from './authToken'
import type { DatosSitioRequest, InstitucionRequest } from './types'
import { invalidatePublicCache } from './publicCache'

export const CONTACT_EVENT = 'ifts2-institute-change'
export const SOCIAL_EVENT = 'ifts2-social-change'

type InstituteBundle = {
  profile: InstituteProfile
  social: SocialLink[]
}

let bundleCache: InstituteBundle | null = null
let bundleInflight: Promise<InstituteBundle> | null = null

function emitAll() {
  window.dispatchEvent(new Event(CONTACT_EVENT))
  window.dispatchEvent(new Event(SOCIAL_EVENT))
}

function brandProfile(remote: InstituteProfile): InstituteProfile {
  return {
    name: defaultProfile.name,
    description: defaultProfile.description,
    hours: remote.hours,
    contact: {
      phone: remote.contact.phone || defaultContact.phone,
      email: remote.contact.email || defaultContact.email,
      address: remote.contact.address || defaultContact.address,
      mapQuery: remote.contact.mapQuery || defaultContact.mapQuery,
      officialSite: remote.contact.officialSite || defaultContact.officialSite,
    },
  }
}

function buildDatosSitio(
  contact: InstituteContact,
  social: SocialLink[],
): DatosSitioRequest {
  const ig = social.find((l) => l.network === 'instagram')
  const fb = social.find((l) => l.network === 'facebook')
  return {
    direccion: contact.address,
    email: contact.email,
    telefono: contact.phone,
    busquedaMapa: contact.mapQuery,
    sitioOficialUrl: contact.officialSite,
    instagramUrl: ig?.href || '',
    instagramVisible: ig ? ig.visible !== false : false,
    facebookUrl: fb?.href || '',
    facebookVisible: fb ? fb.visible !== false : false,
  }
}

function fallbackBundle(): InstituteBundle {
  return {
    profile: { ...defaultProfile, contact: { ...defaultContact } },
    // Si falla la API, igual mostramos los fallbacks públicos (no ocultar todo).
    social: emptySocialSlots(),
  }
}

async function loadFromApi(): Promise<InstituteBundle | null> {
  if (!hasRemoteApi()) return null

  if (isLoggedIn()) {
    try {
      const admin = await adminGetInstitucion()
      if (admin) {
        return {
          profile: brandProfile(institucionToProfile(admin)),
          social: institucionToSocial(admin),
        }
      }
    } catch {
      /* try public */
    }
  }

  const pub = await fetchInstitucion()
  if (!pub) return null
  return {
    profile: brandProfile(institucionToProfile(pub)),
    social: institucionToSocial(pub),
  }
}

function setCache(bundle: InstituteBundle) {
  bundleCache = bundle
  return bundle
}

/** Lectura síncrona del cache (si ya se precargó). */
export function peekInstituteBundle(): InstituteBundle | null {
  return bundleCache
}

/** Una sola request compartida entre perfil y redes. */
export async function ensureInstituteBundle(
  force = false,
): Promise<InstituteBundle> {
  if (!force && bundleCache) return bundleCache
  if (!force && bundleInflight) return bundleInflight

  bundleInflight = loadFromApi()
    .then((remote) => setCache(remote ?? fallbackBundle()))
    .catch(() => setCache(fallbackBundle()))
    .finally(() => {
      bundleInflight = null
    })

  return bundleInflight
}

export async function fetchInstituteProfile(): Promise<InstituteProfile> {
  const bundle = await ensureInstituteBundle()
  return bundle.profile
}

export async function fetchContact(): Promise<InstituteContact> {
  const profile = await fetchInstituteProfile()
  return profile.contact
}

export async function updateContact(
  next: InstituteContact,
): Promise<InstituteContact> {
  if (!hasRemoteApi() || !isLoggedIn()) {
    throw new Error('Se requiere sesión admin y API configurada')
  }
  const social =
    (await ensureInstituteBundle()).social ?? emptySocialSlots()
  const saved = await adminSaveDatosSitio(buildDatosSitio(next, social))
  const contact = institucionToContact(saved)
  const nextContact = {
    phone: contact.phone || defaultContact.phone,
    email: contact.email || defaultContact.email,
    address: contact.address || defaultContact.address,
    mapQuery: contact.mapQuery || defaultContact.mapQuery,
    officialSite: contact.officialSite || defaultContact.officialSite,
  }
  const prev = bundleCache ?? fallbackBundle()
  setCache({
    profile: { ...prev.profile, contact: nextContact },
    social: prev.social,
  })
  invalidatePublicCache('institucion')
  emitAll()
  return nextContact
}

export async function saveInstituteBundle(input: {
  name: string
  description: string
  hours: string
  contact: InstituteContact
  social: SocialLink[]
}): Promise<InstituteProfile> {
  if (!hasRemoteApi() || !isLoggedIn()) {
    throw new Error('Se requiere sesión admin y API configurada')
  }

  const body: InstitucionRequest = {
    // Marca fija: no se edita en el panel; se manda para cumplir el API.
    nombre: defaultProfile.name,
    descripcion: input.description.trim() || defaultProfile.description,
    direccion: input.contact.address.trim() || defaultContact.address,
    email: input.contact.email.trim() || defaultContact.email,
    telefono: input.contact.phone.trim() || defaultContact.phone,
    horariosAtencion: input.hours.trim() || undefined,
  }

  await adminSaveInstitucion(body)
  let saved = await adminSaveDatosSitio(buildDatosSitio(input.contact, input.social))

  if (saved.estado !== 'PUBLICADA') {
    saved = await adminSetInstitucionEstado('PUBLICADA')
  }

  const fresh = (await adminGetInstitucion()) || saved
  const fromApi = institucionToProfile(fresh)
  const profile = brandProfile(fromApi)
  setCache({ profile, social: institucionToSocial(fresh) })
  invalidatePublicCache('institucion')
  emitAll()
  return profile
}

export async function fetchSocialLinks(): Promise<SocialLink[]> {
  const remote = await ensureInstituteBundle()
  return remote.social.length ? remote.social : emptySocialSlots()
}

export async function updateSocialLinks(
  links: SocialLink[],
): Promise<SocialLink[]> {
  if (!hasRemoteApi() || !isLoggedIn()) {
    throw new Error('Se requiere sesión admin y API configurada')
  }
  const contact =
    (await ensureInstituteBundle()).profile.contact ?? { ...defaultContact }
  const saved = await adminSaveDatosSitio(buildDatosSitio(contact, links))
  const social = institucionToSocial(saved)
  const prev = bundleCache ?? fallbackBundle()
  setCache({ profile: prev.profile, social })
  invalidatePublicCache('institucion')
  emitAll()
  return social
}
