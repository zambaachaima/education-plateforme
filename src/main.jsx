import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'; // global base styles
import './app.css';   // component/page styles
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
