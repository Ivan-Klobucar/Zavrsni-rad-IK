import React, { useState, useEffect } from 'react';
import { deckAPI } from '../services/api.js';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

// Dodan fieldZone za Field Spells
const emptyBoardSide = () => ({
    fieldZone: null,
    monsterZone: [null, null, null, null, null],
    spellTrapZone: [null, null, null, null, null],
    graveyard: []
});

const Customization = ({ selectedDeck, onReady }) => {
    const opponentDeckName = selectedDeck === 'Mugi' ? 'Saiba' : 'Mugi';

    const [playerDeckData, setPlayerDeckData] = useState(null);
    const [opponentDeckData, setOpponentDeckData] = useState(null);

    const [activeSide, setActiveSide] = useState('player');
    const [hoveredCard, setHoveredCard] = useState(null);
    const [selectedCardToPlace, setSelectedCardToPlace] = useState(null);

    const [boardState, setBoardState] = useState({
        player: emptyBoardSide(),
        opponent: emptyBoardSide()
    });

    useEffect(() => {
        const fetchDecks = async () => {
            try {
                const pDeck = await deckAPI.getByName(selectedDeck);
                const oDeck = await deckAPI.getByName(opponentDeckName);
                setPlayerDeckData(pDeck);
                setOpponentDeckData(oDeck);
            } catch (err) {
                console.error("Greška pri dohvaćanju dekova:", err);
            }
        };
        fetchDecks();
    }, [selectedDeck, opponentDeckName]);

    // Ažurirano brojanje da uključuje Field Zone
    const getCountOnBoard = (cardId, side) => {
        let count = 0;
        const countCard = (c) => { if (c && c.cardId === cardId) count++; };

        if (boardState[side].fieldZone?.cardId === cardId) count++;
        boardState[side].monsterZone.forEach(countCard);
        boardState[side].spellTrapZone.forEach(countCard);
        boardState[side].graveyard.forEach(countCard);

        return count;
    };

    const handleDeckCardClick = (deckCard) => {
        const cardId = deckCard.card.cardId;
        const maxQuantity = deckCard.quantity;
        const currentlyPlaced = getCountOnBoard(cardId, activeSide);

        if (currentlyPlaced >= maxQuantity) {
            alert(`Dosegnut je limit! Nemate više karata '${deckCard.card.cardName}' u deku.`);
            return;
        }
        setSelectedCardToPlace(deckCard.card);
    };

    const handleZoneClick = (zoneType, index = null) => {
        if (!selectedCardToPlace) {
            const newBoard = { ...boardState };
            if (index !== null && newBoard[activeSide][zoneType][index]) {
                newBoard[activeSide][zoneType][index] = null;
                setBoardState(newBoard);
            } else if (index === null && newBoard[activeSide][zoneType]) {
                newBoard[activeSide][zoneType] = null;
                setBoardState(newBoard);
            }
            return;
        }

        if (selectedCardToPlace.cardType === 'MONSTER' && zoneType !== 'monsterZone') {
            alert("Čudovišta moraju ići u Monster zonu!"); return;
        }
        // U pravilu, samo SPELL karte mogu ići u Field Zone (idealno type Field, ali ovdje generaliziramo)
        if (zoneType === 'fieldZone' && selectedCardToPlace.cardType !== 'SPELL') {
            alert("Samo Spell karte mogu u Field Zonu!"); return;
        }
        if ((selectedCardToPlace.cardType === 'SPELL' || selectedCardToPlace.cardType === 'TRAP') && zoneType !== 'spellTrapZone' && zoneType !== 'fieldZone') {
            alert("Spell i Trap karte idu u S/T ili Field zonu!"); return;
        }

        const isOccupied = index !== null ? boardState[activeSide][zoneType][index] !== null : boardState[activeSide][zoneType] !== null;
        if (isOccupied) {
            alert("Ova zona je već zauzeta!"); return;
        }

        const cardToPlace = { ...selectedCardToPlace, isFacedown: selectedCardToPlace.cardType === 'TRAP' };
        const newBoard = { ...boardState };

        if (index !== null) newBoard[activeSide][zoneType][index] = cardToPlace;
        else newBoard[activeSide][zoneType] = cardToPlace;

        setBoardState(newBoard);
        setSelectedCardToPlace(null);
    };

    const handleGraveyardClick = () => {
        if (!selectedCardToPlace) {
            const newBoard = { ...boardState };
            if (newBoard[activeSide].graveyard.length > 0) {
                newBoard[activeSide].graveyard.pop();
                setBoardState(newBoard);
            }
            return;
        }

        const newBoard = { ...boardState };
        newBoard[activeSide].graveyard.push({ ...selectedCardToPlace, isFacedown: false });
        setBoardState(newBoard);
        setSelectedCardToPlace(null);
    };

    if (!playerDeckData || !opponentDeckData) return <div style={{color: 'white', padding: '20px'}}>Učitavanje dekova...</div>;

    const activeDeck = activeSide === 'player' ? playerDeckData : opponentDeckData;

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#1a1a1a', color: 'white' }}>
            {/* LIJEVI STUPAC: DECK */}
            <div style={{ width: '25%', overflowY: 'auto', padding: '10px', borderRight: '2px solid #444' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <button onClick={() => { setActiveSide('player'); setSelectedCardToPlace(null); }} style={{ padding: '10px', backgroundColor: activeSide === 'player' ? '#e5a822' : '#444', color: activeSide === 'player' ? 'black' : 'white', fontWeight: 'bold', cursor: 'pointer', flex: 1, border: 'none' }}>Tvoja Strana</button>
                    <button onClick={() => { setActiveSide('opponent'); setSelectedCardToPlace(null); }} style={{ padding: '10px', backgroundColor: activeSide === 'opponent' ? '#e5a822' : '#444', color: activeSide === 'opponent' ? 'black' : 'white', fontWeight: 'bold', cursor: 'pointer', flex: 1, border: 'none' }}>Protivnik</button>
                </div>
                <h3 style={{ textAlign: 'center', color: '#e5a822' }}>{activeDeck.deckName} Deck</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {activeDeck.deckCards.map(dc => {
                        const remaining = dc.quantity - getCountOnBoard(dc.card.cardId, activeSide);
                        return (
                            <div key={dc.card.cardId} onClick={() => handleDeckCardClick(dc)} onMouseEnter={() => setHoveredCard(dc.card)} style={{ cursor: remaining > 0 ? 'pointer' : 'not-allowed', opacity: remaining > 0 ? 1 : 0.3, border: selectedCardToPlace?.cardId === dc.card.cardId ? '3px solid #e5a822' : '2px solid transparent' }}>
                                <img src={`${BACKEND_URL}${dc.card.imageUrl}`} alt="card" style={{ width: '100%' }} />
                                <div style={{ textAlign: 'center', fontSize: '12px' }}>Preostalo: {remaining}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* SREDINA: BOARD BUILDER */}
            <div style={{ width: '50%', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h2>Uređuješ: {activeSide === 'player' ? 'Svoju stranu' : 'Protivnikovu stranu'}</h2>
                {selectedCardToPlace && <div style={{ color: '#e5a822', marginBottom: '10px', fontWeight: 'bold' }}>U ruci: {selectedCardToPlace.cardName}</div>}

                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'flex-end' }}>
                    {/* Field Zone */}
                    <div>
                        <h5 style={{ margin: '0 0 5px 0', textAlign: 'center' }}>Field</h5>
                        <div onClick={() => handleZoneClick('fieldZone')} onMouseEnter={() => boardState[activeSide].fieldZone && setHoveredCard(boardState[activeSide].fieldZone)} style={{ width: '70px', height: '102px', border: '2px solid #00f', cursor: 'pointer', backgroundColor: '#222' }}>
                            {boardState[activeSide].fieldZone && <img src={`${BACKEND_URL}${boardState[activeSide].fieldZone.imageUrl}`} alt="field" style={{ width: '100%', height: '100%' }} />}
                        </div>
                    </div>

                    {/* Monster & S/T */}
                    <div>
                        <h4 style={{ margin: '0 0 5px 0', textAlign: 'center' }}>Monster Zona</h4>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            {boardState[activeSide].monsterZone.map((card, idx) => (
                                <div key={`m-${idx}`} onClick={() => handleZoneClick('monsterZone', idx)} onMouseEnter={() => card && setHoveredCard(card)} style={{ width: '70px', height: '102px', border: '2px dashed #666', cursor: 'pointer', backgroundColor: '#222' }}>
                                    {card && <img src={`${BACKEND_URL}${card.imageUrl}`} alt="monster" style={{ width: '100%', height: '100%' }} />}
                                </div>
                            ))}
                        </div>
                        <h4 style={{ margin: '0 0 5px 0', textAlign: 'center' }}>Spell / Trap Zona</h4>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {boardState[activeSide].spellTrapZone.map((card, idx) => (
                                <div key={`st-${idx}`} onClick={() => handleZoneClick('spellTrapZone', idx)} onMouseEnter={() => card && setHoveredCard(card)} style={{ width: '70px', height: '102px', border: '2px dashed #666', cursor: 'pointer', backgroundColor: '#222' }}>
                                    {card && <img src={`${BACKEND_URL}${card?.isFacedown ? '/images/cards/card_back.jpg' : card.imageUrl}`} alt="s/t" style={{ width: '100%', height: '100%' }} />}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Groblje */}
                    <div onClick={handleGraveyardClick} style={{ width: '70px', height: '102px', border: '3px solid #888', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: '#222' }}>
                        <h5 style={{ margin: 0, color: '#aaa' }}>GY ({boardState[activeSide].graveyard.length})</h5>
                        {boardState[activeSide].graveyard.length > 0 && (
                            <img src={`${BACKEND_URL}${boardState[activeSide].graveyard[boardState[activeSide].graveyard.length - 1].imageUrl}`} alt="top-gy" style={{ width: '100%', height: '100%' }} onMouseEnter={() => setHoveredCard(boardState[activeSide].graveyard[boardState[activeSide].graveyard.length - 1])} />
                        )}
                    </div>
                </div>
            </div>

            {/* DESNI STUPAC: INFO PANEL */}
            <div style={{ width: '25%', padding: '20px', borderLeft: '2px solid #444', display: 'flex', flexDirection: 'column' }}>
                <button onClick={() => onReady(boardState)} style={{ padding: '15px', fontSize: '18px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold' }}>ZAVRŠI I ZAPOČNI IGRU</button>
                {hoveredCard ? (
                    <div>
                        <img src={`${BACKEND_URL}${hoveredCard.imageUrl}`} alt="hover" style={{ width: '100%', marginBottom: '15px' }} />
                        <h2 style={{ margin: '0 0 10px 0', color: '#e5a822' }}>{hoveredCard.cardName}</h2>
                        <p><b>Tip:</b> {hoveredCard.cardType}</p>
                        {hoveredCard.cardType === 'MONSTER' && <p><b>ATK:</b> {hoveredCard.cardAttack} / <b>DEF:</b> {hoveredCard.cardDefense}</p>}
                        <p><b>Cijena:</b> {hoveredCard.cardCost}</p>
                        <p style={{ marginTop: '15px', fontSize: '14px', lineHeight: '1.4' }}>{hoveredCard.cardEffect}</p>
                    </div>
                ) : <p style={{ color: '#888', textAlign: 'center' }}>Prijeđi mišem preko karte za detalje.</p>}
            </div>
        </div>
    );
};

export default Customization;