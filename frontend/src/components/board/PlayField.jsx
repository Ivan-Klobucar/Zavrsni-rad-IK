import React from 'react';
import CardSlot from './CardSlot';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
const boardStateHelper = (zoneArray) => { const arr = [...(zoneArray || [])]; while (arr.length < 5) arr.push(null); return arr.slice(0, 5); };

const PlayField = ({ boardData, currentPhase, phases, handlePhaseChange, isGameOver, attackingMonster, handleOpponentMonsterClick, setHoveredCard, setGyModal, opponentTopGyCard, playerTopGyCard, handlePlayerMonsterClick, canDoMainPhaseActions, setSelectedHandCard, selectedHandCard, tributeState, handleDownloadPDF }) => {
    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', minWidth: 0 }}>

            {/* STATISTIKA MODAL */}
            {isGameOver && (
                <div style={{ position: 'absolute', top: '20px', right: '20px', width: '320px', backgroundColor: 'rgba(26, 26, 26, 0.95)', border: '2px solid #e5a822', borderRadius: '12px', padding: '20px', zIndex: 100, boxShadow: '0 10px 30px rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)' }}>
                    <h3 style={{ color: '#00ffff', margin: '0 0 15px 0', borderBottom: '1px solid #444', paddingBottom: '10px' }}>📊 Analiza Kruga</h3>
                    <p style={{ color: '#ddd', fontSize: '14px', marginBottom: '10px' }}>Simulacija je završena. Sve protivničke karte su sada vidljive. Možete pregledati ploču i provjeriti jeste li donijeli prave odluke!</p>
                    <div style={{ backgroundColor: '#111', padding: '10px', borderRadius: '6px', marginBottom: '15px' }}>
                        <p style={{ margin: '5px 0', fontSize: '13px' }}><b>Procjena AI agenta:</b></p>
                        <p style={{ margin: '0', color: '#00ff00', fontWeight: 'bold' }}>Uspješan Setup (+2)</p>
                    </div>
                    <button onClick={handleDownloadPDF} style={{ width: '100%', padding: '12px', backgroundColor: '#e5a822', color: 'black', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e => e.target.style.backgroundColor = '#f7b92c'} onMouseOut={e => e.target.style.backgroundColor = '#e5a822'}>Preuzmi Statistiku (PDF)</button>
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

            {/* ARENA */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', padding: '15px', position: 'relative', overflow: 'hidden', minHeight: 0 }}>
                {attackingMonster && boardStateHelper(boardData.opponent.monsterZone).every(c => c === null) && !isGameOver && (
                    <button onClick={() => handleOpponentMonsterClick(null)} style={{ position: 'absolute', top: '35%', padding: '15px 30px', backgroundColor: 'red', color: 'white', fontWeight: 'bold', fontSize: '18px', border: '2px solid white', cursor: 'pointer', zIndex: 10, borderRadius: '8px' }}>DIRECT ATTACK!</button>
                )}

                <div style={{ display: 'flex', gap: '5px', height: '12%', minHeight: '60px', justifyContent: 'center', flexShrink: 0 }}>
                    {boardData.opponent.hand.map((card, i) => (
                        <div key={`oh-${i}`} onMouseEnter={() => { if (isGameOver) setHoveredCard(card); else setHoveredCard({ cardName: "Nepoznata karta", cardType: "???", imageUrl: "/images/cards/card_back.jpg", cardAttack: null, cardDefense: null }); }} style={{ height: '100%', aspectRatio: '59/86', border: '1px solid #555', backgroundColor: '#111', borderRadius: '4px', overflow: 'hidden' }}>
                            <img src={isGameOver ? `${BACKEND_URL}${card.imageUrl}` : `${BACKEND_URL}/images/cards/card_back.jpg`} alt="opponent-hand" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '10px', flex: 1, width: '100%', maxWidth: '700px', minHeight: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div style={{ display: 'flex', gap: '1vw', justifyContent: 'center' }}>
                            <CardSlot type="deck" setHoveredCard={setHoveredCard} />
                            {boardStateHelper(boardData.opponent.spellTrapZone).reverse().map((card, i) => <CardSlot key={`ost-${i}`} card={card} isOpponent={true} label="S/T" setHoveredCard={setHoveredCard} isGameOver={isGameOver} />)}
                            <CardSlot type="extra" setHoveredCard={setHoveredCard} />
                        </div>
                        <div style={{ display: 'flex', gap: '1vw', justifyContent: 'center' }}>
                            <CardSlot type="gy" card={opponentTopGyCard} isOpponent={true} label="GY" onClick={() => setGyModal({ isOpen: true, cards: boardData.opponent.graveyard, owner: 'Protivnikovo' })} setHoveredCard={setHoveredCard} />
                            {boardStateHelper(boardData.opponent.monsterZone).reverse().map((card, i) => <CardSlot key={`om-${i}`} card={card} isOpponent={true} label="Mon" onClick={card ? () => handleOpponentMonsterClick(card) : null} setHoveredCard={setHoveredCard} attackingMonster={attackingMonster} tributeState={tributeState} isGameOver={isGameOver} />)}
                            <CardSlot type="field" isOpponent={true} label="Field" setHoveredCard={setHoveredCard} />
                        </div>
                    </div>

                    <div style={{ width: '100%', height: '2px', backgroundColor: '#444', margin: '5px 0' }}></div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div style={{ display: 'flex', gap: '1vw', justifyContent: 'center' }}>
                            <CardSlot type="field" label="Field" setHoveredCard={setHoveredCard} />
                            {boardStateHelper(boardData.player.monsterZone).map((card, i) => <CardSlot key={`pm-${i}`} card={card} label="Mon" onClick={() => handlePlayerMonsterClick(card)} setHoveredCard={setHoveredCard} attackingMonster={attackingMonster} tributeState={tributeState} />)}
                            <CardSlot type="gy" card={playerTopGyCard} label="GY" onClick={() => setGyModal({ isOpen: true, cards: boardData.player.graveyard, owner: 'Tvoje' })} setHoveredCard={setHoveredCard} />
                        </div>
                        <div style={{ display: 'flex', gap: '1vw', justifyContent: 'center' }}>
                            <CardSlot type="extra" setHoveredCard={setHoveredCard} />
                            {boardStateHelper(boardData.player.spellTrapZone).map((card, i) => <CardSlot key={`pst-${i}`} card={card} label="S/T" setHoveredCard={setHoveredCard} />)}
                            <CardSlot type="deck" setHoveredCard={setHoveredCard} />
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '5px', height: '15%', minHeight: '80px', justifyContent: 'center', alignItems: 'flex-end', flexShrink: 0 }}>
                    {boardData.player.hand.map((card, i) => (
                        <div key={`ph-${i}`} onMouseEnter={() => setHoveredCard(card)} onClick={() => (canDoMainPhaseActions && !isGameOver) ? setSelectedHandCard(card) : null} style={{ height: '100%', aspectRatio: '59/86', cursor: (canDoMainPhaseActions && !isGameOver) ? 'pointer' : 'default', border: selectedHandCard?.cardId === card.cardId ? '3px solid #e5a822' : '1px solid #888', borderRadius: '4px', overflow: 'hidden', transition: 'transform 0.2s' }} onMouseOver={e => e.currentTarget.style.transform = (canDoMainPhaseActions && !isGameOver) ? 'translateY(-10px)' : 'none'} onMouseOut={e => e.currentTarget.style.transform = 'none'}>
                            <img src={`${BACKEND_URL}${card.imageUrl}`} alt="hand" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PlayField;