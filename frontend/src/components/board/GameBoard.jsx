import React from 'react';
import CardHover from './CardHover';
import FieldSide from './FieldSide';
import PhaseBar from './PhaseBar';

export default function GameBoard() {
    return (
        <div style={{ display: 'flex', width: '100%', height: '100%' }}>
            {/* LIJEVA STRANA: Hover prikaz */}
            <div style={{ width: '250px', borderRight: '2px solid #444', padding: '10px' }}>
                <CardHover />
            </div>

            {/* DESNA STRANA: Glavna ploča */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '10px' }}>

                {/* Protivnikovo polje (okrenuto) */}
                <FieldSide isOpponent={true} />

                {/* Središnja traka s fazama */}
                <PhaseBar />

                {/* Tvoje polje */}
                <FieldSide isOpponent={false} />

            </div>
        </div>
    );
}