import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Recipes from './pages/Recipes.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Recipes />
  </StrictMode>,
)
