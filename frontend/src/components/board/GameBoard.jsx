import React from 'react';
import CardHover from './CardHover';
import FieldSide from './FieldSide';
import PhaseBar from './PhaseBar';

export default function GameBoard() {
    return (
        <div className="game-board">
            <div className="sidebar">
                <CardHover />
            </div>

            <div className="main-board">
                <FieldSide isOpponent={true} />
                <PhaseBar />
                <FieldSide isOpponent={false} />
            </div>
        </div>
    );
}