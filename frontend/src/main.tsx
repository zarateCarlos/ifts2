import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './contact-bento.css'
import './admin-table.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
