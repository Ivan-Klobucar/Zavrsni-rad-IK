package com.app.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class CardDTO {
    private Long cardId;
    private String cardName;
    private String cardType;
    private Integer cardAttack;
    private Integer cardDefense;
    private String imageUrl;
    private Integer cardCost;
    private boolean facedown;
    private String originalOwner;
    private boolean hasAttackedThisTurn;
    private Double summonSuccessProb; // Može biti null za Spell/Trap
    private Double activateSuccessProb; // Za magije, trenutno 100.0
    private Double attackSuccessProb;

    public CardDTO() {}
    // Getteri i Setteri
    public Long getCardId() { return cardId; }
    public void setCardId(Long cardId) { this.cardId = cardId; }
    public String getCardName() { return cardName; }
    public void setCardName(String cardName) { this.cardName = cardName; }
    public String getCardType() { return cardType; }
    public void setCardType(String cardType) { this.cardType = cardType; }
    public Integer getCardAttack() { return cardAttack; }
    public void setCardAttack(Integer cardAttack) { this.cardAttack = cardAttack; }
    public Integer getCardDefense() { return cardDefense; }
    public void setCardDefense(Integer cardDefense) { this.cardDefense = cardDefense; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public boolean isFacedown() { return facedown; }
    public void setFacedown(boolean facedown) { this.facedown = facedown; }
    public Integer getCardCost() { return cardCost; }
    public void setCardCost(Integer cardCost) { this.cardCost = cardCost; }
    public String getOriginalOwner() { return originalOwner; }
    public void setOriginalOwner(String originalOwner) { this.originalOwner = originalOwner; }
    public boolean isHasAttackedThisTurn() { return hasAttackedThisTurn; }
    public void setHasAttackedThisTurn(boolean hasAttackedThisTurn) {this.hasAttackedThisTurn = hasAttackedThisTurn;}
    public Double getSummonSuccessProb() { return summonSuccessProb; }
    public void setActivateSuccessProb(Double activateSuccessProb) {this.activateSuccessProb = activateSuccessProb;}
    public Double getActivateSuccessProb() { return activateSuccessProb; }
    public void setSummonSuccessProb(Double summonSuccessProb) {this.summonSuccessProb = summonSuccessProb;}
    public Double getAttackSuccessProb() { return attackSuccessProb; }
    public void setAttackSuccessProb(Double attackSuccessProb) { this.attackSuccessProb = attackSuccessProb; }
}
