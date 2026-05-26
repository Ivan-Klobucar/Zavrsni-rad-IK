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
    },

// Ažuriran changePhase s URLSearchParams
    changePhase: async (phase) => {
        const params = new URLSearchParams();
        params.append('phase', phase);

        const url = `${BACKEND_URL}/api/game/phase?${params.toString()}`;

        const response = await fetch(cleanUrl(url), {
            method: 'POST'
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || "Greška pri promjeni faze!");
        }
        return await response.json();
    },

    playCard: async (cardId, action, tributes = []) => {
// Koristimo URLSearchParams za ispravno kodiranje parametara
        const params = new URLSearchParams();
        params.append('cardId', cardId);
        params.append('action', action);

        // Šaljemo tributes samo ako ih ima, Spring će ih prepoznati kao listu
        if (tributes && tributes.length > 0) {
            tributes.forEach(id => params.append('tributes', id));
        }

        const url = `${BACKEND_URL}/api/game/play?${params.toString()}`;
        console.log("Šaljem zahtjev na:", url); // OVO POGLEDAJ U KONZOLI PREGLEDNIKA (F12)
        const response = await fetch(cleanUrl(url), {
            method: 'POST' // Mora biti POST jer je u kontroleru @PostMapping
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || "Ilegalna akcija!");
        }
        return await response.json();
    },

// Ažuriran attack s URLSearchParams
    attack: async (attackerId, targetId) => {
        const params = new URLSearchParams();
        params.append('attackerId', attackerId);

        // TargetId dodajemo samo ako nije null (npr. kod direktnog napada je null)
        if (targetId) {
            params.append('targetId', targetId);
        }

        const url = `${BACKEND_URL}/api/game/attack?${params.toString()}`;

        const response = await fetch(cleanUrl(url), {
            method: 'POST'
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || "Neuspješan napad!");
        }
        return await response.json();
    },

    downloadStatistics: async (boardData) => {
        const response = await fetch('http://localhost:8080/api/game/statistics/download', {
            method: 'POST', // Promijenjeno u POST
            headers: {
                'Accept': 'application/pdf',
                'Content-Type': 'application/json' // Govorimo backendu da šaljemo JSON
            },
            body: JSON.stringify(boardData) // Šaljemo trenutno stanje igre
        });

        if (!response.ok) {
            throw new Error("Greška pri preuzimanju statistike s backenda.");
        }

        return await response.blob();
    }
};

export default api;