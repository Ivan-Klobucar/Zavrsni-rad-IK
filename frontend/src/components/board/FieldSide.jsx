import React from 'react';
import CardZone from './CardZone';

export default function FieldSide({ isOpponent }) {
    const sideClass = isOpponent ? "field-side opponent" : "field-side";

    // Redoslijed u sredini:
    // Za igrača: Monsteri su gore (bliže sredini), S/T dolje. Za protivnika obrnuto.
    const topRowType = isOpponent ? "S/T" : "Monster";
    const bottomRowType = isOpponent ? "Monster" : "S/T";

    return (
        <div className={sideClass}>

            <div className="hand-container">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="hand-card"></div>)}
            </div>

            <div className="zones-container">
                {/* LIJEVI STUPAC (Iz perspektive igrača: Field Spell i Extra Deck) */}
                <div className="side-column">
                    <CardZone type={isOpponent ? "Extra" : "Field"} color={isOpponent ? "#552255" : "#225522"} />
                    <CardZone type={isOpponent ? "Field" : "Extra"} color={isOpponent ? "#225522" : "#552255"} />
                </div>

                {/* SREDIŠNJA MATRICA (5 Monster i 5 S/T zona) */}
                <div className="matrix-zones">
                    <div className="zone-row">
                        {[1, 2, 3, 4, 5].map(i => <CardZone key={`top-${i}`} type={topRowType} />)}
                    </div>
                    <div className="zone-row">
                        {[1, 2, 3, 4, 5].map(i => <CardZone key={`bottom-${i}`} type={bottomRowType} />)}
                    </div>
                </div>

                {/* DESNI STUPAC (Iz perspektive igrača: Graveyard i Main Deck) */}
                <div className="side-column">
                    <CardZone type={isOpponent ? "Deck" : "Grave"} color={isOpponent ? "#4a2511" : "#2c2c2c"} />
                    <CardZone type={isOpponent ? "Grave" : "Deck"} color={isOpponent ? "#2c2c2c" : "#4a2511"} />
                </div>
            </div>
        </div>
    );
}