import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/globals.css';

/**
 * Phase H — no React.StrictMode.
 * Double-mount in dev can exhaust WebGL contexts → black screen.
 */
createRoot(document.getElementById('root')).render(<App />);
