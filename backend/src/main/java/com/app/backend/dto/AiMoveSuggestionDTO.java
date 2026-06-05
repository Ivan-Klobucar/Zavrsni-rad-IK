package com.app.backend.dto;

public class AiMoveSuggestionDTO {
    private Long cardId;
    private String cardName;
    private String action; // SUMMON, ATTACK, ACTIVATE
    private double successProb;

    public AiMoveSuggestionDTO(Long cardId, String cardName, String action, double successProb) {
        this.cardId = cardId;
        this.cardName = cardName;
        this.action = action;
        this.successProb = successProb;
    }

    public Long getCardId() { return cardId; }
    public String getCardName() { return cardName; }
    public String getAction() { return action; }
    public double getSuccessProb() { return successProb; }
}