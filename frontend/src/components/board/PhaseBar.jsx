// PhaseBar.jsx
import React from 'react';

export default function PhaseBar() {
    const phases = ['DP', 'SP', 'MP1', 'BP', 'MP2', 'ED'];

    return (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', padding: '10px 0', borderTop: '2px solid #555', borderBottom: '2px solid #555', margin: '10px 0' }}>
            {phases.map(phase => (
                <button key={phase} style={{ padding: '5px 15px', background: '#333', color: '#fff', border: '1px solid #777', cursor: 'pointer' }}>
                    {phase}
                </button>
            ))}
        </div>
    );
}