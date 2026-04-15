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

export default api;