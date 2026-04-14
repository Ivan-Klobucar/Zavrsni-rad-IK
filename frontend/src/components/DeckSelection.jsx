import React from 'react';

export default function DeckSelection({ onSelect }) {
    return (
        <div className="deck-selection">
            <h2>Izaberi svoj Deck</h2>
            <div className="deck-btn-group">
                <button onClick={() => onSelect('Mugi')} className="deck-btn">Structure Deck: Mugi</button>
                <button onClick={() => onSelect('Saiba')} className="deck-btn">Structure Deck: Saiba</button>
            </div>
        </div>
    );
}