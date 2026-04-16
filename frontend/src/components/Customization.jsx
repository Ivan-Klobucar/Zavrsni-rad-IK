import React, { useState, useEffect } from 'react';
import { deckAPI } from '../services/api.js';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

const emptyBoardSide = () => ({
    monsterZone: [null, null, null, null, null],
    spellTrapZone: [null, null, null, null, null],
    graveyard: []
});

const Customization = ({ selectedDeck, onReady }) => {
    // Određivanje protivnikovog deka na temelju tvog izbora
    const opponentDeckName = selectedDeck === 'Mugi' ? 'Saiba' : 'Mugi';

    const [playerDeckData, setPlayerDeckData] = useState(null);
    const [opponentDeckData, setOpponentDeckData] = useState(null);

    const [activeSide, setActiveSide] = useState('player'); // 'player' ili 'opponent'
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

    // Dinamično brojanje koliko je karata već na polju i u groblju za određenu stranu
    const getCountOnBoard = (cardId, side) => {
        let count = 0;
        const countCard = (c) => { if (c && c.cardId === cardId) count++; };

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

    const handleZoneClick = (zoneType, index) => {
        if (!selectedCardToPlace) {
            // Ako je polje puno, a nemamo kartu u ruci -> mičemo kartu s polja
            if (boardState[activeSide][zoneType][index]) {
                const newBoard = { ...boardState };
                newBoard[activeSide][zoneType][index] = null;
                setBoardState(newBoard);
            }
            return;
        }

        // Validacija zona
        if (selectedCardToPlace.cardType === 'MONSTER' && zoneType !== 'monsterZone') {
            alert("Čudovišta moraju ići u Monster zonu!");
            return;
        }
        if ((selectedCardToPlace.cardType === 'SPELL' || selectedCardToPlace.cardType === 'TRAP') && zoneType !== 'spellTrapZone') {
            alert("Spell i Trap karte idu u S/T zonu!");
            return;
        }
        if (boardState[activeSide][zoneType][index] !== null) {
            alert("Ova zona je već zauzeta!");
            return;
        }

        const cardToPlace = {
            ...selectedCardToPlace,
            isFacedown: selectedCardToPlace.cardType === 'TRAP'
        };

        const newBoard = { ...boardState };
        newBoard[activeSide][zoneType][index] = cardToPlace;
        setBoardState(newBoard);
        setSelectedCardToPlace(null);
    };

    const handleGraveyardClick = () => {
        if (!selectedCardToPlace) {
            // Ako kliknemo groblje bez karte, brišemo zadnju kartu s vrha groblja
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

            {/* LIJEVI STUPAC: LISTA KARATA (SCROLL) */}
            <div style={{ width: '25%', overflowY: 'auto', padding: '10px', borderRight: '2px solid #444' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <button
                        onClick={() => { setActiveSide('player'); setSelectedCardToPlace(null); }}
                        style={{ padding: '10px', backgroundColor: activeSide === 'player' ? '#e5a822' : '#444', color: activeSide === 'player' ? 'black' : 'white', fontWeight: 'bold', cursor: 'pointer', flex: 1, border: 'none' }}
                    >
                        Tvoja Strana
                    </button>
                    <button
                        onClick={() => { setActiveSide('opponent'); setSelectedCardToPlace(null); }}
                        style={{ padding: '10px', backgroundColor: activeSide === 'opponent' ? '#e5a822' : '#444', color: activeSide === 'opponent' ? 'black' : 'white', fontWeight: 'bold', cursor: 'pointer', flex: 1, border: 'none' }}
                    >
                        Protivnik
                    </button>
                </div>

                <h3 style={{ textAlign: 'center', color: '#e5a822' }}>{activeDeck.deckName} Deck</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {activeDeck.deckCards.map(dc => {
                        const remaining = dc.quantity - getCountOnBoard(dc.card.cardId, activeSide);
                        const isSelected = selectedCardToPlace?.cardId === dc.card.cardId;

                        return (
                            <div
                                key={dc.card.cardId}
                                onClick={() => handleDeckCardClick(dc)}
                                onMouseEnter={() => setHoveredCard(dc.card)}
                                style={{ cursor: remaining > 0 ? 'pointer' : 'not-allowed', opacity: remaining > 0 ? 1 : 0.3, border: isSelected ? '3px solid #e5a822' : '2px solid transparent' }}
                            >
                                <img src={`${BACKEND_URL}${dc.card.imageUrl}`} alt="card" style={{ width: '100%' }} />
                                <div style={{ textAlign: 'center', fontSize: '12px', marginTop: '5px' }}>Preostalo: {remaining}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* SREDNJI STUPAC: POLJE (BOARD) */}
            <div style={{ width: '50%', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h2>Uređuješ: {activeSide === 'player' ? 'Svoju stranu' : 'Protivnikovu stranu'}</h2>

                {selectedCardToPlace && (
                    <div style={{ color: '#e5a822', marginBottom: '20px', fontWeight: 'bold', backgroundColor: '#333', padding: '10px', borderRadius: '5px' }}>
                        U ruci: {selectedCardToPlace.cardName} (Klikni na polje ili groblje)
                    </div>
                )}

                {/* Monster Zona */}
                <h4 style={{ marginBottom: '5px' }}>Monster Zona</h4>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    {boardState[activeSide].monsterZone.map((card, idx) => (
                        <div
                            key={`m-${idx}`}
                            onClick={() => handleZoneClick('monsterZone', idx)}
                            onMouseEnter={() => card && setHoveredCard(card)}
                            style={{ width: '70px', height: '102px', border: '2px dashed #666', cursor: 'pointer', backgroundColor: '#222' }}
                        >
                            {card && <img src={`${BACKEND_URL}${card.imageUrl}`} alt="monster" style={{ width: '100%', height: '100%' }} />}
                        </div>
                    ))}
                </div>

                {/* S/T Zona */}
                <h4 style={{ marginBottom: '5px' }}>Spell / Trap Zona</h4>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '40px' }}>
                    {boardState[activeSide].spellTrapZone.map((card, idx) => {
                        const displayImg = card?.isFacedown ? '/images/cards/card_back.jpg' : card?.imageUrl;
                        return (
                            <div
                                key={`st-${idx}`}
                                onClick={() => handleZoneClick('spellTrapZone', idx)}
                                onMouseEnter={() => card && setHoveredCard(card)}
                                style={{ width: '70px', height: '102px', border: '2px dashed #666', cursor: 'pointer', backgroundColor: '#222' }}
                            >
                                {card && <img src={`${BACKEND_URL}${displayImg}`} alt="s/t" style={{ width: '100%', height: '100%' }} />}
                            </div>
                        );
                    })}
                </div>

                {/* Groblje */}
                <div
                    onClick={handleGraveyardClick}
                    style={{ width: '100px', height: '145px', border: '3px solid #888', borderRadius: '5px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: '#222' }}
                >
                    <h4 style={{ margin: 0, color: '#aaa' }}>Groblje</h4>
                    <p style={{ fontSize: '24px', margin: '10px 0' }}>{boardState[activeSide].graveyard.length}</p>
                    {boardState[activeSide].graveyard.length > 0 && (
                        <img
                            src={`${BACKEND_URL}${boardState[activeSide].graveyard[boardState[activeSide].graveyard.length - 1].imageUrl}`}
                            alt="top-gy"
                            style={{ width: '60px', height: '87px' }}
                            onMouseEnter={() => setHoveredCard(boardState[activeSide].graveyard[boardState[activeSide].graveyard.length - 1])}
                        />
                    )}
                </div>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>(Klikni prazno groblje za brisanje zadnje karte)</p>
            </div>

            {/* DESNI STUPAC: INFO PANEL & READY */}
            <div style={{ width: '25%', padding: '20px', borderLeft: '2px solid #444', display: 'flex', flexDirection: 'column' }}>
                <button
                    onClick={() => onReady(boardState)}
                    style={{ padding: '15px', fontSize: '18px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer', marginBottom: '30px', fontWeight: 'bold' }}
                >
                    ZAVRŠI I ZAPOČNI IGRU
                </button>

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
                    <p style={{ color: '#888', textAlign: 'center' }}>Prijeđi mišem preko karte za detalje.</p>
                )}
            </div>
        </div>
    );
};

export default Customization;