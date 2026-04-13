import React from 'react';

// Dodaj 'export default' ispred function
export default function CardHover() {
    return (
        <div style={{ color: 'white' }}>
            <h3>Detalji karte</h3>
            <p>Hoveraj preko karte da vidiš opis...</p>
            {/* Ovdje će kasnije ići slika u punoj veličini */}
            <div style={{ width: '100%', aspectRatio: '2/3', border: '1px solid #555' }}></div>
        </div>
    );
}