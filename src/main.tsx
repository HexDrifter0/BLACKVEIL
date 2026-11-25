import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './vite-env.d.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
)
