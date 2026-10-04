import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/globals.css';

// Avoid StrictMode double-mount: can exhaust WebGL contexts → black screen.
createRoot(document.getElementById('root')).render(<App />);
