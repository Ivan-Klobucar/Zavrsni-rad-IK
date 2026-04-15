import React, { useState, useEffect } from 'react';
import { deckAPI } from '../services/api.js'; // Provjeri da je putanja do api.js točna

// URL tvog Spring Boot servera za dohvaćanje slika
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

const Customization = () => {
    const [deck, setDeck] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Funkcija za dohvaćanje deka pri učitavanju komponente
        const fetchDeck = async () => {
            try {
                // Za početak dohvaćamo 'Mugi' dek
                const deckData = await deckAPI.getByName('Mugi');
                setDeck(deckData);
                setLoading(false);
            } catch (err) {
                console.error("Greška pri dohvaćanju:", err);
                setError("Nisam uspio dohvatiti dek iz baze.");
                setLoading(false);
            }
        };

        fetchDeck();
    }, []);

    // Prikazi dok se podaci učitavaju
    if (loading) return <div>Učitavanje tvog deka...</div>;
    if (error) return <div>Greška: {error}</div>;
    if (!deck) return <div>Dek nije pronađen.</div>;

    return (
        <div className="customization-container" style={{ padding: '20px', color: 'white' }}>
            <h1>Deck: {deck.deckName}</h1>

            <div className="deck-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '20px',
                marginTop: '20px'
            }}>
                {deck.deckCards.map((deckCard) => {
                    const card = deckCard.card;
                    const quantity = deckCard.quantity;
                    // Spajamo localhost:8080 s putanjom iz baze (npr. /images/cards/sage_of_wisdom.jpg)
                    const fullImageUrl = `${BACKEND_URL}${card.imageUrl}`;

                    return (
                        <div key={card.cardId} className="card-item" style={{ textAlign: 'center' }}>
                            <div style={{ position: 'relative' }}>
                                {/* Prikaz slike */}
                                <img
                                    src={fullImageUrl}
                                    alt={card.cardName}
                                    style={{ width: '100%', borderRadius: '10px', boxShadow: '0 4px 8px rgba(0,0,0,0.5)' }}
                                />

                                {/* Oznaka količine (npr. "x3") ako ima više kopija */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '-10px',
                                    right: '-10px',
                                    backgroundColor: 'red',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '30px',
                                    height: '30px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    border: '2px solid white'
                                }}>
                                    x{quantity}
                                </div>
                            </div>
                            <h4 style={{ marginTop: '15px' }}>{card.cardName}</h4>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Customization;