import { useState } from "react";
import SetupModal from "./SetupModal";
import "../styles/game-board.css";

export default function GameBoard() {
    const [showModal, setShowModal] = useState(true);

    const renderFiveZones = (prefix) =>
        Array.from({ length: 5 }).map((_, i) => (
            <div key={`${prefix}-${i}`} className="zone">
                {prefix} {i + 1}
            </div>
        ));

    return (
        <div className="board-page">
            {showModal && <SetupModal onClose={() => setShowModal(false)} />}

            <div className="board-container">
                <div className="side-utility top-utility">
                    <div className="utility-zone">Opponent Deck</div>
                    <div className="utility-zone">Opponent Graveyard</div>
                    <div className="utility-zone">Opponent Extra</div>
                </div>

                <div className="player-side opponent-side">
                    <div className="zone-row spell-row">{renderFiveZones("Spell")}</div>
                    <div className="zone-row monster-row">{renderFiveZones("Monster")}</div>
                </div>

                <div className="board-divider">BATTLEFIELD</div>

                <div className="player-side player-side-bottom">
                    <div className="zone-row monster-row">{renderFiveZones("Monster")}</div>
                    <div className="zone-row spell-row">{renderFiveZones("Spell")}</div>
                </div>

                <div className="side-utility bottom-utility">
                    <div className="utility-zone">Player Deck</div>
                    <div className="utility-zone">Player Graveyard</div>
                    <div className="utility-zone">Player Extra</div>
                </div>
            </div>
        </div>
    );
}