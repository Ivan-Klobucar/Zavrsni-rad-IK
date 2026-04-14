import React from 'react';

export default function CardZone({ type, color = 'rgba(255,255,255,0.1)' }) {
    return (
        <div className="card-zone" style={{ backgroundColor: color }}>
            {type}
        </div>
    );
}