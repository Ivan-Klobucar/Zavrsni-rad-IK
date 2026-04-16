import React, { useState } from 'react';
import DeckSelection from './DeckSelection';
import Customization from './Customization';
import GameBoard from './board/GameBoard';
import { gameAPI } from '../services/api.js'; // Uvozimo gameAPI

export default function GameFlow() {
    const [gameState, setGameState] = useState('selection');
    const [playerDeck, setPlayerDeck] = useState(null);
    const [boardData, setBoardData] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleDeckSelect = (deckName) => {
        setPlayerDeck(deckName);
        setGameState('popup');
    };

    const handleReadyForGame = async (finalBoard) => {
        setLoading(true);
        try {
            // Slažemo payload za backend
            const payload = {
                playerDeckName: playerDeck,
                player: finalBoard.player,
                opponent: finalBoard.opponent
            };

            // Pozivamo naš centralizirani API
            const serverData = await gameAPI.startGame(payload);

            setBoardData(serverData);
            setGameState('playing');
        } catch (err) {
            console.error("Greška pri dohvaćanju GameState-a:", err);
            alert("Neuspješno pokretanje igre. Provjeri radi li backend.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#111', color: '#e5a822', fontSize: '24px' }}>
                Miješanje karata i priprema dvoboja...
            </div>
        );
    }

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

            {gameState === 'playing' && boardData && (
                <GameBoard boardData={boardData} />
            )}
        </div>
    );
}

const modalStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const contentStyle = { backgroundColor: '#333', color: 'white', padding: '40px', borderRadius: '10px', textAlign: 'center' };
const btnStyle = { padding: '10px 20px', fontSize: '18px', backgroundColor: '#e5a822', color: 'black', border: 'none', cursor: 'pointer', marginTop: '20px', fontWeight: 'bold' };