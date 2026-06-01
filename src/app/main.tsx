import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './themes/base.css'
import './themes/theme-entry.css'
import './layouts/layout.css'
import './components/components.css'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found')

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
