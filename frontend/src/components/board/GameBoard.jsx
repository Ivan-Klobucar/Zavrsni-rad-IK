import React, { useState } from 'react';
import { gameAPI } from '../../services/api.js';
import '../../App.css';

import InfoPanel from './InfoPanel';
import PlayField from './PlayField';
import GraveyardModal from './GraveyardModal';

const GameBoard = ({ boardData: initialBoardData , onReset}) => {
    const [boardData, setBoardData] = useState(initialBoardData);
    const [hoveredCard, setHoveredCard] = useState(null);
    const [selectedHandCard, setSelectedHandCard] = useState(null);
    const [attackingMonster, setAttackingMonster] = useState(null);
    const [tributeState, setTributeState] = useState({ active: false, needed: 0, selectedIds: [] });
    const [isGameOver, setIsGameOver] = useState(false);
    const [gyModal, setGyModal] = useState({ isOpen: false, cards: [], owner: '' });

    const currentPhase = boardData?.currentPhase || 'MP1';
    const phases = ['DP', 'SP', 'MP1', 'BP', 'MP2', 'EP'];

    if (!boardData) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Učitavanje polja...</div>;

    const handlePhaseChange = async (targetPhase) => {
        const currentIndex = phases.indexOf(currentPhase);
        const targetIndex = phases.indexOf(targetPhase);
        if (targetIndex <= currentIndex) { alert("Ne možeš se vratiti u prijašnju fazu!"); return; }
        if (targetPhase === 'EP') { setIsGameOver(true); return; }
        try {
            const newData = await gameAPI.changePhase(targetPhase);
            setBoardData(newData); setAttackingMonster(null); setSelectedHandCard(null); setTributeState({ active: false, needed: 0, selectedIds: [] });
        } catch (e) { console.error("Greška pri promjeni faze", e); }
    };

    const handleActionClick = (actionType) => {
        if (!selectedHandCard) return;
        if (actionType === 'SUMMON') {
            if (boardData.player.hasNormalSummonedThisTurn) { alert("Već si iskoristio Normal Summon ovog poteza!"); return; }
            const cost = selectedHandCard.level || selectedHandCard.cardCost || 0;
            let tributesNeeded = 0;
            if (cost >= 5 && cost <= 6) tributesNeeded = 1;
            if (cost >= 7) tributesNeeded = 2;
            if (tributesNeeded > 0) {
                const myMonstersCount = boardData.player.monsterZone.filter(c => c !== null).length;
                if (myMonstersCount < tributesNeeded) { alert(`Nemaš dovoljno čudovišta za žrtvovanje! Potrebno: ${tributesNeeded}`); return; }
                setTributeState({ active: true, needed: tributesNeeded, selectedIds: [], action: 'SUMMON', target: 'MY_FIELD' });
                return;
            }
        }
        if (actionType === 'ACTIVATE') {
            const spellName = selectedHandCard.cardName;
            if (spellName === 'A Beasts Revival') {
                const combinedGy = [...boardData.player.graveyard, ...boardData.opponent.graveyard].filter(c => c.cardType.toUpperCase().includes('MONSTER'));
                if (combinedGy.length === 0) { alert("Nema čudovišta u grobljima za prizivanje!"); return; }
                setGyModal({ isOpen: true, cards: combinedGy, owner: 'Zajedničko' });
                setTributeState({ active: true, needed: 1, selectedIds: [], action: 'ACTIVATE', target: 'ANY_GY' });
                return;
            }
            if (spellName === 'Chaotic Orb' || spellName === 'Dragons Call') {
                const oppMonsters = boardData.opponent.monsterZone.filter(c => c !== null).length;
                if (oppMonsters === 0) { alert("Protivnik nema čudovišta na polju!"); return; }
                alert("Odaberi protivnikovo čudovište za uništenje!");
                setTributeState({ active: true, needed: 1, selectedIds: [], action: 'ACTIVATE', target: 'OPP_FIELD' });
                return;
            }
        }
        executeAction(actionType, []);
    };

    const executeAction = async (actionType, tributeIds) => {
        try {
            const newData = await gameAPI.playCard(selectedHandCard.cardId, actionType, tributeIds);
            setBoardData(newData); setSelectedHandCard(null); setTributeState({ active: false, needed: 0, selectedIds: [] });
        } catch (err) { alert(err.message || "Greška pri izvršavanju akcije!"); setTributeState({ active: false, needed: 0, selectedIds: [], action: null, target: null }); }
    };

    const handlePlayerMonsterClick = (card) => {
        if (!card) return;
        if (tributeState.active && tributeState.target === 'MY_FIELD') {
            if (tributeState.selectedIds.includes(card.cardId)) return;
            const newSelected = [...tributeState.selectedIds, card.cardId];
            if (newSelected.length === tributeState.needed) { executeAction(tributeState.action, newSelected); }
            else { setTributeState({ ...tributeState, selectedIds: newSelected }); }
            return;
        }
        if (currentPhase === 'BP') {
            if (attackingMonster && attackingMonster.cardId === card.cardId) { setAttackingMonster(null); }
            else { setAttackingMonster(card); }
        }
    };

    const handleOpponentMonsterClick = async (targetCard) => {
        if (tributeState.active && tributeState.target === 'OPP_FIELD') {
            if (!targetCard) return;
            setTributeState({ active: false, needed: 0, selectedIds: [], action: null, target: null });
            executeAction(tributeState.action, [targetCard.cardId]);
            return;
        }
        if (currentPhase !== 'BP') return;
        if (!attackingMonster) { alert("Prvo odaberi svoje čudovište s kojim želiš napasti!"); return; }
        try {
            const newData = await gameAPI.attack(attackingMonster.cardId, targetCard ? targetCard.cardId : null);
            setBoardData(newData); setAttackingMonster(null);
        } catch (err) { alert(err.message || "Greška pri napadu!"); }
    };

    const handleDownloadPDF = async () => {
        try {
            const blob = await gameAPI.downloadStatistics(boardData);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'YGO_Analiza_Poteza.pdf';
            document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
        } catch (error) { console.error(error); alert("Došlo je do greške pri dohvaćanju PDF-a s backenda!"); }
    };

    const handleResetGame = async () => {
        try {
            await gameAPI.resetGame(); // Javi backendu da obriše igru
            if (onReset) {
                onReset(); // Pozovi funkciju roditelja koja gasi ekran s pločom
            }
        } catch (error) {
            console.error(error);
            alert("Greška pri izlasku iz igre.");
        }
    };

    const canDoMainPhaseActions = ['MP1', 'MP2'].includes(currentPhase);
    const opponentTopGyCard = boardData.opponent.graveyard && boardData.opponent.graveyard.length > 0 ? boardData.opponent.graveyard[boardData.opponent.graveyard.length - 1] : null;
    const playerTopGyCard = boardData.player.graveyard && boardData.player.graveyard.length > 0 ? boardData.player.graveyard[boardData.player.graveyard.length - 1] : null;

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#111', color: 'white', overflow: 'hidden' }}>

            <InfoPanel
                selectedHandCard={selectedHandCard} hoveredCard={hoveredCard} tributeState={tributeState}
                canDoMainPhaseActions={canDoMainPhaseActions} isGameOver={isGameOver} attackingMonster={attackingMonster}
                currentPhase={currentPhase} handleActionClick={handleActionClick} setSelectedHandCard={setSelectedHandCard}
                setAttackingMonster={setAttackingMonster}
                aiSuggestions={boardData.aiSuggestions}
            />

            <PlayField
                boardData={boardData} currentPhase={currentPhase} phases={phases}
                handlePhaseChange={handlePhaseChange} isGameOver={isGameOver} attackingMonster={attackingMonster}
                handleOpponentMonsterClick={handleOpponentMonsterClick} setHoveredCard={setHoveredCard} setGyModal={setGyModal}
                opponentTopGyCard={opponentTopGyCard} playerTopGyCard={playerTopGyCard} handlePlayerMonsterClick={handlePlayerMonsterClick}
                canDoMainPhaseActions={canDoMainPhaseActions} setSelectedHandCard={setSelectedHandCard} selectedHandCard={selectedHandCard}
                tributeState={tributeState} handleDownloadPDF={handleDownloadPDF}
                handleResetGame={onReset}
            />

            <GraveyardModal
                gyModal={gyModal} setGyModal={setGyModal} tributeState={tributeState}
                setHoveredCard={setHoveredCard} executeAction={executeAction}
            />

        </div>
    );
};

export default GameBoard;