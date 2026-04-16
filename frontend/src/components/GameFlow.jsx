import React, { useState } from 'react';
import DeckSelection from './DeckSelection'; // Tvoj ekran za odabir
import Customization from './Customization';
import GameBoard from './board/GameBoard';

export default function GameFlow() {
    const [gameState, setGameState] = useState('selection');
    const [playerDeck, setPlayerDeck] = useState(null);
    const [boardData, setBoardData] = useState(null);

    const handleDeckSelect = (deckName) => {
        setPlayerDeck(deckName);
        setGameState('popup');
    };

    const handleReadyForGame = (finalBoard) => {
        setBoardData(finalBoard);
        setGameState('playing');
    };

    return (
        <div className="game-flow">
            {gameState === 'selection' && (
                <DeckSelection onSelect={handleDeckSelect} />
            )}

            {gameState === 'popup' && (
                <div className="modal-overlay" style={modalStyle}>
                    <div className="modal-content" style={contentStyle}>
                        <h2>Vrijeme je za personalizaciju!</h2>
                        <p>Sada ćete kostumizirati svoju i protivnikovu stranu polja.</p>
                        <p>Vaš dek: <b>{playerDeck}</b></p>
                        <button onClick={() => setGameState('customization')} style={btnStyle}>Idemo</button>
                    </div>
                </div>
            )}

            {gameState === 'customization' && (
                <Customization
                    selectedDeck={playerDeck}
                    onReady={handleReadyForGame}
                />
            )}

            {gameState === 'playing' && (
                <GameBoard boardData={boardData} />
            )}
        </div>
    );
}

// Brzi inline stilovi za popup (možeš ih prebaciti u CSS)
const modalStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const contentStyle = { backgroundColor: '#333', color: 'white', padding: '40px', borderRadius: '10px', textAlign: 'center' };
const btnStyle = { padding: '10px 20px', fontSize: '18px', backgroundColor: '#e5a822', color: 'black', border: 'none', cursor: 'pointer', marginTop: '20px', fontWeight: 'bold' };