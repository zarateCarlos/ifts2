export type AdminToastKind = 'info' | 'success' | 'error' | 'loading'

export type AdminToast = {
  id: string
  kind: AdminToastKind
  title: string
  message?: string
  /** ms; 0 = sticky hasta dismiss (loading) */
  duration: number
}

type Listener = (toasts: AdminToast[]) => void

const EVENT = 'ifts2-admin-toast'
let toasts: AdminToast[] = []
const listeners = new Set<Listener>()

function emit() {
  const snapshot = [...toasts]
  listeners.forEach((l) => l(snapshot))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: snapshot }))
  }
}

export function subscribeAdminToasts(listener: Listener) {
  listeners.add(listener)
  listener([...toasts])
  return () => {
    listeners.delete(listener)
  }
}

export function dismissAdminToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

export function pushAdminToast(input: {
  kind: AdminToastKind
  title: string
  message?: string
  duration?: number
}): string {
  const id = `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
  const duration =
    input.duration ??
    (input.kind === 'loading' ? 0 : input.kind === 'error' ? 6500 : 4200)
  const toast: AdminToast = {
    id,
    kind: input.kind,
    title: input.title,
    message: input.message,
    duration,
  }
  toasts = [...toasts.slice(-4), toast]
  emit()
  if (duration > 0) {
    window.setTimeout(() => dismissAdminToast(id), duration)
  }
  return id
}

export function replaceAdminToast(
  id: string,
  input: {
    kind: AdminToastKind
    title: string
    message?: string
    duration?: number
  },
) {
  dismissAdminToast(id)
  return pushAdminToast(input)
}
