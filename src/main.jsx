import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/globals.css';

// Avoid StrictMode double-mount: it can create/destroy WebGL contexts and leave a black screen.
createRoot(document.getElementById('root')).render(<App />);
