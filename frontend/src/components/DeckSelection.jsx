import React from 'react';
import '../styles/Customization.css'; // Obavezno dodaj import!

export default function DeckSelection({ onSelect }) {
    return (
        <div className="deck-selection-container">
            <h1 className="deck-title">Deck Tester</h1>
            <h2 className="deck-subtitle">Izaberi svoj Deck za simulaciju dvoboja</h2>

            <div className="deck-btn-group">
                <button onClick={() => onSelect('Mugi')} className="deck-btn">
                    Structure Deck: MUGI
                </button>
                <button onClick={() => onSelect('Saiba')} className="deck-btn">
                    Structure Deck: SAIBA
                </button>
            </div>
        </div>
    );
}