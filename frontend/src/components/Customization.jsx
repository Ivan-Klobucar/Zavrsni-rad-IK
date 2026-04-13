import React from 'react';

// KLJUČNO: Mora imati 'export default' na početku
export default function Customization({ onReady }) {
    // Ovo ćemo kasnije puniti pravim podacima iz baze
    const mockCards = ["Blue-Eyes White Dragon", "Dark Magician", "Pot of Greed", "Monster Reborn", "Mirror Force"];

    return (
        <div style={styles.container}>
            <h1 style={{ color: '#ffd700' }}>Customization Phase</h1>
            <p>Odaberi karte iz svog deka i postavi ih na polje (Mockup)</p>

            <div style={styles.layout}>
                {/* Lijeva strana: tvoj dek */}
                <div style={styles.deckSection}>
                    <h3>Tvoj Deck</h3>
                    {mockCards.map((card, index) => (
                        <div key={index} style={styles.cardItem}>{card}</div>
                    ))}
                </div>

                {/* Desna strana: protivnikov dek */}
                <div style={styles.deckSection}>
                    <h3>Protivnikov Deck</h3>
                    {mockCards.slice(0, 3).map((card, index) => (
                        <div key={index} style={styles.cardItem}>{card} (Enemy)</div>
                    ))}
                </div>
            </div>

            <button onClick={onReady} style={styles.readyBtn}>
                READY - Start Duel
            </button>
        </div>
    );
}

const styles = {
    container: {
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#121212',
        color: 'white'
    },
    layout: {
        display: 'flex',
        gap: '50px',
        marginTop: '20px',
        marginBottom: '30px'
    },
    deckSection: {
        border: '1px solid #444',
        padding: '20px',
        borderRadius: '8px',
        width: '250px',
        background: '#1e1e1e'
    },
    cardItem: {
        padding: '8px',
        margin: '5px 0',
        background: '#333',
        border: '1px solid #555',
        cursor: 'pointer',
        fontSize: '14px'
    },
    readyBtn: {
        padding: '15px 40px',
        fontSize: '18px',
        backgroundColor: '#2ecc71',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontWeight: 'bold'
    }
};