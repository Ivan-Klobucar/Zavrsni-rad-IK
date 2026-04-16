package com.app.backend.dto;

import java.util.List;
import java.util.Map;

public class BoardSetupDTO {
    private String playerDeckName;
    private SideSetup player;
    private SideSetup opponent;

    // Getteri i Setteri
    public String getPlayerDeckName() { return playerDeckName; }
    public void setPlayerDeckName(String playerDeckName) { this.playerDeckName = playerDeckName; }
    public SideSetup getPlayer() { return player; }
    public void setPlayer(SideSetup player) { this.player = player; }
    public SideSetup getOpponent() { return opponent; }
    public void setOpponent(SideSetup opponent) { this.opponent = opponent; }

    public static class SideSetup {
        private CardDTO fieldZone;
        private List<CardDTO> monsterZone;
        private List<CardDTO> spellTrapZone;
        private List<CardDTO> graveyard;

        // Getteri i Setteri
        public CardDTO getFieldZone() { return fieldZone; }
        public void setFieldZone(CardDTO fieldZone) { this.fieldZone = fieldZone; }
        public List<CardDTO> getMonsterZone() { return monsterZone; }
        public void setMonsterZone(List<CardDTO> monsterZone) { this.monsterZone = monsterZone; }
        public List<CardDTO> getSpellTrapZone() { return spellTrapZone; }
        public void setSpellTrapZone(List<CardDTO> spellTrapZone) { this.spellTrapZone = spellTrapZone; }
        public List<CardDTO> getGraveyard() { return graveyard; }
        public void setGraveyard(List<CardDTO> graveyard) { this.graveyard = graveyard; }
    }
}
