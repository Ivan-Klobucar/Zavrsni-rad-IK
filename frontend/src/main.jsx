import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Ako imaš index.css za globalne stilove (npr. resetiranje margina), ostavi ovaj import.
// Ako nemaš, možeš ga slobodno obrisati.
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)