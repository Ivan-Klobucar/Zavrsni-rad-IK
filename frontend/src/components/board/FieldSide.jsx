import React from 'react';
import CardZone from './CardZone';

export default function FieldSide({ isOpponent }) {
    // Ako je protivnik, prvo idu spellovi, pa monsteri (jer gledamo naopako),
    // a ruka je na vrhu.
    const layoutDirection = isOpponent ? 'column-reverse' : 'column';
    const handPosition = isOpponent ? { top: -30 } : { bottom: -30 };
    const deckPosition = isOpponent ? 'row-reverse' : 'row'; // Protivnikov desno = naše lijevo

    return (
        <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: layoutDirection,
            position: 'relative',
            justifyContent: 'center',
            gap: '10px'
        }}>

            {/* RUKA (Prikazana polovično) */}
            <div style={{
                position: 'absolute',
                ...handPosition,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '5px',
                height: '80px', // Ograničavamo visinu da se vidi samo pola karte
                overflow: 'hidden',
                zIndex: 10
            }}>
                {/* Primjer 5 karata u ruci */}
                {[1,2,3,4,5].map(i => <div key={i} style={styles.handCard}>Karta {i}</div>)}
            </div>

            {/* GLAVNO POLJE (Zone + Deck/Graveyard) */}
            <div style={{ display: 'flex', flexDirection: deckPosition, justifyContent: 'center', gap: '30px' }}>

                {/* 5x2 Matrica zona */}
                <div style={{ display: 'flex', flexDirection: layoutDirection, gap: '10px' }}>
                    {/* Red 1 (Monsteri ili Spellovi, ovisi tko gleda) */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {[1,2,3,4,5].map(i => <CardZone key={`row1-${i}`} type={isOpponent ? "S/T" : "Monster"} />)}
                    </div>
                    {/* Red 2 */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {[1,2,3,4,5].map(i => <CardZone key={`row2-${i}`} type={isOpponent ? "Monster" : "S/T"} />)}
                    </div>
                </div>

                {/* DECK i GRAVEYARD zona */}
                <div style={{ display: 'flex', flexDirection: layoutDirection, gap: '10px' }}>
                    <CardZone type="Deck" color="#4a2511" />
                    <CardZone type="Grave" color="#2c2c2c" />
                </div>

            </div>
        </div>
    );
}

const styles = {
    handCard: { width: '60px', height: '100px', backgroundColor: '#1e3a8a', border: '1px solid #fff', borderRadius: '4px' }
};