// CardZone.jsx
import React from 'react';

export default function CardZone({ type, color = 'rgba(255,255,255,0.1)' }) {
    return (
        <div style={{
            width: '70px',
            height: '100px', // Pravokutnik okomito
            border: '2px dashed #666',
            backgroundColor: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            color: '#aaa',
            cursor: 'pointer'
        }}>
            {type}
        </div>
    );
}