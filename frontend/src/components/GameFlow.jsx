import React, { useState } from 'react';
import DeckSelection from './DeckSelection';
import Customization from './Customization';
import GameBoard from './board/GameBoard';

export default function GameFlow() {
    // Stanja: 'selection' -> 'popup' -> 'customization' -> 'playing'
    const [gameState, setGameState] = useState('selection');
    const [playerDeck, setPlayerDeck] = useState(null);

    const handleDeckSelect = (deckName) => {
        setPlayerDeck(deckName);
        setGameState('popup'); // Prikazujemo popup obavijest
    };

    const handlePopupAck = () => {
        setGameState('customization');
    };

    const handleReadyForGame = () => {
        // Ovdje bi išla logika za dijeljenje 5 karata, za sad samo mijenjamo stanje
        setGameState('playing');
    };

    return (
        <div style={{ width: '100vw', height: '100vh', backgroundColor: '#1a1a1a', color: 'white' }}>
            {gameState === 'selection' && <DeckSelection onSelect={handleDeckSelect} />}

            {gameState === 'popup' && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h2>Vrijeme je za personalizaciju!</h2>
                        <p>Sada ćete kostumizirati svoju i protivnikovu stranu polja koristeći odabrane dekove.</p>
                        <button onClick={handlePopupAck} style={styles.btn}>Idemo</button>
                    </div>
                </div>
            )}

            {gameState === 'customization' && <Customization onReady={handleReadyForGame} />}

            {gameState === 'playing' && <GameBoard />}
        </div>
    );
}

const styles = {
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: '#333', padding: '30px', borderRadius: '10px', textAlign: 'center' },
    btn: { padding: '10px 20px', cursor: 'pointer', marginTop: '15px' }
};