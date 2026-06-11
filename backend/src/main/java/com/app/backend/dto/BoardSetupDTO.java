package com.app.backend.dto;

import java.util.List;

// sluzi za spremanje podataka sa kojima cemo pripremiti polje i igrace
public class BoardSetupDTO {
    private String playerDeckName;
    private SideSetup player;
    private SideSetup opponent;

    public String getPlayerDeckName() { return playerDeckName; }
    public void setPlayerDeckName(String playerDeckName) { this.playerDeckName = playerDeckName; }
    public SideSetup getPlayer() { return player; }
    public void setPlayer(SideSetup player) { this.player = player; }
    public SideSetup getOpponent() { return opponent; }
    public void setOpponent(SideSetup opponent) { this.opponent = opponent; }

    // priprema samog polja
    public static class SideSetup {
        private CardDTO fieldZone;
        private List<CardDTO> monsterZone;
        private List<CardDTO> spellTrapZone;
        private List<CardDTO> graveyard;
        private List<CardDTO> hand;

        public CardDTO getFieldZone() { return fieldZone; }
        public void setFieldZone(CardDTO fieldZone) { this.fieldZone = fieldZone; }
        public List<CardDTO> getMonsterZone() { return monsterZone; }
        public void setMonsterZone(List<CardDTO> monsterZone) { this.monsterZone = monsterZone; }
        public List<CardDTO> getSpellTrapZone() { return spellTrapZone; }
        public void setSpellTrapZone(List<CardDTO> spellTrapZone) { this.spellTrapZone = spellTrapZone; }
        public List<CardDTO> getGraveyard() { return graveyard; }
        public void setGraveyard(List<CardDTO> graveyard) { this.graveyard = graveyard; }
        public List<CardDTO> getHand() { return hand; }
        public void setHand(List<CardDTO> hand) { this.hand = hand; }
    }
}
