import axios from 'axios';

import { BACKEND_URL } from "../config/env.js";
// 1. Konfiguracija URL-a (kao u tvom drugom projektu)
// Ovo omogućuje da lako promijeniš backend adresu u .env fileu
const API_BASE = (BACKEND_URL || '').replace(/\/$/, '') + '/api';

// 2. Kreiranje Axios instance
const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    }
});

// 3. Centralizirane metode za tvoj projekt
export const deckAPI = {
    // Dohvaća deck po imenu (npr. 'Mugi' ili 'Saiba')
    getByName: async (name) => {
        const response = await api.get(`/decks/${name}`);
        return response.data; // Axios sprema podatke u .data
    },

    // Kasnije možemo dodati ostale rute
    saveGameState: async (state) => {
        const response = await api.post('/game-states', state);
        return response.data;
    }
};

// Pomoćna funkcija za sigurno spajanje URL-a
const cleanUrl = (url) => url.replace(/([^:]\/)\/+/g, "$1");

export const gameAPI = {
    startGame: async (payload) => {
        // Koristimo cleanUrl da spriječimo duple kose crte (//)
        const targetUrl = cleanUrl(`${BACKEND_URL}/api/game/start`);

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error("Greška na serveru pri pokretanju igre.");
        }

        return await response.json();
    }
};

export default api;