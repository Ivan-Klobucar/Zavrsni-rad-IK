import React from 'react';
// Pazi na putanju! Ovisno o tome gdje si stavio GameFlow.jsx u odnosu na App.jsx
import GameFlow from './components/GameFlow';

function App() {
    return (
        // Ovaj div osigurava da cijela aplikacija nema neželjene margine
        // i da zauzima cijeli ekran, pripremajući teren za GameFlow.
        <div style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
            <GameFlow />
        </div>
    );
}

export default App;