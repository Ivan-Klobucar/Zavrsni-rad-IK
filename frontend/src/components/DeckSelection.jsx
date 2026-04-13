import React from 'react';

export default function DeckSelection({ onSelect }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <h2>Izaberi svoj Deck</h2>
            <div style={{ display: 'flex', gap: '20px' }}>
                <button onClick={() => onSelect('Mugi')} style={{ padding: '20px', cursor: 'pointer' }}>Structure Deck: Mugi</button>
                <button onClick={() => onSelect('Saiba')} style={{ padding: '20px', cursor: 'pointer' }}>Structure Deck: Saiba</button>
            </div>
        </div>
    );
}