import React from 'react';

import { BACKEND_URL } from "../../config/env.js";

const GameBoard = ({ boardData }) => {
    if (!boardData) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Učitavanje polja...</div>;

    // Pomoćna funkcija za iscrtavanje niza od 5 zona
    const renderRow = (zones, isOpponent) => {
        return (
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                {zones.map((card, idx) => {
                    // Ako je protivnikova karta licem prema dolje (npr. trap)
                    const displayImg = card?.isFacedown ? '/images/cards/card_back.jpg' : card?.imageUrl;

                    return (
                        <div key={idx} style={{
                            width: '80px', height: '117px',
                            border: '2px solid #555', backgroundColor: 'rgba(0,0,0,0.5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {card && (
                                <img
                                    src={`${BACKEND_URL}${displayImg}`}
                                    alt="card"
                                    style={{
                                        width: '100%', height: '100%',
                                        // Rotiramo protivnikove karte da gledaju prema tebi
                                        transform: isOpponent && !card.isFacedown ? 'rotate(180deg)' : 'none'
                                    }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div style={{ backgroundColor: '#111', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', padding: '20px' }}>

            {/* --- PROTIVNIKOVA STRANA --- */}
            <div style={{ width: '80%', padding: '20px', border: '3px solid #e5a822', marginBottom: '20px', backgroundColor: '#222', position: 'relative' }}>
                <h3 style={{ position: 'absolute', top: '-15px', left: '20px', backgroundColor: '#111', padding: '0 10px', color: '#e5a822' }}>Protivnik</h3>

                {/* Groblje Protivnika (Gore desno) */}
                <div style={{ position: 'absolute', right: '20px', top: '20px', textAlign: 'center' }}>
                    <div style={{ width: '80px', height: '117px', border: '2px solid #888', backgroundColor: '#333' }}>
                        {boardData.opponent.graveyard.length > 0 && (
                            <img src={`${BACKEND_URL}${boardData.opponent.graveyard[boardData.opponent.graveyard.length - 1].imageUrl}`} alt="opp-gy" style={{ width: '100%', height: '100%', transform: 'rotate(180deg)' }} />
                        )}
                    </div>
                    <p>GY: {boardData.opponent.graveyard.length}</p>
                </div>

                <div style={{ marginBottom: '15px' }}>{renderRow(boardData.opponent.spellTrapZone, true)}</div>
                <div>{renderRow(boardData.opponent.monsterZone, true)}</div>
            </div>

            {/* --- TVOJA STRANA --- */}
            <div style={{ width: '80%', padding: '20px', border: '3px solid #007bff', backgroundColor: '#222', position: 'relative' }}>
                <h3 style={{ position: 'absolute', bottom: '-15px', right: '20px', backgroundColor: '#111', padding: '0 10px', color: '#007bff' }}>Ti</h3>

                {/* Tvoje Groblje (Dolje desno) */}
                <div style={{ position: 'absolute', right: '20px', bottom: '20px', textAlign: 'center' }}>
                    <p>GY: {boardData.player.graveyard.length}</p>
                    <div style={{ width: '80px', height: '117px', border: '2px solid #888', backgroundColor: '#333' }}>
                        {boardData.player.graveyard.length > 0 && (
                            <img src={`${BACKEND_URL}${boardData.player.graveyard[boardData.player.graveyard.length - 1].imageUrl}`} alt="plr-gy" style={{ width: '100%', height: '100%' }} />
                        )}
                    </div>
                </div>

                <div style={{ marginBottom: '15px' }}>{renderRow(boardData.player.monsterZone, false)}</div>
                <div>{renderRow(boardData.player.spellTrapZone, false)}</div>
            </div>

        </div>
    );
};

export default GameBoard;