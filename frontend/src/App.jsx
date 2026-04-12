import { useState } from "react";
import DeckSelector from "./components/DeckSelector";
import GameBoard from "./components/GameBoard";
import "./styles/app.css";

export default function App() {
    const [selectedDeck, setSelectedDeck] = useState(null);

    const sampleDecks = [
        { id: 1, name: "Blue-Eyes Simple" },
        { id: 2, name: "Dark Magician Simple" },
    ];

    return (
        <div className="app-shell">
            {!selectedDeck ? (
                <DeckSelector decks={sampleDecks} onSelect={setSelectedDeck} />
            ) : (
                <GameBoard selectedDeck={selectedDeck} />
            )}
        </div>
    );
}