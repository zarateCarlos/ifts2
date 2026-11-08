import { institute, type SocialLink } from './site'

export type InstituteContact = {
  phone: string
  email: string
  address: string
  mapQuery: string
  officialSite: string
}

export type InstituteProfile = {
  name: string
  description: string
  hours: string
  contact: InstituteContact
}

/** Contacto por defecto (placeholders / fallback si el CMS no tiene datos). */
export const defaultContact: InstituteContact = {
  phone: institute.phone,
  email: institute.email,
  address: institute.address,
  mapQuery: `${institute.address}, Ciudad Autónoma de Buenos Aires, Argentina`,
  officialSite: institute.officialSite,
}

export const defaultProfile: InstituteProfile = {
  name: institute.name,
  description: institute.tagline,
  hours: '',
  contact: { ...defaultContact },
}

export function emptySocialSlots(): SocialLink[] {
  return [
    {
      id: 'instagram',
      network: 'instagram',
      label: 'Instagram',
      href: institute.instagramUrl,
      visible: true,
    },
    {
      id: 'facebook',
      network: 'facebook',
      label: 'Facebook',
      href: institute.facebookUrl,
      visible: true,
    },
  ]
}

export const MAX_FEATURED = 6

export const emptyContact = defaultContact
export const emptyProfile = defaultProfile
export const defaultSocialLinks = emptySocialSlots
