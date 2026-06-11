import React from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
const CARD_BACK = `${BACKEND_URL}/images/cards/card_back.jpg`;

// upotrebljava ga playfield, a sluzi za prikazivanje karte na pojedinom pravokutniku na polju
const CardSlot = ({ card, type, isOpponent = false, label = "", onClick = null, attackingMonster, tributeState, isGameOver, setHoveredCard }) => {
    const bgImage = (type === 'deck' || type === 'extra') && !card ? `url(${CARD_BACK})` : 'none';

    const isAttacking = attackingMonster?.cardId === card?.cardId;
    const isTributeSelected = tributeState?.selectedIds?.includes(card?.cardId);

    let borderStyle = '2px solid #555';
    if (isAttacking) borderStyle = '3px solid red';
    if (isTributeSelected) borderStyle = '3px solid purple';

    const isCardFacedown = card?.facedown === true && !isGameOver;
    const containerClass = `card-slot-container ${isCardFacedown ? 'is-facedown' : ''}`;

    const displayImageUrl = card
        ? (isOpponent && isCardFacedown ? CARD_BACK : `${BACKEND_URL}${card.imageUrl}`)
        : '';

    return (
        <div
            onMouseEnter={() => {
                if (card) {
                    if (isOpponent && isCardFacedown) {
                        setHoveredCard({ cardName: "Nepoznata karta", cardType: "???", imageUrl: "/images/cards/card_back.jpg", cardAttack: null, cardDefense: null });
                    } else {
                        setHoveredCard(card);
                    }
                }
            }}
            onClick={() => onClick && onClick(card)}
            className={containerClass}
            style={{
                flex: '1 1 0',
                maxWidth: '85px',
                maxHeight: '13vh',
                aspectRatio: '59 / 86',
                border: borderStyle,
                backgroundColor: '#222',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                cursor: onClick ? 'pointer' : 'default',
                backgroundImage: bgImage,
                backgroundSize: 'cover',
                borderRadius: '4px',
                overflow: 'hidden'
            }}
        >
            {label && !card && type !== 'deck' && type !== 'extra' && (
                <span style={{ color: '#555', fontSize: 'clamp(10px, 1vw, 12px)', fontWeight: 'bold', position: 'absolute' }}>{label}</span>
            )}

            {card && (
                <div className="card-image-wrapper" style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <img
                        src={displayImageUrl}
                        alt="card-front"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: isOpponent && !isCardFacedown ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }}
                    />
                    {isCardFacedown && !isOpponent && (
                        <img src={CARD_BACK} alt="card-back" className="card-back-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2 }} />
                    )}
                </div>
            )}
        </div>
    );
};

export default CardSlot;