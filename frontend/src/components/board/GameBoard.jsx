import React, { useState } from 'react';
import { gameAPI } from '../../services/api.js';
import '../../App.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

const GameBoard = ({ boardData: initialBoardData }) => {
    const [boardData, setBoardData] = useState(initialBoardData);
    const [hoveredCard, setHoveredCard] = useState(null);
    const [selectedHandCard, setSelectedHandCard] = useState(null);
    const [attackingMonster, setAttackingMonster] = useState(null);
    const [tributeState, setTributeState] = useState({ active: false, needed: 0, selectedIds: [] });


    const [isGameOver, setIsGameOver] = useState(false);
    const [gyModal, setGyModal] = useState({ isOpen: false, cards: [], owner: '' });

    const currentPhase = boardData?.currentPhase || 'MP1';
    const phases = ['DP', 'SP', 'MP1', 'BP', 'MP2', 'EP'];

    if (!boardData) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Učitavanje polja...</div>;

    // --- LOGIKA FAZA ---
    const handlePhaseChange = async (targetPhase) => {
        const currentIndex = phases.indexOf(currentPhase);
        const targetIndex = phases.indexOf(targetPhase);

        if (targetIndex <= currentIndex) {
            alert("Ne možeš se vratiti u prijašnju fazu!");
            return;
        }

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

        if (actionType === 'SUMMON') {
            if (boardData.player.hasNormalSummonedThisTurn) {
                alert("Već si iskoristio Normal Summon ovog poteza!");
                return;
            }
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
                setTributeState({ active: true, needed: tributesNeeded, selectedIds: [], action: 'SUMMON', target: 'MY_FIELD' });
                return;
            }
        }

        if (actionType === 'ACTIVATE') {
            const spellName = selectedHandCard.cardName;
            if (spellName === 'A Beasts Revival') {
                const combinedGy = [...boardData.player.graveyard, ...boardData.opponent.graveyard].filter(c => c.cardType.toUpperCase().includes('MONSTER'));
                if (combinedGy.length === 0) {
                    alert("Nema čudovišta u grobljima za prizivanje!");
                    return;
                }
                setGyModal({ isOpen: true, cards: combinedGy, owner: 'Zajedničko' });
                setTributeState({ active: true, needed: 1, selectedIds: [], action: 'ACTIVATE', target: 'ANY_GY' });
                return;
            }
            if (spellName === 'Chaotic Orb' || spellName === 'Dragons Call') {
                const oppMonsters = boardData.opponent.monsterZone.filter(c => c !== null).length;
                if (oppMonsters === 0) {
                    alert("Protivnik nema čudovišta na polju!");
                    return;
                }
                alert("Odaberi protivnikovo čudovište za uništenje!");
                setTributeState({ active: true, needed: 1, selectedIds: [], action: 'ACTIVATE', target: 'OPP_FIELD' });
                return;
            }
        }
        executeAction(actionType, []);
    };

    const executeAction = async (actionType, tributeIds) => {
        try {
            const newData = await gameAPI.playCard(selectedHandCard.cardId, actionType, tributeIds);
            setBoardData(newData);
            setSelectedHandCard(null);
            setTributeState({ active: false, needed: 0, selectedIds: [] });
        } catch (err) {
            alert(err.message || "Greška pri izvršavanju akcije!");
            setTributeState({ active: false, needed: 0, selectedIds: [], action: null, target: null });
        }
    };

    const handlePlayerMonsterClick = (card) => {
        if (!card) return;
        if (tributeState.active && tributeState.target === 'MY_FIELD') {
            if (tributeState.selectedIds.includes(card.cardId)) return;
            const newSelected = [...tributeState.selectedIds, card.cardId];
            if (newSelected.length === tributeState.needed) {
                executeAction(tributeState.action, newSelected);
            } else {
                setTributeState({ ...tributeState, selectedIds: newSelected });
            }
            return;
        }
        if (currentPhase === 'BP') {
            if (attackingMonster && attackingMonster.cardId === card.cardId) {
                setAttackingMonster(null);
            } else {
                setAttackingMonster(card);
            }
        }
    };

    const handleOpponentMonsterClick = async (targetCard) => {
        if (tributeState.active && tributeState.target === 'OPP_FIELD') {
            if (!targetCard) return;
            setTributeState({ active: false, needed: 0, selectedIds: [], action: null, target: null });
            executeAction(tributeState.action, [targetCard.cardId]);
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

    const handleDownloadPDF = async () => {
        try {
            // Šaljemo trenutni boardData na backend da ga on obradi
            const blob = await gameAPI.downloadStatistics(boardData);

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'YGO_Analiza_Poteza.pdf';
            document.body.appendChild(a);
            a.click();

            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            alert("Došlo je do greške pri dohvaćanju PDF-a s backenda!");
        }
    };

    const CardSlot = ({ card, type, isOpponent = false, label = "", onClick = null }) => {
        const CARD_BACK = `${BACKEND_URL}/images/cards/card_back.jpg`;
        const bgImage = (type === 'deck' || type === 'extra') && !card ? `url(${CARD_BACK})` : 'none';

        const isAttacking = attackingMonster?.cardId === card?.cardId;
        const isTributeSelected = tributeState.selectedIds.includes(card?.cardId);

        let borderStyle = '2px solid #555';
        if (isAttacking) borderStyle = '3px solid red';
        if (isTributeSelected) borderStyle = '3px solid purple';

        const isCardFacedown = card?.facedown === true && !isGameOver;
        const containerClass = `card-slot-container ${isCardFacedown ? 'is-facedown' : ''}`;

        const displayImageUrl = card
            ? (isOpponent && isCardFacedown ? CARD_BACK : `${BACKEND_URL}${card.imageUrl}`)
            : '';

        return (
            <div
                onMouseEnter={() => {
                    if (card) {
                        if (isOpponent && isCardFacedown) {
                            setHoveredCard({
                                cardName: "Nepoznata karta",
                                cardType: "???",
                                imageUrl: "/images/cards/card_back.jpg",
                                cardAttack: null,
                                cardDefense: null
                            });
                        } else {
                            setHoveredCard(card);
                        }
                    }
                }}
                onClick={() => onClick && onClick(card)}
                className={containerClass}
                style={{
                    flex: '1 1 0',
                    maxWidth: '85px',
                    maxHeight: '13vh', // Ograničava visinu da ne probije kontejner na laptopima
                    aspectRatio: '59 / 86',
                    border: borderStyle,
                    backgroundColor: '#222',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    cursor: onClick ? 'pointer' : 'default',
                    backgroundImage: bgImage,
                    backgroundSize: 'cover',
                    borderRadius: '4px',
                    overflow: 'hidden'
                }}
            >
                {label && !card && type !== 'deck' && type !== 'extra' && (
                    <span style={{ color: '#555', fontSize: 'clamp(10px, 1vw, 12px)', fontWeight: 'bold', position: 'absolute' }}>{label}</span>
                )}

                {card && (
                    <div className="card-image-wrapper" style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <img
                            src={displayImageUrl}
                            alt="card-front"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: isOpponent && !isCardFacedown ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}
                        />
                        {isCardFacedown && !isOpponent && (
                            <img src={CARD_BACK} alt="card-back" className="card-back-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2 }} />
                        )}
                    </div>
                )}
            </div>
        );
    };


    const canDoMainPhaseActions = ['MP1', 'MP2'].includes(currentPhase);
    const opponentTopGyCard = boardData.opponent.graveyard && boardData.opponent.graveyard.length > 0 ? boardData.opponent.graveyard[boardData.opponent.graveyard.length - 1] : null;
    const playerTopGyCard = boardData.player.graveyard && boardData.player.graveyard.length > 0 ? boardData.player.graveyard[boardData.player.graveyard.length - 1] : null;

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#111', color: 'white', overflow: 'hidden' }}>

            {/* LIJEVI STUPAC: INFO PANEL */}
            <div style={{ width: '25%', minWidth: '250px', maxWidth: '350px', padding: '20px', borderRight: '2px solid #444', display: 'flex', flexDirection: 'column', position: 'relative', overflowY: 'auto' }}>
                <h2 style={{ textAlign: 'center', borderBottom: '1px solid #444', paddingBottom: '10px', fontSize: 'clamp(16px, 1.5vw, 24px)' }}>Detalji Karte</h2>

                {selectedHandCard || hoveredCard ? (
                    <div style={{ marginBottom: '150px' }}>
                        <img src={`${BACKEND_URL}${(selectedHandCard || hoveredCard).imageUrl}`} alt="preview" style={{ width: '100%', borderRadius: '8px', marginBottom: '15px', boxShadow: '0 4px 8px rgba(0,0,0,0.5)' }} />
                        <h3 style={{ margin: '0 0 10px 0', color: '#e5a822' }}>{(selectedHandCard || hoveredCard).cardName}</h3>
                        <p style={{ margin: '5px 0' }}><b>Tip:</b> {(selectedHandCard || hoveredCard).cardType}</p>
                        {(selectedHandCard || hoveredCard).cardType === 'MONSTER' && <p style={{ margin: '5px 0' }}><b>ATK:</b> {(selectedHandCard || hoveredCard).cardAttack} / <b>DEF:</b> {(selectedHandCard || hoveredCard).cardDefense}</p>}
                    </div>
                ) : <p style={{ color: '#888', textAlign: 'center', marginTop: '50px' }}>Prijeđi mišem preko polja.</p>}

                {/* IZBORNIK AKCIJA */}
                {selectedHandCard && !tributeState.active && canDoMainPhaseActions && !isGameOver && (
                    <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', backgroundColor: '#222', padding: '15px', borderRadius: '8px', border: '1px solid #e5a822' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#00ffff', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            <span style={{ fontSize: '12px' }}>⚡ AI Analiza Poteza ⚡</span>
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {selectedHandCard.cardType === 'MONSTER' && (
                                <div style={actionRowStyle}>
                                    <button onClick={() => handleActionClick('SUMMON')} style={{ ...actionBtnStyle, flex: 1, textAlign: 'left', paddingLeft: '15px' }}>Normal Summon</button>
                                    <div style={getProbabilityStyle(selectedHandCard.summonSuccessProb ?? 100)}>{selectedHandCard.summonSuccessProb ?? 100}%</div>
                                </div>
                            )}
                            {selectedHandCard.cardType === 'SPELL' && (
                                <div style={actionRowStyle}>
                                    <button onClick={() => handleActionClick('ACTIVATE')} style={{ ...actionBtnStyle, flex: 1, textAlign: 'left', paddingLeft: '15px' }}>Activate</button>
                                    <div style={getProbabilityStyle(selectedHandCard.activateSuccessProb ?? 100)}>{selectedHandCard.activateSuccessProb ?? 100}%</div>
                                </div>
                            )}
                            {(selectedHandCard.cardType === 'SPELL' || selectedHandCard.cardType === 'TRAP') && (
                                <div style={actionRowStyle}>
                                    <button onClick={() => handleActionClick('SET')} style={{ ...actionBtnStyle, flex: 1, textAlign: 'left', paddingLeft: '15px' }}>Set</button>
                                    <div style={getProbabilityStyle(100)}>100%</div>
                                </div>
                            )}
                            <button onClick={() => setSelectedHandCard(null)} style={{ ...actionBtnStyle, backgroundColor: '#555', color: 'white', marginTop: '5px' }}>Odustani</button>
                        </div>
                    </div>
                )}

                {/* IZBORNIK ZA NAPAD */}
                {attackingMonster && currentPhase === 'BP' && !isGameOver && (
                    <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', backgroundColor: '#222', padding: '15px', borderRadius: '8px', border: '1px solid red' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: 'red', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px' }}><span style={{ fontSize: '12px' }}>⚡ AI Analiza Napada ⚡</span></h4>
                        <p style={{ fontSize: '11px', color: '#aaa', textAlign: 'center', marginBottom: '10px' }}>Odaberi metu na protivničkom polju za napad.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={actionRowStyle}>
                                <div style={{ ...actionBtnStyle, backgroundColor: '#444', color: 'white', flex: 1, textAlign: 'left', paddingLeft: '15px', cursor: 'default' }}>Sigurnost Napada</div>
                                <div style={getProbabilityStyle(attackingMonster.attackSuccessProb ?? 100)}>{attackingMonster.attackSuccessProb ?? 100}%</div>
                            </div>
                            <button onClick={() => setAttackingMonster(null)} style={{ ...actionBtnStyle, backgroundColor: '#555', color: 'white', marginTop: '5px' }}>Odustani</button>
                        </div>
                    </div>
                )}
            </div>

            {/* DESNI STUPAC: POLJE */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minWidth: 0 }}>

                {/* STATISTIKA MODAL */}
                {isGameOver && (
                    <div style={{ position: 'absolute', top: '20px', right: '20px', width: '320px', backgroundColor: 'rgba(26, 26, 26, 0.95)', border: '2px solid #e5a822', borderRadius: '12px', padding: '20px', zIndex: 100, boxShadow: '0 10px 30px rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)' }}>
                        <h3 style={{ color: '#00ffff', margin: '0 0 15px 0', borderBottom: '1px solid #444', paddingBottom: '10px' }}>📊 Analiza Kruga</h3>
                        <p style={{ color: '#ddd', fontSize: '14px', marginBottom: '10px' }}>
                            Simulacija je završena. Sve protivničke karte su sada vidljive. Možete pregledati ploču i provjeriti jeste li donijeli prave odluke!
                        </p>
                        <div style={{ backgroundColor: '#111', padding: '10px', borderRadius: '6px', marginBottom: '15px' }}>
                            <p style={{ margin: '5px 0', fontSize: '13px' }}><b>Procjena AI agenta:</b></p>
                            <p style={{ margin: '0', color: '#00ff00', fontWeight: 'bold' }}>Uspješan Setup (+2)</p>
                        </div>
                        <button onClick={handleDownloadPDF} style={{ width: '100%', padding: '12px', backgroundColor: '#e5a822', color: 'black', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.target.style.backgroundColor = '#f7b92c'} onMouseOut={e => e.target.style.backgroundColor = '#e5a822'}>
                             Preuzmi Statistiku (PDF)
                        </button>
                    </div>
                )}

                {/* STATUS BAR */}
                <div style={{ flex: '0 0 auto', padding: '10px 20px', backgroundColor: '#222', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #444' }}>
                    <div style={{ color: 'red', fontWeight: 'bold', fontSize: 'clamp(14px, 1.5vw, 18px)' }}>SAIBA LP: {boardData.opponent.lifePoints}</div>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        {phases.map(phase => {
                            const isPast = phases.indexOf(phase) < phases.indexOf(currentPhase);
                            return (
                                <button key={phase} onClick={() => handlePhaseChange(phase)} disabled={isPast || isGameOver} style={{ padding: 'clamp(5px, 1vw, 8px) clamp(10px, 1.5vw, 15px)', fontSize: 'clamp(12px, 1vw, 14px)', fontWeight: 'bold', border: 'none', cursor: (isPast || isGameOver) ? 'not-allowed' : 'pointer', borderRadius: '4px', backgroundColor: currentPhase === phase ? '#e5a822' : (isPast ? '#111' : '#333'), color: currentPhase === phase ? 'black' : (isPast ? '#555' : 'white'), opacity: isPast ? 0.5 : 1 }}>
                                    {phase}
                                </button>
                            );
                        })}
                    </div>
                    <div style={{ color: '#00ff00', fontWeight: 'bold', fontSize: 'clamp(14px, 1.5vw, 18px)' }}>TVOJ LP: {boardData.player.lifePoints}</div>
                </div>

                {/* ARENA (Responzivni Flexbox bez izbacivanja sa ekrana) */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', padding: '15px', position: 'relative', overflow: 'hidden', minHeight: 0 }}>

                    {attackingMonster && boardStateHelper(boardData.opponent.monsterZone).every(c => c === null) && !isGameOver && (
                        <button onClick={() => handleOpponentMonsterClick(null)} style={{ position: 'absolute', top: '35%', padding: '15px 30px', backgroundColor: 'red', color: 'white', fontWeight: 'bold', fontSize: '18px', border: '2px solid white', cursor: 'pointer', zIndex: 10, borderRadius: '8px' }}>DIRECT ATTACK!</button>
                    )}

                    {/* PROTIVNIKOVA RUKA - Dodan onMouseEnter */}
                    <div style={{ display: 'flex', gap: '5px', height: '12%', minHeight: '60px', justifyContent: 'center', flexShrink: 0 }}>
                        {boardData.opponent.hand.map((card, i) => (
                            <div
                                key={`oh-${i}`}
                                onMouseEnter={() => {
                                    if (isGameOver) setHoveredCard(card);
                                    else setHoveredCard({ cardName: "Nepoznata karta", cardType: "???", imageUrl: "/images/cards/card_back.jpg", cardAttack: null, cardDefense: null });
                                }}
                                style={{ height: '100%', aspectRatio: '59/86', border: '1px solid #555', backgroundColor: '#111', borderRadius: '4px', overflow: 'hidden' }}
                            >
                                <img src={isGameOver ? `${BACKEND_URL}${card.imageUrl}` : `${BACKEND_URL}/images/cards/card_back.jpg`} alt="opponent-hand" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        ))}
                    </div>

                    {/* GLAVNO POLJE */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px', flex: 1, width: '100%', maxWidth: '700px', minHeight: 0 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <div style={{ display: 'flex', gap: '1vw', justifyContent: 'center' }}>
                                <CardSlot type="deck" />
                                {boardStateHelper(boardData.opponent.spellTrapZone).reverse().map((card, i) => <CardSlot key={`ost-${i}`} card={card} isOpponent={true} label="S/T" />)}
                                <CardSlot type="extra" />
                            </div>
                            <div style={{ display: 'flex', gap: '1vw', justifyContent: 'center' }}>
                                <CardSlot type="gy" card={opponentTopGyCard} isOpponent={true} label="GY" onClick={() => setGyModal({ isOpen: true, cards: boardData.opponent.graveyard, owner: 'Protivnikovo' })} />
                                {boardStateHelper(boardData.opponent.monsterZone).reverse().map((card, i) => <CardSlot key={`om-${i}`} card={card} isOpponent={true} label="Mon" onClick={card ? () => handleOpponentMonsterClick(card) : null} />)}
                                <CardSlot type="field" isOpponent={true} label="Field" />
                            </div>
                        </div>

                        <div style={{ width: '100%', height: '2px', backgroundColor: '#444', margin: '5px 0' }}></div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <div style={{ display: 'flex', gap: '1vw', justifyContent: 'center' }}>
                                <CardSlot type="field" label="Field" />
                                {boardStateHelper(boardData.player.monsterZone).map((card, i) => <CardSlot key={`pm-${i}`} card={card} label="Mon" onClick={() => handlePlayerMonsterClick(card)} />)}
                                <CardSlot type="gy" card={playerTopGyCard} label="GY" onClick={() => setGyModal({ isOpen: true, cards: boardData.player.graveyard, owner: 'Tvoje' })} />
                            </div>
                            <div style={{ display: 'flex', gap: '1vw', justifyContent: 'center' }}>
                                <CardSlot type="extra" />
                                {boardStateHelper(boardData.player.spellTrapZone).map((card, i) => <CardSlot key={`pst-${i}`} card={card} label="S/T" />)}
                                <CardSlot type="deck" />
                            </div>
                        </div>
                    </div>

                    {/* TVOJA RUKA */}
                    <div style={{ display: 'flex', gap: '5px', height: '15%', minHeight: '80px', justifyContent: 'center', alignItems: 'flex-end', flexShrink: 0 }}>
                        {boardData.player.hand.map((card, i) => (
                            <div key={`ph-${i}`} onMouseEnter={() => setHoveredCard(card)} onClick={() => (canDoMainPhaseActions && !isGameOver) ? setSelectedHandCard(card) : null} style={{ height: '100%', aspectRatio: '59/86', cursor: (canDoMainPhaseActions && !isGameOver) ? 'pointer' : 'default', border: selectedHandCard?.cardId === card.cardId ? '3px solid #e5a822' : '1px solid #888', borderRadius: '4px', overflow: 'hidden', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = (canDoMainPhaseActions && !isGameOver) ? 'translateY(-10px)' : 'none'} onMouseOut={e => e.currentTarget.style.transform = 'none'}>
                                <img src={`${BACKEND_URL}${card.imageUrl}`} alt="hand" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* GRAVEYARD MODAL */}
                {gyModal.isOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '12px', width: '80%', maxWidth: '800px', maxHeight: '80vh', overflowY: 'auto', border: '3px solid #e5a822' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
                                <h2 style={{ color: '#e5a822', margin: 0 }}>{gyModal.owner} Groblje</h2>
                                <button onClick={() => setGyModal({ isOpen: false, cards: [], owner: '' })} style={{ padding: '10px 20px', backgroundColor: 'red', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '5px' }}>X Zatvori</button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                                {gyModal.cards && gyModal.cards.length > 0 ? (
                                    gyModal.cards.map((c, i) => (
                                        <div key={`gy-card-${i}`} style={{ width: '100px', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: tributeState.active && tributeState.target === 'ANY_GY' && c.cardType === 'MONSTER' ? '0 0 15px #00ff00' : 'none', borderRadius: '4px' }} onMouseEnter={() => setHoveredCard(c)} onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'} onClick={() => { if (tributeState.active && tributeState.target === 'ANY_GY') { if (c.cardType !== 'MONSTER') { alert("Moraš odabrati čudovište!"); return; } setGyModal({ isOpen: false, cards: [], owner: '' }); executeAction(tributeState.action, [c.cardId]); } }}>
                                            <img src={`${BACKEND_URL}${c.imageUrl}`} alt={c.cardName} style={{ width: '100%', borderRadius: '4px', border: '1px solid #555' }} />
                                        </div>
                                    ))
                                ) : <p style={{ color: '#aaa', fontSize: '18px' }}>Ovo groblje je prazno.</p>}
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
const actionRowStyle = { display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#333', borderRadius: '4px', padding: '2px' };

const getProbabilityStyle = (prob) => {
    let bgColor = '#00ff00';
    let color = 'black';
    if (prob < 50) { bgColor = '#ff3333'; color = 'white'; }
    else if (prob < 85) { bgColor = '#ffcc00'; }
    return { padding: '10px 8px', backgroundColor: bgColor, color: color, fontWeight: 'bold', fontSize: '13px', borderRadius: '4px', minWidth: '45px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.5)', boxShadow: 'inset 0 0 5px rgba(0,0,0,0.2)' };
};

export default GameBoard;