import React from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

const actionBtnStyle = { padding: '10px', backgroundColor: '#e5a822', color: 'black', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px' };
const actionRowStyle = { display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#333', borderRadius: '4px', padding: '2px' };

const getProbabilityStyle = (prob) => {
    let bgColor = '#00ff00'; let color = 'black';
    if (prob < 50) { bgColor = '#ff3333'; color = 'white'; } else if (prob < 85) { bgColor = '#ffcc00'; }
    return { padding: '10px 8px', backgroundColor: bgColor, color: color, fontWeight: 'bold', fontSize: '13px', borderRadius: '4px', minWidth: '45px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.5)', boxShadow: 'inset 0 0 5px rgba(0,0,0,0.2)' };
};

const InfoPanel = ({ selectedHandCard, hoveredCard, tributeState, canDoMainPhaseActions, isGameOver, attackingMonster, currentPhase, handleActionClick, setSelectedHandCard, setAttackingMonster, aiSuggestions }) => {
    return (
        <div style={{ width: '25%', minWidth: '250px', maxWidth: '350px', padding: '20px', borderRight: '2px solid #444', display: 'flex', flexDirection: 'column', position: 'relative', overflowY: 'auto' }}>
            <h2 style={{ textAlign: 'center', borderBottom: '1px solid #444', paddingBottom: '10px', fontSize: 'clamp(16px, 1.5vw, 24px)' }}>Detalji Karte</h2>

            {/* detalji karte */}
            {selectedHandCard || hoveredCard ? (
                <div style={{ marginBottom: '20px' }}>
                    <img src={`${BACKEND_URL}${(selectedHandCard || hoveredCard).imageUrl}`} alt="preview" style={{ width: '100%', borderRadius: '8px', marginBottom: '15px', boxShadow: '0 4px 8px rgba(0,0,0,0.5)' }} />
                    <h3 style={{ margin: '0 0 10px 0', color: '#e5a822' }}>{(selectedHandCard || hoveredCard).cardName}</h3>
                    <p style={{ margin: '5px 0' }}><b>Tip:</b> {(selectedHandCard || hoveredCard).cardType}</p>
                    {(selectedHandCard || hoveredCard).cardType === 'MONSTER' && <p style={{ margin: '5px 0' }}><b>ATK:</b> {(selectedHandCard || hoveredCard).cardAttack} / <b>DEF:</b> {(selectedHandCard || hoveredCard).cardDefense}</p>}
                </div>
            ) : <p style={{ color: '#888', textAlign: 'center', marginTop: '50px' }}>Prijeđi mišem preko polja.</p>}

            {/* savjet od aia o najuspjesnijim potezima */}
            {!isGameOver && aiSuggestions && aiSuggestions.length > 0 && (
                <div style={{ marginBottom: '160px', padding: '15px', backgroundColor: '#161616', border: '1px solid #444', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
                    <h3 style={{ color: '#00ffff', margin: '0 0 10px 0', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px', textTransform: 'uppercase' }}>
                        Preporuka Poteza
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <p style={{ fontSize: '12px', color: '#aaa', margin: '0 0 5px 0' }}>
                            Najveća šansa uspjeha: <b style={{color: '#00ff00'}}>{aiSuggestions[0].successProb}%</b>
                        </p>

                        {aiSuggestions.map((potez, index) => (
                            <div key={index} style={{ padding: '8px', backgroundColor: '#222', borderRadius: '6px', borderLeft: '4px solid #00ff00', fontSize: '13px' }}>
                                <div style={{ fontWeight: 'bold', color: '#fff' }}>{potez.cardName}</div>
                                <div style={{ fontSize: '11px', color: '#e5a822', marginTop: '2px', fontWeight: 'bold' }}>
                                    Akcija: <span style={{ textTransform: 'uppercase' }}>{potez.action}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* akcije koje mozemo sa pojedinom kartom */}
            {selectedHandCard && !tributeState.active && canDoMainPhaseActions && !isGameOver && (
                <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', backgroundColor: '#222', padding: '15px', borderRadius: '8px', border: '1px solid #e5a822' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#00ffff', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px' }}><span style={{ fontSize: '12px' }}>⚡ Izvrši Akciju ⚡</span></h4>
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

            {/* izbornik uza napad */}
            {attackingMonster && currentPhase === 'BP' && !isGameOver && (
                <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', backgroundColor: '#222', padding: '15px', borderRadius: '8px', border: '1px solid red' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: 'red', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px' }}><span style={{ fontSize: '12px' }}>⚡ Potvrda Napada ⚡</span></h4>
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
    );
};

export default InfoPanel;