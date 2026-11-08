# Frontend · Portal y CMS del IFTS Nº2 de 20

SPA en React 19 + Vite + TypeScript. Incluye el portal público (Inicio, Ingreso, Carrera, Comunidad, Vida IFTS, Contacto) y el panel de administración en `/admin`.

## Requisitos

- Node.js 20 o superior (o Bun)

## Puesta en marcha

```powershell
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Abrir `http://localhost:5173`. El panel está en `http://localhost:5173/admin/login`.

`VITE_API_BASE_URL` define la API. Con la URL de producción (`https://ifts2-backend.onrender.com`) se usa el backend desplegado; vacía, el sitio funciona con datos de ejemplo guardados en el navegador.

## Build

```powershell
npm run build
npm run preview
```

La salida queda en `dist/`. `vercel.json` redirige todas las rutas a `index.html` para que la navegación de la SPA funcione al recargar.
