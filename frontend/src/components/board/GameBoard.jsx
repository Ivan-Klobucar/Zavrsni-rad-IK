import React, { useState } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

const GameBoard = ({ boardData }) => {
    // Info panel stanje i faza igre
    const [hoveredCard, setHoveredCard] = useState(null);
    const [currentPhase, setCurrentPhase] = useState('MP1'); // Početna faza
    const phases = ['DP', 'SP', 'MP1', 'BP', 'MP2', 'EP'];

    if (!boardData) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Učitavanje polja...</div>;

    // Pomoćna komponenta za jedan "Slot" na polju
    const CardSlot = ({ card, type, isOpponent = false, label = "" }) => {
        const displayImg = card?.isFacedown ? '/images/cards/card_back.jpg' : card?.imageUrl;
        // Default slika za špilove
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
                {/* Oznaka za broj karata u groblju */}
                {type === 'gy' && label !== "" && (
                    <div style={{ position: 'absolute', bottom: '-20px', fontSize: '12px', color: 'white' }}>GY: {label}</div>
                )}
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#111', color: 'white' }}>

            {/* LIJEVI STUPAC: INFO PANEL (Isti kao u kastomizaciji) */}
            <div style={{ width: '25%', padding: '20px', borderLeft: '2px solid #444', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <h2 style={{ textAlign: 'center', borderBottom: '1px solid #444', paddingBottom: '10px' }}>Detalji Karte</h2>
                {hoveredCard ? (
                    <div>
                        <img src={`${BACKEND_URL}${hoveredCard.imageUrl}`} alt="hover" style={{ width: '100%', marginBottom: '15px', boxShadow: '0 4px 8px rgba(0,0,0,0.5)' }} />
                        <h2 style={{ margin: '0 0 10px 0', color: '#e5a822' }}>{hoveredCard.cardName}</h2>
                        <p><b>Tip:</b> {hoveredCard.cardType}</p>
                        {hoveredCard.cardType === 'MONSTER' && (
                            <p><b>ATK:</b> {hoveredCard.cardAttack} / <b>DEF:</b> {hoveredCard.cardDefense}</p>
                        )}
                        <p><b>Cijena:</b> {hoveredCard.cardCost}</p>
                        <p style={{ marginTop: '15px', fontStyle: 'italic', fontSize: '14px', lineHeight: '1.4' }}>{hoveredCard.cardEffect}</p>
                    </div>
                ) : (
                    <p style={{ color: '#888', textAlign: 'center', marginTop: '50px' }}>Prijeđi mišem preko karte na polju.</p>
                )}
            </div>

            {/* DESNI STUPAC: POLJE I FAZE */}
            <div style={{ width: '75%', display: 'flex', flexDirection: 'column' }}>

                {/* Traka s Fazama (Phase Bar) */}
                <div style={{ height: '60px', backgroundColor: '#222', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', borderBottom: '2px solid #444' }}>
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

                {/* Glavno Yu-Gi-Oh! Polje */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '40px', padding: '20px' }}>

                    {/* PROTIVNIKOVA STRANA (Rotirano) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* Protivnik Red 1: Deck, S/T, Extra */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <CardSlot type="deck" />
                            {boardStateHelper(boardData.opponent.spellTrapZone).reverse().map((card, i) => <CardSlot key={`ost-${i}`} card={card} isOpponent={true} label="S/T" />)}
                            <CardSlot type="extra" />
                        </div>
                        {/* Protivnik Red 2: GY, Monster, Field */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <CardSlot card={getTopGY(boardData.opponent.graveyard)} type="gy" isOpponent={true} label={boardData.opponent.graveyard.length} />
                            {boardStateHelper(boardData.opponent.monsterZone).reverse().map((card, i) => <CardSlot key={`om-${i}`} card={card} isOpponent={true} label="Mon" />)}
                            <CardSlot card={boardData.opponent.fieldZone} type="field" isOpponent={true} label="Field" />
                        </div>
                    </div>

                    <div style={{ width: '100%', height: '2px', backgroundColor: '#444', margin: '10px 0' }}></div>

                    {/* TVOJA STRANA */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {/* Tvoj Red 1: Field, Monster, GY */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <CardSlot card={boardData.player.fieldZone} type="field" label="Field" />
                            {boardStateHelper(boardData.player.monsterZone).map((card, i) => <CardSlot key={`pm-${i}`} card={card} label="Mon" />)}
                            <CardSlot card={getTopGY(boardData.player.graveyard)} type="gy" label={boardData.player.graveyard.length} />
                        </div>
                        {/* Tvoj Red 2: Extra, S/T, Deck */}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <CardSlot type="extra" />
                            {boardStateHelper(boardData.player.spellTrapZone).map((card, i) => <CardSlot key={`pst-${i}`} card={card} label="S/T" />)}
                            <CardSlot type="deck" />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

// Pomoćne funkcije za renderiranje
const boardStateHelper = (zoneArray) => {
    // Osigurava da uvijek imamo niz od točno 5 elemenata
    const arr = [...zoneArray];
    while (arr.length < 5) arr.push(null);
    return arr.slice(0, 5);
};

const getTopGY = (gyArray) => {
    if (!gyArray || gyArray.length === 0) return null;
    return gyArray[gyArray.length - 1];
};

export default GameBoard;