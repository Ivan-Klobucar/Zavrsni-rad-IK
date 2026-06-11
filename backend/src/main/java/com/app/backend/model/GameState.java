package com.app.backend.model;

import com.app.backend.dto.TurnStatisticsDTO;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;


// state koji pamti situaciju igre i njeno stanje
@JsonIgnoreProperties(ignoreUnknown = true)
public class GameState {
    private PlayerState player;
    private PlayerState opponent;
    private String currentPhase;
    private String turnOwner;
    private TurnStatisticsDTO statistics;
    private java.util.List<com.app.backend.dto.AiMoveSuggestionDTO> aiSuggestions = new java.util.ArrayList<>();


    public GameState() {
        this.player = new PlayerState();
        this.opponent = new PlayerState();
        this.currentPhase = "MP1";
        this.turnOwner = "PLAYER";
    }

    public PlayerState getPlayer() { return player; }
    public void setPlayer(PlayerState player) { this.player = player; }
    public PlayerState getOpponent() { return opponent; }
    public void setOpponent(PlayerState opponent) { this.opponent = opponent; }
    public String getCurrentPhase() { return currentPhase; }
    public void setCurrentPhase(String currentPhase) { this.currentPhase = currentPhase; }
    public String getTurnOwner() { return turnOwner; }
    public void setTurnOwner(String turnOwner) { this.turnOwner = turnOwner; }
    public TurnStatisticsDTO getStatistics() { return statistics; }
    public void setStatistics(TurnStatisticsDTO statistics) { this.statistics = statistics; }
    public java.util.List<com.app.backend.dto.AiMoveSuggestionDTO> getAiSuggestions() { return aiSuggestions; }
    public void setAiSuggestions(java.util.List<com.app.backend.dto.AiMoveSuggestionDTO> aiSuggestions) { this.aiSuggestions = aiSuggestions; }
}