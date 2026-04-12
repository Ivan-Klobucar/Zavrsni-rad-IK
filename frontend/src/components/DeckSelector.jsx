import "../styles/deck-selector.css";

export default function DeckSelector({ decks, onSelect }) {
    return (
        <div className="deck-selector-page">
            <div className="deck-selector-box">
                <h1>Yu-Gi-Oh! Simulator</h1>
                <p>Odaberi deck za simulaciju</p>

                {decks.map((deck) => (
                    <button
                        key={deck.id}
                        className="deck-option"
                        onClick={() => onSelect(deck)}
                    >
                        {deck.name}
                    </button>
                ))}
            </div>
        </div>
    );
}