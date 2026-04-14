import React, { useState } from 'react';
import DeckSelection from './DeckSelection';
import Customization from './Customization';
import GameBoard from './board/GameBoard';

export default function GameFlow() {
    const [gameState, setGameState] = useState('selection');
    const [playerDeck, setPlayerDeck] = useState(null);

    const handleDeckSelect = (deckName) => {
        setPlayerDeck(deckName);
        setGameState('popup');
    };

    const handleReadyForGame = () => setGameState('playing');

    return (
        <div className="game-flow">
            {gameState === 'selection' && <DeckSelection onSelect={handleDeckSelect} />}

            {gameState === 'popup' && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Vrijeme je za personalizaciju!</h2>
                        <p>Sada ćete kostumizirati svoju i protivnikovu stranu polja koristeći odabrane dekove.</p>
                        <button onClick={() => setGameState('customization')} className="btn">Idemo</button>
                    </div>
                </div>
            )}

            {gameState === 'customization' && <Customization onReady={handleReadyForGame} />}

            {gameState === 'playing' && <GameBoard />}
        </div>
    );
}