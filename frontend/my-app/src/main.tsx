// Polyfill'leri önce içe aktar
import './polyfills'

// React'ın StrictMode bileşenini içe aktarma
import { StrictMode } from 'react'
// React DOM'un createRoot fonksiyonunu içe aktarma
import { createRoot } from 'react-dom/client'
// CSS stillerini içe aktarma
import './index.css'
// Ana uygulama bileşenini içe aktarma
import App from './App.tsx'

// DOM'da 'root' ID'li elementi bulup React uygulamasını render etme
createRoot(document.getElementById('root')!).render(
  // StrictMode, geliştirme sırasında potansiyel sorunları tespit etmeye yardımcı olur
  <StrictMode>
    <App />
  </StrictMode>,
)
