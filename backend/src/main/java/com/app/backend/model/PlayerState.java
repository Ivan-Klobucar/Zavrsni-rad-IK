package com.app.backend.model;

import com.app.backend.dto.CardDTO;
import java.util.ArrayList;
import java.util.List;

public class PlayerState {
    private int lifePoints = 8000;
    private List<CardDTO> hand = new ArrayList<>();
    private List<CardDTO> deck = new ArrayList<>();
    private List<CardDTO> monsterZone = new ArrayList<>();
    private List<CardDTO> spellTrapZone = new ArrayList<>();
    private List<CardDTO> graveyard = new ArrayList<>();
    private CardDTO fieldZone;

    // Getteri i Setteri
    public int getLifePoints() { return lifePoints; }
    public void setLifePoints(int lifePoints) { this.lifePoints = lifePoints; }
    public List<CardDTO> getHand() { return hand; }
    public void setHand(List<CardDTO> hand) { this.hand = hand; }
    public List<CardDTO> getDeck() { return deck; }
    public void setDeck(List<CardDTO> deck) { this.deck = deck; }
    public List<CardDTO> getMonsterZone() { return monsterZone; }
    public void setMonsterZone(List<CardDTO> monsterZone) { this.monsterZone = monsterZone; }
    public List<CardDTO> getSpellTrapZone() { return spellTrapZone; }
    public void setSpellTrapZone(List<CardDTO> spellTrapZone) { this.spellTrapZone = spellTrapZone; }
    public List<CardDTO> getGraveyard() { return graveyard; }
    public void setGraveyard(List<CardDTO> graveyard) { this.graveyard = graveyard; }
    public CardDTO getFieldZone() { return fieldZone; }
    public void setFieldZone(CardDTO fieldZone) { this.fieldZone = fieldZone; }
}