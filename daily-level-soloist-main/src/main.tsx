import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Render the app directly without storage checks
createRoot(document.getElementById("root")!).render(<App />)
