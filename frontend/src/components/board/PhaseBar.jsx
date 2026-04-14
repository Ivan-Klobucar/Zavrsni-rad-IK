import React from 'react';

export default function PhaseBar() {
    const phases = ['DP', 'SP', 'MP1', 'BP', 'MP2', 'ED'];

    return (
        <div className="phase-bar">
            {phases.map(phase => (
                <button key={phase} className="phase-btn">
                    {phase}
                </button>
            ))}
        </div>
    );
}