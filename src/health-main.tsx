import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import HealthBoard from './pages/HealthBoard.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HealthBoard />
  </StrictMode>,
)
