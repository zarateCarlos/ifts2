import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PublicLayout } from './components/PublicLayout'
import { HomePage } from './pages/HomePage'
import { IngresoPage } from './pages/IngresoPage'
import { CarreraPage } from './pages/CarreraPage'
import {
  AlumnosPage,
  ComunidadPage,
  DocentesPage,
  TutoriaPage,
} from './pages/ComunidadPage'
import {
  GaleriaPage,
  NoticiaDetallePage,
  NoticiasPage,
  VidaPage,
} from './pages/VidaPages'
import { ContactoPage } from './pages/ContactoPage'
import { NotFoundPage } from './pages/NotFoundPage'
import {
  AdminAjustesPage,
  AdminDashboardPage,
  AdminDatosPage,
  AdminLayout,
  AdminLoginPage,
  AdminRedesPage,
  AdminSinAccesoPage,
} from './pages/AdminPages'
import { AdminContenidoPage } from './pages/AdminContenidoPage'
import { AdminConfiguracionPage } from './pages/AdminConfiguracionPage'
import { AdminMiCuentaPage } from './pages/AdminMiCuentaPage'
import {
  AdminGaleriaPage,
  AdminNoticiasPage,
} from './pages/AdminEventosPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="ingreso" element={<IngresoPage />} />
          <Route path="carrera" element={<CarreraPage />} />
          <Route path="comunidad" element={<ComunidadPage />}>
            <Route path="docentes" element={<DocentesPage />} />
            <Route path="alumnos" element={<AlumnosPage />} />
            <Route path="tutoria" element={<TutoriaPage />} />
          </Route>
          <Route path="vida" element={<VidaPage />}>
            <Route path="noticias" element={<NoticiasPage />} />
            <Route path="noticias/:id" element={<NoticiaDetallePage />} />
            <Route path="galeria" element={<GaleriaPage />} />
            <Route path="redes" element={<Navigate to="/vida" replace />} />
            <Route path="instagram" element={<Navigate to="/vida" replace />} />
          </Route>
          <Route path="contacto" element={<ContactoPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="login" element={<AdminLoginPage />} />
          <Route path="configuracion" element={<AdminConfiguracionPage />} />
          <Route path="mi-cuenta" element={<AdminMiCuentaPage />} />
          <Route path="sin-acceso" element={<AdminSinAccesoPage />} />
          <Route path="ajustes" element={<AdminAjustesPage />} />
          <Route path="datos" element={<AdminDatosPage />} />
          <Route path="contenido" element={<AdminContenidoPage />} />
          <Route
            path="eventos"
            element={<Navigate to="/admin/contenido?filtro=eventos" replace />}
          />
          <Route path="noticias" element={<AdminNoticiasPage />} />
          <Route path="galeria" element={<AdminGaleriaPage />} />
          <Route path="redes" element={<AdminRedesPage />} />
          <Route path="instagram" element={<AdminRedesPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
