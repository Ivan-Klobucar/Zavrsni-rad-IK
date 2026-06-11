import React, { useState, useEffect } from 'react';
import { deckAPI } from '../services/api.js';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

// inicijalizirali smo prazno polje koje ce se nadopunjavati u metodi
const emptyBoardSide = () => ({
    fieldZone: null,
    monsterZone: [null, null, null, null, null],
    spellTrapZone: [null, null, null, null, null],
    graveyard: [],
    hand: [null, null, null, null, null] // 5 mjesta rezervirana za pocetnu ruku
});

const Customization = ({ selectedDeck, onReady }) => {
    // pridodjeljivcnje spila
    const opponentDeckName = selectedDeck === 'Mugi' ? 'Saiba' : 'Mugi';

    // u pocetku pridodjeljujemo vrijednosti u startu
    const [playerDeckData, setPlayerDeckData] = useState(null);
    const [opponentDeckData, setOpponentDeckData] = useState(null);

    const [activeSide, setActiveSide] = useState('player');
    const [hoveredCard, setHoveredCard] = useState(null);
    const [selectedCardToPlace, setSelectedCardToPlace] = useState(null);

    const [gyModeActive, setGyModeActive] = useState(false);
    const [randomOpponentSTCount, setRandomOpponentSTCount] = useState(0);

    const [gyModal, setGyModal] = useState({ isOpen: false, side: '' });

    const [boardState, setBoardState] = useState({
        player: emptyBoardSide(),
        opponent: emptyBoardSide()
    });

    // metoda koristi api.js, odnosno deckAPI, koji je poveznica sa backendom kako bi dohvatio podatke o spilu
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

    // funkcija koja broji koliko karata ima u ruci i polju
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

    // funkcija koja koristi za odabir karte u spilu, ako ih vise nema u spilu nemozemo je izabrati,
    // takoder ima i dio gdje ako toggleamo gy, onda se svaka pritisnuta karta odmah salje na groblje
    const handleDeckCardClick = (deckCard) => {
        const cardId = deckCard.card.cardId;
        const maxQuantity = deckCard.quantity;
        const currentlyPlaced = getCountOnBoard(cardId, activeSide);

        if (currentlyPlaced >= maxQuantity) {
            alert(`Dosegnut je limit! Nemate više karata '${deckCard.card.cardName}' u deku.`);
            return;
        }

        if (gyModeActive) {
            const newBoard = { ...boardState };
            newBoard[activeSide].graveyard.push({ ...deckCard.card, facedown: false });
            setBoardState(newBoard);
            setSelectedCardToPlace(null);
        } else {
            setSelectedCardToPlace(deckCard.card);
        }
    };

    // funkcija sa kojom postavljamo karte na polje
    const handleZoneClick = (zoneType, index = null) => {
        // kontrola polja ako nismo odabrali niti jednu kartu
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

        // upozorenja da moramo na pravilna mjesta postavljati karte
        if (selectedCardToPlace.cardType === 'MONSTER' && zoneType !== 'monsterZone' && zoneType !== 'hand') {
            alert("Čudovišta moraju ići u monster zonu ili ruku."); return;
        }
        if (zoneType === 'fieldZone' && selectedCardToPlace.cardType !== 'SPELL') {
            alert("Samo spell karte mogu u field zonu."); return;
        }
        if ((selectedCardToPlace.cardType === 'SPELL' || selectedCardToPlace.cardType === 'TRAP') && zoneType !== 'spellTrapZone' && zoneType !== 'fieldZone' && zoneType !== 'hand') {
            alert("Spell i trap karte idu u S/T, field zonu ili ruku."); return;
        }

        // provjera zauzetosti pojedine zone
        const isOccupied = index !== null ? boardState[activeSide][zoneType][index] !== null : boardState[activeSide][zoneType] !== null;
        if (isOccupied) {
            alert("Ova zona je već zauzeta."); return;
        }

        // kartama se pridodjeljuje facedown ako su spell ili trap
        const isFacedown = (zoneType === 'spellTrapZone' && (selectedCardToPlace.cardType === 'TRAP' || selectedCardToPlace.cardType === 'SPELL'));
        const cardToPlace = { ...selectedCardToPlace, facedown: isFacedown };

        // azuriranje promjena i postavljanje na polje
        const newBoard = { ...boardState };
        if (index !== null) newBoard[activeSide][zoneType][index] = cardToPlace;
        else newBoard[activeSide][zoneType] = cardToPlace;

        setBoardState(newBoard);
        setSelectedCardToPlace(null);
    };

    // klikom na kartu u grobljku se vraca u spil
    const handleRemoveFromGy = (indexToRemove) => {
        const newBoard = { ...boardState };
        newBoard[gyModal.side].graveyard.splice(indexToRemove, 1);
        setBoardState(newBoard);
    };

    // namjestanje nasumicnih spell i trap karata
    const handleReadyWithRandoms = () => {
        const finalBoard = JSON.parse(JSON.stringify(boardState));
        // ako namjestimo broj nasumicnih karata
        if (randomOpponentSTCount > 0) {
            const oppDeck = opponentDeckData;
            let availableST = [];

            // uzimamo spell i trap karte protivnikovog spila, spremamo njihovu kolicinu i naziv
            oppDeck.deckCards.forEach(dc => {
                if (dc.card.cardType === 'SPELL' || dc.card.cardType === 'TRAP') {
                    const used = getCountOnBoard(dc.card.cardId, 'opponent');
                    for (let i = 0; i < (dc.quantity - used); i++) {
                        availableST.push(dc.card);
                    }
                }
            });

            //Fisher-Yates algoritam koji mijesa karte
            for (let i = availableST.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));

                [availableST[i], availableST[j]] =
                    [availableST[j], availableST[i]];
            }

            //prolazimo kroz slobodne zone i ako ih ima postavljamo karte izmjesane
            let placedCount = 0;
            for (let i = 0; i < 5; i++) {
                if (placedCount >= randomOpponentSTCount) break;
                if (!finalBoard.opponent.spellTrapZone[i]) {
                    const randomCard = availableST.pop();
                    if (randomCard) {
                        finalBoard.opponent.spellTrapZone[i] = { ...randomCard, facedown: true };
                        placedCount++;
                    }
                }
            }
        }

        finalBoard.player.hand = finalBoard.player.hand.filter(c => c !== null);
        finalBoard.opponent.hand = finalBoard.opponent.hand.filter(c => c !== null);

        onReady(finalBoard);
    };

    if (!playerDeckData || !opponentDeckData) return <div style={{ color: 'white', padding: '20px' }}>Učitavanje dekova...</div>;

    const activeDeck = activeSide === 'player' ? playerDeckData : opponentDeckData;
    const currentGyCards = boardState[gyModal.side]?.graveyard || [];

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#1a1a1a', color: 'white' }}>

            {/* Groblje */}
            {gyModal.isOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '12px', width: '80%', maxHeight: '80vh', overflowY: 'auto', border: '3px solid #e5a822' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
                            <h2 style={{ color: '#e5a822', margin: 0 }}>Groblje: {gyModal.side === 'player' ? 'Tvoja Strana' : 'Protivnik'}</h2>
                            <button onClick={() => setGyModal({ isOpen: false, side: '' })} style={{ padding: '10px 20px', backgroundColor: '#444', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>X Zatvori</button>
                        </div>
                        <p style={{ color: '#aaa', marginBottom: '15px' }}>Klikni na kartu kako bi ju vratio nazad u Deck.</p>
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

            {/* Prikaz spila */}
            <div style={{ width: '25%', overflowY: 'auto', padding: '10px', borderRight: '2px solid #444' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <button onClick={() => { setActiveSide('player'); setSelectedCardToPlace(null); }} style={{ padding: '10px', backgroundColor: activeSide === 'player' ? '#e5a822' : '#444', color: activeSide === 'player' ? 'black' : 'white', fontWeight: 'bold', cursor: 'pointer', flex: 1, border: 'none' }}>Tvoja Strana</button>
                    <button onClick={() => { setActiveSide('opponent'); setSelectedCardToPlace(null); }} style={{ padding: '10px', backgroundColor: activeSide === 'opponent' ? '#e5a822' : '#444', color: activeSide === 'opponent' ? 'black' : 'white', fontWeight: 'bold', cursor: 'pointer', flex: 1, border: 'none' }}>Protivnik</button>
                </div>

                {/* gumb za groblje */}
                <button
                    onClick={() => setGyModeActive(!gyModeActive)}
                    style={{ width: '100%', padding: '12px', marginBottom: '15px', backgroundColor: gyModeActive ? 'darkred' : '#333', color: 'white', border: gyModeActive ? '2px solid red' : '1px solid #555', cursor: 'pointer', fontWeight: 'bold', borderRadius: '5px', transition: '0.3s' }}
                >
                    {gyModeActive ? 'GY MODE UKLJUČEN' : 'Uključi GY Mode (Slanje direktno u GY)'}
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

            {/* postavljanje spell i trap karti */}
            <div style={{ width: '50%', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflowY: 'auto' }}>
                <h2>Uređuješ: {activeSide === 'player' ? 'Svoju stranu' : 'Protivnikovu stranu'}</h2>
                {selectedCardToPlace && <div style={{ color: '#e5a822', marginBottom: '10px', fontWeight: 'bold' }}>Odabrano: {selectedCardToPlace.cardName}</div>}

                {/* nasumicno postavljanje spell i trap karata */}
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

                    {/* Monster i S/T */}
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

                {/*  Prikaz ruke */}
                <div style={{ width: '100%', borderTop: '2px solid #444', paddingTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#e5a822' }}>Početna Ruka (Maks 5)</h3>
                    <p style={{ margin: '0 0 15px 0', fontSize: '12px', color: '#aaa' }}>Ostatak nadopunjava backend.</p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {boardState[activeSide].hand.map((card, idx) => (
                            <div key={`h-${idx}`} onClick={() => handleZoneClick('hand', idx)} onMouseEnter={() => card && setHoveredCard(card)} style={{ width: '70px', height: '102px', border: '1px solid #888', cursor: 'pointer', backgroundColor: '#111' }}>
                                {card && <img src={`${BACKEND_URL}${card.imageUrl}`} alt="hand" style={{ width: '100%', height: '100%' }} />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* prikaz informacija o pojedinoj karti */}
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