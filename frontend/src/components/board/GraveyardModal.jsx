import React from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

// rijesava logiku i prikaz groblja
const GraveyardModal = ({ gyModal, setGyModal, tributeState, setHoveredCard, executeAction }) => {
    if (!gyModal.isOpen) return null;

    return (
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
    );
};

export default GraveyardModal;