import React, { useState } from 'react';
import { gameAPI } from '../../services/api.js'; // Pretpostavljam da je ovo putanja do tvog api.js
import '../../App.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

const GameBoard = ({ boardData: initialBoardData }) => {
    const [boardData, setBoardData] = useState(initialBoardData);
    const [hoveredCard, setHoveredCard] = useState(null);
    const [selectedHandCard, setSelectedHandCard] = useState(null);
    const [attackingMonster, setAttackingMonster] = useState(null);
    const [tributeState, setTributeState] = useState({ active: false, needed: 0, selectedIds: [] });

    // NOVO: Stanje za kraj igre
    const [isGameOver, setIsGameOver] = useState(false);
    const [gyModal, setGyModal] = useState({ isOpen: false, cards: [], owner: '' });

    const currentPhase = boardData?.currentPhase || 'MP1';
    const phases = ['DP', 'SP', 'MP1', 'BP', 'MP2', 'EP'];

    if (!boardData) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Učitavanje polja...</div>;

    // --- LOGIKA FAZA ---
    const handlePhaseChange = async (targetPhase) => {
        const currentIndex = phases.indexOf(currentPhase);
        const targetIndex = phases.indexOf(targetPhase);

        // Zabrana vraćanja unatrag
        if (targetIndex <= currentIndex) {
            alert("Ne možeš se vratiti u prijašnju fazu!");
            return;
        }

        // Ako klikne na EP, označavamo kraj igre
        if (targetPhase === 'EP') {
            setIsGameOver(true);
            return;
        }

        try {
            const newData = await gameAPI.changePhase(targetPhase);
            setBoardData(newData);
            setAttackingMonster(null);
            setSelectedHandCard(null);
            setTributeState({ active: false, needed: 0, selectedIds: [] });
        } catch (e) {
            console.error("Greška pri promjeni faze", e);
        }
    };

    // --- LOGIKA AKCIJA IZ RUKE ---
    const handleActionClick = (actionType) => {
        if (!selectedHandCard) return;

        // 1. LOGIKA ZA SUMMON (Žrtvovanje)
        if (actionType === 'SUMMON') {
            const cost = selectedHandCard.level || selectedHandCard.cardCost || 0;

            let tributesNeeded = 0;
            if (cost >= 5 && cost <= 6) tributesNeeded = 1;
            if (cost >= 7) tributesNeeded = 2;

            if (tributesNeeded > 0) {
                const myMonstersCount = boardData.player.monsterZone.filter(c => c !== null).length;

                if (myMonstersCount < tributesNeeded) {
                    alert(`Nemaš dovoljno čudovišta za žrtvovanje! Potrebno: ${tributesNeeded}`);
                    return;
                }

                // Aktivira mod za odabir žrtvi na TVOM polju
                setTributeState({ active: true, needed: tributesNeeded, selectedIds: [], action: 'SUMMON', target: 'MY_FIELD' });
                return; // Prekida izvršavanje, čeka klik
            }
        }

        // 2. LOGIKA ZA ACTIVATE (Odabir meta za magije)
        if (actionType === 'ACTIVATE') {
            const spellName = selectedHandCard.cardName;

            if (spellName === 'Monster Reborn') {
                const totalGyMonsters = [...boardData.player.graveyard, ...boardData.opponent.graveyard]
                    .filter(c => c.cardType === 'MONSTER').length;

                if (totalGyMonsters === 0) {
                    alert("Nema čudovišta u grobljima za prizivanje!");
                    return;
                }

                alert("Otvori groblje i odaberi čudovište za prizivanje!");
                // Aktivira mod za odabir mete u BILO KOJEM groblju
                setTributeState({ active: true, needed: 1, selectedIds: [], action: 'ACTIVATE', target: 'ANY_GY' });
                return;
            }

            if (spellName === 'Dragon Strike') { // Ovdje upiši pravo ime svoje karte
                const oppMonsters = boardData.opponent.monsterZone.filter(c => c !== null).length;
                if (oppMonsters === 0) {
                    alert("Protivnik nema čudovišta na polju!");
                    return;
                }

                // Aktivira mod za odabir mete na PROTIVNIKOVOM polju
                setTributeState({ active: true, needed: 1, selectedIds: [], action: 'ACTIVATE', target: 'OPP_FIELD' });
                return;
            }
        }

        // Ako akcija ne zahtijeva odabir (npr. Pot of Greed, Dark Hole, običan Summon, SET), samo ju izvrši
        executeAction(actionType, []);
    };

    const executeAction = async (actionType, tributeIds) => {
        try {
            const newData = await gameAPI.playCard(selectedHandCard.cardId, actionType, tributeIds);
            setBoardData(newData);
            setSelectedHandCard(null);
            setTributeState({ active: false, needed: 0, selectedIds: [] });
        } catch (err) {
            alert(err.message || "Neuspješna akcija!");
        }
    };

    const handlePlayerMonsterClick = (card) => {
        if (!card) return;

        // Ako biramo žrtve za SUMMON na SVOM polju
        if (tributeState.active && tributeState.target === 'MY_FIELD') {
            if (tributeState.selectedIds.includes(card.cardId)) return; // Već odabrano

            const newSelected = [...tributeState.selectedIds, card.cardId];
            if (newSelected.length === tributeState.needed) {
                executeAction(tributeState.action, newSelected); // Šaljemo akciju (SUMMON) i ID-jeve
            } else {
                setTributeState({ ...tributeState, selectedIds: newSelected });
            }
            return;
        }

        if (currentPhase === 'BP') {
            setAttackingMonster(card);
        }
    };

    const handleOpponentMonsterClick = async (targetCard) => {
        // Ako biramo metu za MAGIJU na PROTIVNIKOVOM polju
        if (tributeState.active && tributeState.target === 'OPP_FIELD') {
            if (!targetCard) return;
            executeAction(tributeState.action, [targetCard.cardId]); // Izvrši ACTIVATE s metom
            return;
        }

        if (currentPhase !== 'BP') return;
        if (!attackingMonster) {
            alert("Prvo odaberi svoje čudovište s kojim želiš napasti!");
            return;
        }
        try {
            const newData = await gameAPI.attack(attackingMonster.cardId, targetCard ? targetCard.cardId : null);
            setBoardData(newData);
            setAttackingMonster(null);
        } catch (err) {
            alert(err.message || "Greška pri napadu!");
        }
    };

    // Ako je igra završena, prikaži SAMO Popup preko ekrana
    if (isGameOver) {
        return (
            <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' }}>
                <div style={{ backgroundColor: '#222', padding: '40px', borderRadius: '10px', textAlign: 'center', border: '2px solid #e5a822' }}>
                    <h1 style={{ color: 'white', marginBottom: '20px' }}>Simulacija je gotova</h1>
                    <p style={{ color: '#aaa', marginBottom: '30px' }}>Kliknite na gumb ispod za preuzimanje statistike dvoboja.</p>
                    <button style={{ padding: '15px 30px', backgroundColor: '#e5a822', color: 'black', fontWeight: 'bold', fontSize: '16px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                        Preuzmi Statistiku
                    </button>
                </div>
            </div>
        );
    }

    const CardSlot = ({ card, type, isOpponent = false, label = "", onClick = null }) => {
        const CARD_BACK = `${BACKEND_URL}/images/cards/card_back.jpg`;

        const bgImage = (type === 'deck' || type === 'extra') && !card ? `url(${CARD_BACK})` : 'none';
        const isAttacking = attackingMonster?.cardId === card?.cardId;
        const isTributeSelected = tributeState.selectedIds.includes(card?.cardId);

        let borderStyle = '2px solid #555';
        if (isAttacking) borderStyle = '3px solid red';
        if (isTributeSelected) borderStyle = '3px solid purple';

        // ISPRAVAK: Backend šalje polje kao "facedown", a ne "isFacedown"
        const isCardFacedown = card?.facedown === true;
        const containerClass = `card-slot-container ${isCardFacedown ? 'is-facedown' : ''}`;

        const displayImageUrl = card
            ? (isOpponent && isCardFacedown ? CARD_BACK : `${BACKEND_URL}${card.imageUrl}`)
            : '';

        return (
            <div
                onMouseEnter={() => {
                    if (card) {
                        // NOVO: Ako je karta protivnička i okrenuta licem prema dolje, šaljemo lažni objekt!
                        if (isOpponent && isCardFacedown) {
                            setHoveredCard({
                                cardName: "Nepoznata karta",
                                cardType: "???",
                                imageUrl: "/images/cards/card_back.jpg",
                                cardAttack: null,
                                cardDefense: null
                            });
                        } else {
                            // Inače prikazujemo prave detalje
                            setHoveredCard(card);
                        }
                    }
                }}
                onClick={() => onClick && onClick(card)}
                className={containerClass}
                style={{
                    width: '75px',
                    height: '110px',
                    border: borderStyle,
                    backgroundColor: '#222',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    cursor: onClick ? 'pointer' : 'default',
                    backgroundImage: bgImage,
                    backgroundSize: 'cover'
                }}
            >
                {label && !card && type !== 'deck' && type !== 'extra' && (
                    <span style={{ color: '#555', fontSize: '12px', fontWeight: 'bold', position: 'absolute' }}>{label}</span>
                )}

                {card && (
                    <div className="card-image-wrapper" style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <img
                            src={displayImageUrl}
                            alt="card-front"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                // Ako je protivnička karta i NIJE facedown, rotiraj ju
                                transform: isOpponent && !isCardFacedown ? 'rotate(180deg)' : 'none'
                            }}
                        />

                        {isCardFacedown && !isOpponent && (
                            <img
                                src={CARD_BACK}
                                alt="card-back"
                                className="card-back-overlay"
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    zIndex: 2
                                }}
                            />
                        )}
                    </div>
                )}
            </div>
        );
    };

    // Provjera dozvole za akcije iz ruke: Moguće SAMO u MP1 i MP2
    const canDoMainPhaseActions = ['MP1', 'MP2'].includes(currentPhase);
    const opponentTopGyCard = boardData.opponent.graveyard && boardData.opponent.graveyard.length > 0
        ? boardData.opponent.graveyard[boardData.opponent.graveyard.length - 1]
        : null;

    const playerTopGyCard = boardData.player.graveyard && boardData.player.graveyard.length > 0
        ? boardData.player.graveyard[boardData.player.graveyard.length - 1]
        : null;

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#111', color: 'white' }}>
            {/* LIJEVI STUPAC: INFO PANEL */}
            <div style={{ width: '25%', padding: '20px', borderRight: '2px solid #444', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <h2 style={{ textAlign: 'center', borderBottom: '1px solid #444', paddingBottom: '10px' }}>Detalji Karte</h2>

                {selectedHandCard || hoveredCard ? (
                    <div style={{ overflowY: 'auto', marginBottom: '150px' }}>
                        <img src={`${BACKEND_URL}${(selectedHandCard || hoveredCard).imageUrl}`} alt="preview" style={{ width: '100%', marginBottom: '15px', boxShadow: '0 4px 8px rgba(0,0,0,0.5)' }} />
                        <h2 style={{ margin: '0 0 10px 0', color: '#e5a822' }}>{(selectedHandCard || hoveredCard).cardName}</h2>
                        <p><b>Tip:</b> {(selectedHandCard || hoveredCard).cardType}</p>
                        {(selectedHandCard || hoveredCard).cardType === 'MONSTER' && <p><b>ATK:</b> {(selectedHandCard || hoveredCard).cardAttack} / <b>DEF:</b> {(selectedHandCard || hoveredCard).cardDefense}</p>}
                    </div>
                ) : <p style={{ color: '#888', textAlign: 'center', marginTop: '50px' }}>Prijeđi mišem preko polja.</p>}

                {/* IZBORNIK AKCIJA (Prikazuje se samo ako je MP1 ili MP2) */}
                {selectedHandCard && !tributeState.active && canDoMainPhaseActions && (
                    <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', backgroundColor: '#222', padding: '15px', borderRadius: '8px', border: '1px solid #e5a822' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: 'white', textAlign: 'center' }}>Akcije</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {selectedHandCard.cardType === 'MONSTER' && <button onClick={() => handleActionClick('SUMMON')} style={actionBtnStyle}>Normal Summon</button>}
                            {selectedHandCard.cardType === 'SPELL' && <button onClick={() => handleActionClick('ACTIVATE')} style={actionBtnStyle}>Activate</button>}
                            {(selectedHandCard.cardType === 'SPELL' || selectedHandCard.cardType === 'TRAP') && <button onClick={() => handleActionClick('SET')} style={actionBtnStyle}>Set</button>}
                            <button onClick={() => setSelectedHandCard(null)} style={{ ...actionBtnStyle, backgroundColor: '#555', color: 'white' }}>Odustani</button>
                        </div>
                    </div>
                )}
            </div>

            {/* DESNI STUPAC: POLJE */}
            <div style={{ width: '75%', display: 'flex', flexDirection: 'column' }}>
                {/* STATUS BAR: LP i Faze */}
                <div style={{ height: '60px', backgroundColor: '#222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', borderBottom: '2px solid #444' }}>
                    <div style={{ color: 'red', fontWeight: 'bold', fontSize: '18px' }}>SAIBA LP: {boardData.opponent.lifePoints}</div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        {phases.map(phase => {
                            const isPast = phases.indexOf(phase) < phases.indexOf(currentPhase);
                            return (
                                <button key={phase} onClick={() => handlePhaseChange(phase)} disabled={isPast} style={{ padding: '8px 15px', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: isPast ? 'not-allowed' : 'pointer', borderRadius: '4px', backgroundColor: currentPhase === phase ? '#e5a822' : (isPast ? '#111' : '#333'), color: currentPhase === phase ? 'black' : (isPast ? '#555' : 'white'), opacity: isPast ? 0.5 : 1 }}>
                                    {phase}
                                </button>
                            );
                        })}
                    </div>
                    <div style={{ color: '#00ff00', fontWeight: 'bold', fontSize: '18px' }}>TVOJ LP: {boardData.player.lifePoints}</div>
                </div>

                {/* ARENA (Isti kod za polje kao prije) */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '10px 20px', position: 'relative' }}>

                    {attackingMonster && boardStateHelper(boardData.opponent.monsterZone).every(c => c === null) && (
                        <button onClick={() => handleOpponentMonsterClick(null)} style={{ position: 'absolute', top: '25%', padding: '15px 30px', backgroundColor: 'red', color: 'white', fontWeight: 'bold', fontSize: '18px', border: '2px solid white', cursor: 'pointer', zIndex: 10 }}>DIRECT ATTACK!</button>
                    )}

                    <div style={{ display: 'flex', gap: '10px', height: '80px', alignItems: 'flex-start', marginBottom: '20px' }}>
                        {boardData.opponent.hand.map((_, i) => <div key={`oh-${i}`} style={{ width: '55px', height: '80px', border: '1px solid #555', backgroundColor: '#111' }}><img src={`${BACKEND_URL}/images/cards/card_back.jpg`} alt="back" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>)}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <CardSlot type="deck" />
                                {boardStateHelper(boardData.opponent.spellTrapZone).reverse().map((card, i) => <CardSlot key={`ost-${i}`} card={card} isOpponent={true} label="S/T" />)}
                                <CardSlot type="extra" />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <CardSlot
                                    type="gy"
                                    card={opponentTopGyCard}
                                    isOpponent={true}
                                    label="GY"
                                    onClick={() => setGyModal({ isOpen: true, cards: boardData.opponent.graveyard, owner: 'Protivnikovo' })}
                                />
                                {boardStateHelper(boardData.opponent.monsterZone).reverse().map((card, i) => <CardSlot key={`om-${i}`} card={card} isOpponent={true} label="Mon" onClick={card ? () => handleOpponentMonsterClick(card) : null} />)}
                                <CardSlot type="field" isOpponent={true} label="Field" />
                            </div>
                        </div>

                        <div style={{ width: '100%', height: '2px', backgroundColor: '#444', margin: '5px 0' }}></div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <CardSlot type="field" label="Field" />
                                {boardStateHelper(boardData.player.monsterZone).map((card, i) => <CardSlot key={`pm-${i}`} card={card} label="Mon" onClick={() => handlePlayerMonsterClick(card)} />)}
                                <CardSlot
                                    type="gy"
                                    card={playerTopGyCard}
                                    label="GY"
                                    onClick={() => setGyModal({ isOpen: true, cards: boardData.player.graveyard, owner: 'Tvoje' })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <CardSlot type="extra" />
                                {boardStateHelper(boardData.player.spellTrapZone).map((card, i) => <CardSlot key={`pst-${i}`} card={card} label="S/T" />)}
                                <CardSlot type="deck" />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', height: '110px', alignItems: 'flex-end', marginTop: '30px' }}>
                        {boardData.player.hand.map((card, i) => (
                            <div key={`ph-${i}`} onMouseEnter={() => setHoveredCard(card)} onClick={() => canDoMainPhaseActions ? setSelectedHandCard(card) : null} style={{ width: '75px', height: '110px', cursor: canDoMainPhaseActions ? 'pointer' : 'default', border: selectedHandCard?.cardId === card.cardId ? '3px solid #e5a822' : '1px solid #888' }}>
                                <img src={`${BACKEND_URL}${card.imageUrl}`} alt="hand" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        ))}
                    </div>
                </div>
                {/* GRAVEYARD MODAL */}
                {gyModal.isOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '12px', width: '80%', maxHeight: '80vh', overflowY: 'auto', border: '3px solid #e5a822' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
                                <h2 style={{ color: '#e5a822', margin: 0 }}>{gyModal.owner} Groblje</h2>
                                <button onClick={() => setGyModal({ isOpen: false, cards: [], owner: '' })} style={{ padding: '10px 20px', backgroundColor: 'red', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '5px' }}>X Zatvori</button>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                                {gyModal.cards && gyModal.cards.length > 0 ? (
                                    gyModal.cards.map((c, i) => (
                                        <div
                                            key={`gy-card-${i}`}
                                            style={{
                                                width: '100px',
                                                cursor: 'pointer',
                                                transition: 'transform 0.2s',
                                                // NOVO: Ako je aktiviran mod za biranje iz GY-a i karta je čudovište, daj joj zeleni sjaj (glow)
                                                boxShadow: tributeState.active && tributeState.target === 'ANY_GY' && c.cardType === 'MONSTER' ? '0 0 15px #00ff00' : 'none',
                                                borderRadius: '4px'
                                            }}
                                            onMouseEnter={() => setHoveredCard(c)}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                            onClick={() => {
                                                // NOVO: Logika za hvatanje klika i slanje ID-ja karte na backend
                                                if (tributeState.active && tributeState.target === 'ANY_GY') {
                                                    if (c.cardType !== 'MONSTER') {
                                                        alert("Moraš odabrati čudovište!");
                                                        return;
                                                    }
                                                    setGyModal({ isOpen: false, cards: [], owner: '' }); // Zatvori modal nakon odabira
                                                    executeAction(tributeState.action, [c.cardId]); // Šalje akciju (npr. ACTIVATE) i ID odabrane karte
                                                }
                                            }}
                                        >
                                            <img src={`${BACKEND_URL}${c.imageUrl}`} alt={c.cardName} style={{ width: '100%', borderRadius: '4px', border: '1px solid #555' }} />
                                        </div>
                                    ))
                                ) : (
                                    <p style={{ color: '#aaa', fontSize: '18px' }}>Ovo groblje je prazno.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const actionBtnStyle = { padding: '10px', backgroundColor: '#e5a822', color: 'black', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px' };
const boardStateHelper = (zoneArray) => { const arr = [...(zoneArray || [])]; while (arr.length < 5) arr.push(null); return arr.slice(0, 5); };

export default GameBoard;