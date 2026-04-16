import React, { useState } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

const GameBoard = ({ boardData }) => {
    const [hoveredCard, setHoveredCard] = useState(null);
    const [currentPhase, setCurrentPhase] = useState(boardData?.currentPhase || 'MP1');
    const phases = ['DP', 'SP', 'MP1', 'BP', 'MP2', 'EP'];

    if (!boardData) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Učitavanje polja...</div>;

    const CardSlot = ({ card, type, isOpponent = false, label = "" }) => {
        const displayImg = card?.isFacedown ? '/images/cards/card_back.jpg' : card?.imageUrl;
        const bgImage = (type === 'deck' || type === 'extra') && !card ? `url(${BACKEND_URL}/images/cards/card_back.jpg)` : 'none';

        return (
            <div
                onMouseEnter={() => card && setHoveredCard(card)}
                style={{
                    width: '75px', height: '110px',
                    border: '2px solid #555', backgroundColor: '#222',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                    backgroundImage: bgImage, backgroundSize: 'cover'
                }}
            >
                {label && !card && type !== 'deck' && type !== 'extra' && (
                    <span style={{ color: '#555', fontSize: '12px', fontWeight: 'bold', position: 'absolute' }}>{label}</span>
                )}
                {card && (
                    <img
                        src={`${BACKEND_URL}${displayImg}`}
                        alt="card"
                        style={{
                            width: '100%', height: '100%',
                            transform: isOpponent && !card.isFacedown ? 'rotate(180deg)' : 'none',
                            objectFit: 'cover'
                        }}
                    />
                )}
                {type === 'gy' && label !== "" && (
                    <div style={{ position: 'absolute', bottom: '-20px', fontSize: '12px', color: 'white' }}>GY: {label}</div>
                )}
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#111', color: 'white' }}>

            {/* LIJEVI STUPAC: INFO PANEL */}
            <div style={{ width: '25%', padding: '20px', borderRight: '2px solid #444', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <h2 style={{ textAlign: 'center', borderBottom: '1px solid #444', paddingBottom: '10px' }}>Detalji Karte</h2>
                {hoveredCard ? (
                    <div>
                        <img src={`${BACKEND_URL}${hoveredCard.imageUrl}`} alt="hover" style={{ width: '100%', marginBottom: '15px', boxShadow: '0 4px 8px rgba(0,0,0,0.5)' }} />
                        <h2 style={{ margin: '0 0 10px 0', color: '#e5a822' }}>{hoveredCard.cardName}</h2>
                        <p><b>Tip:</b> {hoveredCard.cardType}</p>
                        {hoveredCard.cardType === 'MONSTER' && (
                            <p><b>ATK:</b> {hoveredCard.cardAttack} / <b>DEF:</b> {hoveredCard.cardDefense}</p>
                        )}
                        {/* Ako želiš prikazati dodatne podatke poput cijene ili efekta */}
                        {hoveredCard.cardCost && <p><b>Cijena:</b> {hoveredCard.cardCost}</p>}
                        <p style={{ marginTop: '15px', fontStyle: 'italic', fontSize: '14px', lineHeight: '1.4' }}>{hoveredCard.cardEffect}</p>
                    </div>
                ) : (
                    <p style={{ color: '#888', textAlign: 'center', marginTop: '50px' }}>Prijeđi mišem preko karte na polju ili u ruci.</p>
                )}
            </div>

            {/* DESNI STUPAC: POLJE I FAZE */}
            <div style={{ width: '75%', display: 'flex', flexDirection: 'column' }}>

                {/* STATUS BAR: LP i Faze */}
                <div style={{ height: '60px', backgroundColor: '#222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', borderBottom: '2px solid #444' }}>
                    <div style={{ color: 'red', fontWeight: 'bold', fontSize: '18px' }}>
                        SAIBA LP: {boardData.opponent.lifePoints}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        {phases.map(phase => (
                            <button
                                key={phase}
                                onClick={() => setCurrentPhase(phase)}
                                style={{
                                    padding: '8px 20px', fontSize: '16px', fontWeight: 'bold', border: 'none', cursor: 'pointer', borderRadius: '5px',
                                    backgroundColor: currentPhase === phase ? '#e5a822' : '#333',
                                    color: currentPhase === phase ? 'black' : 'white',
                                    transition: '0.3s'
                                }}
                            >
                                {phase}
                            </button>
                        ))}
                    </div>

                    <div style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '18px' }}>
                        TVOJ LP: {boardData.player.lifePoints}
                    </div>
                </div>

                {/* ARENA */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px' }}>

                    {/* PROTIVNIKOVA RUKA */}
                    <div style={{ display: 'flex', gap: '10px', height: '80px', alignItems: 'flex-start' }}>
                        {boardData.opponent.hand.map((_, i) => (
                            <div key={`oh-${i}`} style={{ width: '55px', height: '80px', border: '1px solid #555', backgroundColor: '#111' }}>
                                <img src={`${BACKEND_URL}/images/cards/card_back.jpg`} alt="back" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        ))}
                    </div>

                    {/* GLAVNO POLJE */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {/* Protivnikova strana */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <CardSlot type="deck" />
                                {boardStateHelper(boardData.opponent.spellTrapZone).reverse().map((card, i) => <CardSlot key={`ost-${i}`} card={card} isOpponent={true} label="S/T" />)}
                                <CardSlot type="extra" />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <CardSlot card={getTopGY(boardData.opponent.graveyard)} type="gy" isOpponent={true} label={boardData.opponent.graveyard.length} />
                                {boardStateHelper(boardData.opponent.monsterZone).reverse().map((card, i) => <CardSlot key={`om-${i}`} card={card} isOpponent={true} label="Mon" />)}
                                <CardSlot card={boardData.opponent.fieldZone} type="field" isOpponent={true} label="Field" />
                            </div>
                        </div>

                        <div style={{ width: '100%', height: '2px', backgroundColor: '#444', margin: '5px 0' }}></div>

                        {/* Tvoja strana */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <CardSlot card={boardData.player.fieldZone} type="field" label="Field" />
                                {boardStateHelper(boardData.player.monsterZone).map((card, i) => <CardSlot key={`pm-${i}`} card={card} label="Mon" />)}
                                <CardSlot card={getTopGY(boardData.player.graveyard)} type="gy" label={boardData.player.graveyard.length} />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <CardSlot type="extra" />
                                {boardStateHelper(boardData.player.spellTrapZone).map((card, i) => <CardSlot key={`pst-${i}`} card={card} label="S/T" />)}
                                <CardSlot type="deck" />
                            </div>
                        </div>
                    </div>

                    {/* TVOJA RUKA */}
                    <div style={{ display: 'flex', gap: '10px', height: '110px', alignItems: 'flex-end', marginTop: '10px' }}>
                        {boardData.player.hand.map((card, i) => (
                            <div
                                key={`ph-${i}`}
                                onMouseEnter={() => setHoveredCard(card)}
                                style={{ width: '75px', height: '110px', cursor: 'pointer', transition: 'transform 0.2s' }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-15px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <img src={`${BACKEND_URL}${card.imageUrl}`} alt="hand" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px', border: '1px solid #888' }} />
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
};

// Pomoćne funkcije za renderiranje
const boardStateHelper = (zoneArray) => {
    const arr = [...(zoneArray || [])];
    while (arr.length < 5) arr.push(null);
    return arr.slice(0, 5);
};

const getTopGY = (gyArray) => {
    if (!gyArray || gyArray.length === 0) return null;
    return gyArray[gyArray.length - 1];
};

export default GameBoard;