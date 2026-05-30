// StatusBar.jsx
import React from 'react';

const StatusBar = ({ boardData, currentPhase, phases, handlePhaseChange, isGameOver }) => {
    return (
        <div className="status-bar-container">
            <div className="lp-red">SAIBA LP: {boardData.opponent.lifePoints}</div>
            <div className="phases-gap">
                {phases.map(phase => {
                    const isPast = phases.indexOf(phase) < phases.indexOf(currentPhase);
                    return (
                        <button
                            key={phase}
                            onClick={() => handlePhaseChange(phase)}
                            disabled={isPast || isGameOver}
                            className="phase-btn"
                            style={{
                                cursor: (isPast || isGameOver) ? 'not-allowed' : 'pointer',
                                backgroundColor: currentPhase === phase ? '#e5a822' : (isPast ? '#111' : '#333'),
                                color: currentPhase === phase ? 'black' : (isPast ? '#555' : 'white'),
                                opacity: isPast ? 0.5 : 1
                            }}
                        >
                            {phase}
                        </button>
                    );
                })}
            </div>
            <div className="lp-green">TVOJ LP: {boardData.player.lifePoints}</div>
        </div>
    );
};

export default StatusBar;