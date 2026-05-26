import React, { useState, useEffect } from 'react';
import { deckAPI } from '../services/api.js';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

// Dodali smo 'hand' niz u inicijalno stanje
const emptyBoardSide = () => ({
    fieldZone: null,
    monsterZone: [null, null, null, null, null],
    spellTrapZone: [null, null, null, null, null],
    graveyard: [],
    hand: [null, null, null, null, null] // 5 mjesta za početnu ruku
});

const Customization = ({ selectedDeck, onReady }) => {
    const opponentDeckName = selectedDeck === 'Mugi' ? 'Saiba' : 'Mugi';

    const [playerDeckData, setPlayerDeckData] = useState(null);
    const [opponentDeckData, setOpponentDeckData] = useState(null);

    const [activeSide, setActiveSide] = useState('player');
    const [hoveredCard, setHoveredCard] = useState(null);
    const [selectedCardToPlace, setSelectedCardToPlace] = useState(null);

    // NOVO: Toggle za slanje u groblje i stanje za Random S/T
    const [gyModeActive, setGyModeActive] = useState(false);
    const [randomOpponentSTCount, setRandomOpponentSTCount] = useState(0);

    // NOVO: Stanje za GY Modal
    const [gyModal, setGyModal] = useState({ isOpen: false, side: '' });

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

    // Ažurirano brojanje da uključuje i Ruku (Hand)
    const getCountOnBoard = (cardId, side) => {
        let count = 0;
        const countCard = (c) => { if (c && c.cardId === cardId) count++; };

        if (boardState[side].fieldZone?.cardId === cardId) count++;
        boardState[side].monsterZone.forEach(countCard);
        boardState[side].spellTrapZone.forEach(countCard);
        boardState[side].hand.forEach(countCard);
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

        // NOVO: Ako je uključen GY Mode, karta ide ravno u groblje
        if (gyModeActive) {
            const newBoard = { ...boardState };
            // Pazi na varijablu 'facedown' ovisno o tome kako backend očekuje
            newBoard[activeSide].graveyard.push({ ...deckCard.card, facedown: false });
            setBoardState(newBoard);
            setSelectedCardToPlace(null);
        } else {
            setSelectedCardToPlace(deckCard.card);
        }
    };

    const handleZoneClick = (zoneType, index = null) => {
        if (!selectedCardToPlace) {
            // Micanje karte s polja ako kliknemo bez ičega u "ruci"
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

        // Validacije
        if (selectedCardToPlace.cardType === 'MONSTER' && zoneType !== 'monsterZone' && zoneType !== 'hand') {
            alert("Čudovišta moraju ići u Monster zonu ili Ruku!"); return;
        }
        if (zoneType === 'fieldZone' && selectedCardToPlace.cardType !== 'SPELL') {
            alert("Samo Spell karte mogu u Field Zonu!"); return;
        }
        if ((selectedCardToPlace.cardType === 'SPELL' || selectedCardToPlace.cardType === 'TRAP') && zoneType !== 'spellTrapZone' && zoneType !== 'fieldZone' && zoneType !== 'hand') {
            alert("Spell i Trap karte idu u S/T, Field zonu ili Ruku!"); return;
        }

        const isOccupied = index !== null ? boardState[activeSide][zoneType][index] !== null : boardState[activeSide][zoneType] !== null;
        if (isOccupied) {
            alert("Ova zona je već zauzeta!"); return;
        }

        // Postavljamo facedown za trapove u S/T zoni
        const isFacedown = (zoneType === 'spellTrapZone' && (selectedCardToPlace.cardType === 'TRAP' || selectedCardToPlace.cardType === 'SPELL'));
        const cardToPlace = { ...selectedCardToPlace, facedown: isFacedown };

        const newBoard = { ...boardState };
        if (index !== null) newBoard[activeSide][zoneType][index] = cardToPlace;
        else newBoard[activeSide][zoneType] = cardToPlace;

        setBoardState(newBoard);
        setSelectedCardToPlace(null);
    };

    const handleRemoveFromGy = (indexToRemove) => {
        const newBoard = { ...boardState };
        newBoard[gyModal.side].graveyard.splice(indexToRemove, 1);
        setBoardState(newBoard);
    };

    const handleReadyWithRandoms = () => {
        const finalBoard = JSON.parse(JSON.stringify(boardState)); // Deep copy

        // NOVO: Dodavanje nasumičnih Spell/Trap karata za protivnika
        if (randomOpponentSTCount > 0) {
            const oppDeck = opponentDeckData;
            let availableST = [];

            // Prikupljamo sve preostale S/T karte iz deka
            oppDeck.deckCards.forEach(dc => {
                if (dc.card.cardType === 'SPELL' || dc.card.cardType === 'TRAP') {
                    const used = getCountOnBoard(dc.card.cardId, 'opponent');
                    for (let i = 0; i < (dc.quantity - used); i++) {
                        availableST.push(dc.card);
                    }
                }
            });

            // Shufflanje niza
            availableST.sort(() => 0.5 - Math.random());

            let placedCount = 0;
            for (let i = 0; i < 5; i++) {
                if (placedCount >= randomOpponentSTCount) break;
                // Ako je mjesto prazno, postavi nasumičnu kartu licem prema dolje
                if (!finalBoard.opponent.spellTrapZone[i]) {
                    const randomCard = availableST.pop();
                    if (randomCard) {
                        finalBoard.opponent.spellTrapZone[i] = { ...randomCard, facedown: true };
                        placedCount++;
                    }
                }
            }
        }

        // Čišćenje null vrijednosti u rukama prije slanja na backend (Spring Boot želi samo čiste liste)
        finalBoard.player.hand = finalBoard.player.hand.filter(c => c !== null);
        finalBoard.opponent.hand = finalBoard.opponent.hand.filter(c => c !== null);

        onReady(finalBoard);
    };

    if (!playerDeckData || !opponentDeckData) return <div style={{ color: 'white', padding: '20px' }}>Učitavanje dekova...</div>;

    const activeDeck = activeSide === 'player' ? playerDeckData : opponentDeckData;
    const currentGyCards = boardState[gyModal.side]?.graveyard || [];

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#1a1a1a', color: 'white' }}>

            {/* GY MODAL ZA PREGLED I VRAĆANJE U DECK */}
            {gyModal.isOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '12px', width: '80%', maxHeight: '80vh', overflowY: 'auto', border: '3px solid #e5a822' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
                            <h2 style={{ color: '#e5a822', margin: 0 }}>Groblje: {gyModal.side === 'player' ? 'Tvoja Strana' : 'Protivnik'}</h2>
                            <button onClick={() => setGyModal({ isOpen: false, side: '' })} style={{ padding: '10px 20px', backgroundColor: '#444', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>X Zatvori</button>
                        </div>
                        <p style={{ color: '#aaa', marginBottom: '15px' }}>Klikni na kartu kako bi ju vratio/la nazad u Deck.</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                            {currentGyCards.length > 0 ? currentGyCards.map((c, i) => (
                                <div key={`gy-${i}`} onClick={() => handleRemoveFromGy(i)} onMouseEnter={() => setHoveredCard(c)} style={{ width: '100px', cursor: 'pointer', border: '2px solid red', borderRadius: '4px' }}>
                                    <img src={`${BACKEND_URL}${c.imageUrl}`} alt={c.cardName} style={{ width: '100%', display: 'block' }} />
                                </div>
                            )) : <p>Groblje je prazno.</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* LIJEVI STUPAC: DECK */}
            <div style={{ width: '25%', overflowY: 'auto', padding: '10px', borderRight: '2px solid #444' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <button onClick={() => { setActiveSide('player'); setSelectedCardToPlace(null); }} style={{ padding: '10px', backgroundColor: activeSide === 'player' ? '#e5a822' : '#444', color: activeSide === 'player' ? 'black' : 'white', fontWeight: 'bold', cursor: 'pointer', flex: 1, border: 'none' }}>Tvoja Strana</button>
                    <button onClick={() => { setActiveSide('opponent'); setSelectedCardToPlace(null); }} style={{ padding: '10px', backgroundColor: activeSide === 'opponent' ? '#e5a822' : '#444', color: activeSide === 'opponent' ? 'black' : 'white', fontWeight: 'bold', cursor: 'pointer', flex: 1, border: 'none' }}>Protivnik</button>
                </div>

                {/* NOVO: Toggle gumb za groblje */}
                <button
                    onClick={() => setGyModeActive(!gyModeActive)}
                    style={{ width: '100%', padding: '12px', marginBottom: '15px', backgroundColor: gyModeActive ? 'darkred' : '#333', color: 'white', border: gyModeActive ? '2px solid red' : '1px solid #555', cursor: 'pointer', fontWeight: 'bold', borderRadius: '5px', transition: '0.3s' }}
                >
                    {gyModeActive ? '🔥 GY MODE UKLJUČEN (Klikni za prekid)' : '⚰️ Uključi GY Mode (Slanje direktno u GY)'}
                </button>

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
            <div style={{ width: '50%', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
                <h2>Uređuješ: {activeSide === 'player' ? 'Svoju stranu' : 'Protivnikovu stranu'}</h2>
                {selectedCardToPlace && <div style={{ color: '#e5a822', marginBottom: '10px', fontWeight: 'bold' }}>Odabrano: {selectedCardToPlace.cardName}</div>}

                {/* NOVO: Opcija za Random S/T protivnika */}
                {activeSide === 'opponent' && (
                    <div style={{ backgroundColor: '#222', padding: '15px', borderRadius: '8px', border: '1px solid #555', marginBottom: '20px', textAlign: 'center' }}>
                        <label style={{ fontWeight: 'bold', color: '#e5a822' }}>Auto-Set S/T pri početku: </label>
                        <input
                            type="number" min="0" max="5"
                            value={randomOpponentSTCount}
                            onChange={(e) => setRandomOpponentSTCount(parseInt(e.target.value) || 0)}
                            style={{ width: '50px', marginLeft: '10px', padding: '5px', textAlign: 'center' }}
                        />
                        <p style={{ fontSize: '12px', color: '#aaa', margin: '5px 0 0 0' }}>Postavit će nasumične S/T iz deka na prazna mjesta prilikom pokretanja.</p>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'flex-start' }}>
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
                                    {card && <img src={`${BACKEND_URL}${card.imageUrl}`} alt="s/t" style={{ width: '100%', height: '100%', opacity: 0.8 }} />}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Groblje */}
                    <div>
                        <h5 style={{ margin: '0 0 5px 0', textAlign: 'center' }}>GY ({boardState[activeSide].graveyard.length})</h5>
                        <div onClick={() => setGyModal({ isOpen: true, side: activeSide })} style={{ width: '70px', height: '102px', border: '3px solid #888', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: '#222', backgroundImage: `url(${BACKEND_URL}/images/cards/card_back.jpg)`, backgroundSize: 'cover' }}>
                            {boardState[activeSide].graveyard.length > 0 && (
                                <img src={`${BACKEND_URL}${boardState[activeSide].graveyard[boardState[activeSide].graveyard.length - 1].imageUrl}`} alt="top-gy" style={{ width: '100%', height: '100%' }} onMouseEnter={() => setHoveredCard(boardState[activeSide].graveyard[boardState[activeSide].graveyard.length - 1])} />
                            )}
                        </div>
                    </div>
                </div>

                {/* NOVO: Prikaz Ruke (Hand) */}
                <div style={{ width: '100%', borderTop: '2px solid #444', paddingTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#e5a822' }}>Početna Ruka (Maks 5)</h3>
                    <p style={{ margin: '0 0 15px 0', fontSize: '12px', color: '#aaa' }}>Ostatak će backend nadopuniti iz deka kada igra počne.</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {boardState[activeSide].hand.map((card, idx) => (
                            <div key={`h-${idx}`} onClick={() => handleZoneClick('hand', idx)} onMouseEnter={() => card && setHoveredCard(card)} style={{ width: '70px', height: '102px', border: '1px solid #888', cursor: 'pointer', backgroundColor: '#111' }}>
                                {card && <img src={`${BACKEND_URL}${card.imageUrl}`} alt="hand" style={{ width: '100%', height: '100%' }} />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* DESNI STUPAC: INFO PANEL */}
            <div style={{ width: '25%', padding: '20px', borderLeft: '2px solid #444', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <button onClick={handleReadyWithRandoms} style={{ padding: '15px', fontSize: '18px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer', marginBottom: '20px', fontWeight: 'bold', borderRadius: '5px' }}>ZAVRŠI I ZAPOČNI IGRU</button>
                {hoveredCard ? (
                    <div>
                        <img src={`${BACKEND_URL}${hoveredCard.imageUrl}`} alt="hover" style={{ width: '100%', marginBottom: '15px', border: '2px solid #555', borderRadius: '5px' }} />
                        <h2 style={{ margin: '0 0 10px 0', color: '#e5a822' }}>{hoveredCard.cardName}</h2>
                        <p><b>Tip:</b> {hoveredCard.cardType}</p>
                        {hoveredCard.cardType === 'MONSTER' && <p><b>ATK:</b> {hoveredCard.cardAttack} / <b>DEF:</b> {hoveredCard.cardDefense}</p>}
                        <p style={{ marginTop: '15px', fontSize: '14px', lineHeight: '1.4' }}>{hoveredCard.cardEffect}</p>
                    </div>
                ) : <p style={{ color: '#888', textAlign: 'center' }}>Prijeđi mišem preko karte za detalje.</p>}
            </div>
        </div>
    );
};

export default Customization;