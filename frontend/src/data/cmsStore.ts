import { useEffect, useState } from 'react'
import {
  fetchAutoridades,
  fetchCarreras,
  fetchDocumentos,
  fetchEnlaces,
  peekCached,
} from '../api/publicApi'
import type {
  AutoridadPublicaResponse,
  CarreraPublicaResponse,
  DocumentoPublicaResponse,
  EnlacePublicaResponse,
} from '../api/types'

function sortByOrden<T extends { orden?: number | null }>(data: T[]) {
  return [...data].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
}

export function useCarreras() {
  const [items, setItems] = useState<CarreraPublicaResponse[]>(
    () => peekCached('carreras') ?? [],
  )
  const [loading, setLoading] = useState(() => !peekCached('carreras'))

  useEffect(() => {
    let cancelled = false
    fetchCarreras()
      .then((data) => {
        if (!cancelled) setItems(data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { items, loading, primary: items[0] ?? null }
}

export function useEnlaces() {
  const cached = peekCached<EnlacePublicaResponse[]>('enlaces')
  const [items, setItems] = useState<EnlacePublicaResponse[]>(() =>
    cached ? sortByOrden(cached) : [],
  )
  const [loading, setLoading] = useState(() => !cached)

  useEffect(() => {
    let cancelled = false
    fetchEnlaces()
      .then((data) => {
        if (!cancelled) setItems(sortByOrden(data))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { items, loading }
}

export function useAutoridades() {
  const cached = peekCached<AutoridadPublicaResponse[]>('autoridades')
  const [items, setItems] = useState<AutoridadPublicaResponse[]>(() =>
    cached ? sortByOrden(cached) : [],
  )
  const [loading, setLoading] = useState(() => !cached)

  useEffect(() => {
    let cancelled = false
    fetchAutoridades()
      .then((data) => {
        if (!cancelled) setItems(sortByOrden(data))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { items, loading }
}

export function useDocumentos() {
  const [items, setItems] = useState<DocumentoPublicaResponse[]>(
    () => peekCached('documentos') ?? [],
  )
  const [loading, setLoading] = useState(() => !peekCached('documentos'))

  useEffect(() => {
    let cancelled = false
    fetchDocumentos()
      .then((data) => {
        if (!cancelled) setItems(data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { items, loading }
}
