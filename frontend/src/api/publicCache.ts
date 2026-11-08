/**
 * Cache en memoria + dedupe de requests públicas.
 * Evita refetch al navegar entre páginas (y en Vercel con API remota).
 */

type CacheEntry<T> = {
  data: T
  at: number
  inflight: Promise<T> | null
}

const store = new Map<string, CacheEntry<unknown>>()

const DEFAULT_TTL_MS = 90_000

export function peekCached<T>(key: string): T | undefined {
  const entry = store.get(key) as CacheEntry<T> | undefined
  return entry?.data
}

export function setCached<T>(key: string, data: T) {
  store.set(key, { data, at: Date.now(), inflight: null })
}

export function invalidatePublicCache(...keys: string[]) {
  if (!keys.length) {
    store.clear()
    return
  }
  for (const key of keys) {
    if (key.endsWith('*')) {
      const prefix = key.slice(0, -1)
      for (const k of [...store.keys()]) {
        if (k.startsWith(prefix)) store.delete(k)
      }
    } else {
      store.delete(key)
    }
  }
}

/** Una sola promesa compartida; sirve cache fresco o revalida en background. */
export function cachedFetch<T>(
  key: string,
  loader: () => Promise<T>,
  opts?: { ttlMs?: number; force?: boolean },
): Promise<T> {
  const ttl = opts?.ttlMs ?? DEFAULT_TTL_MS
  const existing = store.get(key) as CacheEntry<T> | undefined
  const fresh =
    existing && !opts?.force && Date.now() - existing.at < ttl
      ? existing.data
      : undefined

  if (fresh !== undefined) {
    // Revalidar en silencio si pasó la mitad del TTL
    if (Date.now() - existing!.at > ttl / 2 && !existing!.inflight) {
      const p = loader()
        .then((data) => {
          setCached(key, data)
          return data
        })
        .finally(() => {
          const cur = store.get(key) as CacheEntry<T> | undefined
          if (cur) cur.inflight = null
        })
      existing!.inflight = p
    }
    return Promise.resolve(fresh)
  }

  if (existing?.inflight && !opts?.force) return existing.inflight

  const p = loader()
    .then((data) => {
      setCached(key, data)
      return data
    })
    .finally(() => {
      const cur = store.get(key) as CacheEntry<T> | undefined
      if (cur) cur.inflight = null
    })

  store.set(key, {
    data: existing?.data as T,
    at: existing?.at ?? 0,
    inflight: p,
  })

  // Si había data vieja, devolverla ya (stale-while-revalidate)
  if (existing?.data !== undefined && !opts?.force) {
    return Promise.resolve(existing.data as T)
  }

  return p
}
