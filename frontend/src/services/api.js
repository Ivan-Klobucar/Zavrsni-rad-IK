import axios from 'axios';

import { BACKEND_URL } from "../config/env.js";

const API_BASE = (BACKEND_URL || '').replace(/\/$/, '') + '/api';

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    }
});

// api koji sluzi za pozivanje metode iz kontrolera koji handela akcije sa spilom
export const deckAPI = {
    getByName: async (name) => {
        const response = await api.get(`/decks/${name}`);
        return response.data;
    },
};

const cleanUrl = (url) => url.replace(/([^:]\/)\/+/g, "$1");

// rijesava sve potrebne akcije ostale
export const gameAPI = {
    //zapocinje igru
    startGame: async (payload) => {

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

    // mijenja fazu dvoboja
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

    // odigravanje karte
    playCard: async (cardId, action, tributes = []) => {

        const params = new URLSearchParams();
        params.append('cardId', cardId);
        params.append('action', action);


        if (tributes && tributes.length > 0) {
            tributes.forEach(id => params.append('tributes', id));
        }

        const url = `${BACKEND_URL}/api/game/play?${params.toString()}`;
        const response = await fetch(cleanUrl(url), {
            method: 'POST'
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err || "Ilegalna akcija!");
        }
        return await response.json();
    },

    //napadanje cudovista
    attack: async (attackerId, targetId) => {
        const params = new URLSearchParams();
        params.append('attackerId', attackerId);

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

    // preuzimanje statistike
    downloadStatistics: async (boardData) => {
        const response = await fetch(cleanUrl(`${BACKEND_URL}/api/game/statistics/download`), {
            method: 'POST',
            headers: {
                'Accept': 'application/pdf',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(boardData)
        });

        if (!response.ok) {
            throw new Error("Greška pri preuzimanju statistike s backenda.");
        }

        return await response.blob();
    }
};

export default api;