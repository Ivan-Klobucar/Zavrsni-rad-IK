import { useMemo, useState } from "react";
import "./App.css";

export default function App() {
    const sampleDecks = useMemo(
        () => [
            {
                id: 1,
                name: "Blue-Eyes Simple",
                cards: ["Blue-Eyes", "Kaibaman", "Burst Stream", "Trade-In", "Dragon Shrine"],
            },
            {
                id: 2,
                name: "Dark Magician Simple",
                cards: ["Dark Magician", "Magician Rod", "Circle", "Soul Servant", "Navigation"],
            },
        ],
        []
    );

    const [selectedDeck, setSelectedDeck] = useState("");
    const [gameStarted, setGameStarted] = useState(false);
    const [showSetupPopup, setShowSetupPopup] = useState(true);
    const [hands, setHands] = useState({ player: [], opponent: [] });

    const startSimulation = () => {
        const deck = sampleDecks.find((d) => String(d.id) === selectedDeck);
        if (!deck) return;

        setHands({
            player: deck.cards.slice(0, 5),
            opponent: Array(5).fill("Unknown Card"),
        });

        setGameStarted(true);
        setShowSetupPopup(false);
    };

    const renderZone = (label) => <div className="zone">{label}</div>;

    if (!selectedDeck) {
        return (
            <div className="page center-page">
                <div className="deck-selector">
                    <h1>Yu-Gi-Oh! Simulator</h1>
                    <p>Odaberi deck za testiranje</p>

                    {sampleDecks.map((deck) => (
                        <button
                            key={deck.id}
                            className="deck-button"
                            onClick={() => setSelectedDeck(String(deck.id))}
                        >
                            <strong>{deck.name}</strong>
                            <span>{deck.cards.length} demo karata</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="board-wrapper">
                <div className="board-header">
                    <h1>Polje igre</h1>
                    {!gameStarted && (
                        <button className="ready-button" onClick={startSimulation}>
                            Ready
                        </button>
                    )}
                </div>

                {showSetupPopup && !gameStarted && (
                    <div className="modal-overlay">
                        <div className="modal">
                            <h2>Prilagodba polja</h2>
                            <p>
                                Ovdje ćeš kasnije moći prilagoditi svoje i protivničko polje prije simulacije.
                            </p>
                            <button onClick={() => setShowSetupPopup(false)}>Zatvori</button>
                        </div>
                    </div>
                )}

                <div className="board-grid">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i}>{renderZone(`Opponent ${i + 1}`)}</div>
                    ))}
                </div>

                <div className="board-spacer" />

                <div className="board-grid">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i}>{renderZone(`Player ${i + 1}`)}</div>
                    ))}
                </div>

                {gameStarted && (
                    <div className="hand-section">
                        <h3>Tvoja početna ruka</h3>
                        <div className="hand-cards">
                            {hands.player.map((card, idx) => (
                                <div key={idx} className="card">
                                    {card}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
