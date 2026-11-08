import { Navigate } from 'react-router-dom'
import { isAuthed } from './admin/adminAuth'

/** Configuración vive en Mi cuenta (más simple). */
export function AdminConfiguracionPage() {
  if (!isAuthed()) return <Navigate to="/admin/login" replace />
  return <Navigate to="/admin/mi-cuenta" replace />
}
