# IFTS Nº2 de 20 · Portal institucional y CMS

Proyecto de Unknown Team para el Instituto de Formación Técnica Superior Nº2 de 20.

## Estructura

```
frontend/   portal público y panel de administración (React + Vite)
backend/    API REST (Spring Boot 3.5 · Java 21 · PostgreSQL · Flyway)
```

## Aplicación desplegada

- Portal: https://ifts2.vercel.app
- Panel: https://ifts2.vercel.app/admin/login
- API: https://ifts2-backend.onrender.com

## Backend

Requisitos: JDK 21 y PostgreSQL.

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

La API queda en `http://localhost:8080`. Variables, primer usuario administrador y migraciones: [backend/README.md](backend/README.md).

Pruebas: `.\mvnw.cmd test`.

## Frontend

Requisitos: Node.js 20 o superior.

```powershell
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

El sitio queda en `http://localhost:5173`. Para usar la API local, poner `VITE_API_BASE_URL=http://localhost:8080` en `.env.local`. Detalle en [frontend/README.md](frontend/README.md).
