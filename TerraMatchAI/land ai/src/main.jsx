import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Demo scaffolding: expose Auth, Location tracking, and a Map view alongside the main app
import AuthForm from './components/AuthForm.jsx'
import LocationTracker from './components/LocationTracker.jsx'
import MapView from './components/MapView.jsx'

function DemoShell() {
  return (
    <div style={{ display: 'flex', height: '100vh', gap: 12 }}>
      <div style={{ width: 360, padding: 12, overflowY: 'auto', borderRight: '1px solid #eee', background: '#fafafa' }}>
        <h3 style={{ marginTop: 0 }}>Quick Demo</h3>
        <AuthForm />
        <hr />
        <LocationTracker />
        <hr />
        <MapView />
      </div>

      <div style={{ flex: 1 }}>
        <App />
      </div>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DemoShell />
  </StrictMode>,
)
