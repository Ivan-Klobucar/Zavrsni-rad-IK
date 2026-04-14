import React from 'react';

export default function Customization({ onReady }) {
    const mockCards = ["Blue-Eyes White Dragon", "Dark Magician", "Pot of Greed", "Monster Reborn", "Mirror Force"];

    return (
        <div className="customization-container">
            <h1 className="customization-title">Customization Phase</h1>
            <p>Odaberi karte iz svog deka i postavi ih na polje (Mockup)</p>

            <div className="customization-layout">
                <div className="deck-section">
                    <h3>Tvoj Deck</h3>
                    {mockCards.map((card, index) => (
                        <div key={index} className="card-item">{card}</div>
                    ))}
                </div>

                <div className="deck-section">
                    <h3>Protivnikov Deck</h3>
                    {mockCards.slice(0, 3).map((card, index) => (
                        <div key={index} className="card-item">{card} (Enemy)</div>
                    ))}
                </div>
            </div>

            <button onClick={onReady} className="btn-primary">
                READY - Start Duel
            </button>
        </div>
    );
}