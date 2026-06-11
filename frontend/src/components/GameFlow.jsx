import React, { useState } from 'react';
import DeckSelection from './DeckSelection';
import Customization from './Customization';
import GameBoard from './board/GameBoard';
import { gameAPI } from '../services/api.js';

// handler koji gleda u kojem stanju igre se nalazimo
export default function GameFlow() {
    // inicijalizacija
    const [gameState, setGameState] = useState('selection');
    const [playerDeck, setPlayerDeck] = useState(null);
    const [boardData, setBoardData] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleDeckSelect = (deckName) => {
        setPlayerDeck(deckName);
        setGameState('popup');
    };

    // funkcija koja razgovara sa backendom da zapocne igru
    const handleReadyForGame = async (finalBoard) => {
        setLoading(true);
        try {
            const payload = {
                playerDeckName: playerDeck,
                player: finalBoard.player,
                opponent: finalBoard.opponent
            };

            const serverData = await gameAPI.startGame(payload);

            setBoardData(serverData);
            setGameState('playing');
        } catch (err) {
            console.error("Greška pri dohvaćanju GameState-a:", err);
            alert("Neuspješno pokretanje igre.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#111', color: '#e5a822', fontSize: '24px' }}>
                Učitavanje...
            </div>
        );
    }

    return (
        <div className="game-flow">
            {gameState === 'selection' && (
                <DeckSelection onSelect={handleDeckSelect} />
            )}

            {/* popup koji govori da idemo uredivat */}
            {gameState === 'popup' && (
                <div className="modal-overlay" style={modalStyle}>
                    <div className="modal-content" style={contentStyle}>
                        <h2>Sada ćete kostumizirati svoju i protivnikovu stranu polja</h2>
                        <p>Vaš dek: <b>{playerDeck}</b></p>
                        <button onClick={() => setGameState('customization')} style={btnStyle}>Idemo</button>
                    </div>
                </div>
            )}

            {/* personaliziramo spolje */}
            {gameState === 'customization' && (
                <Customization
                    selectedDeck={playerDeck}
                    onReady={handleReadyForGame}
                />
            )}

            {/* prelazimo na dvoboj */}
            {gameState === 'playing' && boardData && (
                <GameBoard
                    boardData={boardData}
                    onReset={() => {
                        setGameState('selection');
                        setPlayerDeck(null);
                        setBoardData(null);
                    }}
                />
            )}
        </div>
    );
}

const modalStyle = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const contentStyle = { backgroundColor: '#333', color: 'white', padding: '40px', borderRadius: '10px', textAlign: 'center' };
const btnStyle = { padding: '10px 20px', fontSize: '18px', backgroundColor: '#e5a822', color: 'black', border: 'none', cursor: 'pointer', marginTop: '20px', fontWeight: 'bold' };