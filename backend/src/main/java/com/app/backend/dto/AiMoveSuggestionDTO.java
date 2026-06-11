package com.app.backend.dto;

// sprema nuzne podatke za glavne AI sugestihje
public class AiMoveSuggestionDTO {
    private final Long cardId;
    private final String cardName;
    private final String action;
    private final double successProb;

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