package com.app.backend.dto;



public class CardDTO {
    private Long cardId;
    private String cardName;
    private String cardType;
    private Integer cardAttack;
    private Integer cardDefense;
    private String imageUrl;
    private boolean isFacedown;

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
    public boolean isFacedown() { return isFacedown; }
    public void setFacedown(boolean facedown) { isFacedown = facedown; }
}
