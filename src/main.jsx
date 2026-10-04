import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/globals.css';

// No StrictMode — double-mount can exhaust WebGL contexts and cause a black canvas.
createRoot(document.getElementById('root')).render(<App />);
