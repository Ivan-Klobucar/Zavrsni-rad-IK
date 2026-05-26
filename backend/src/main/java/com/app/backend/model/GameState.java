package com.app.backend.model;

import com.app.backend.dto.CardDTO;
import com.app.backend.dto.TurnStatisticsDTO;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class GameState {
    private PlayerState player;
    private PlayerState opponent;
    private String currentPhase; // DP, SP, MP1, BP, MP2, EP
    private String turnOwner;    // "PLAYER" ili "OPPONENT"
    private TurnStatisticsDTO statistics;


    public GameState() {
        this.player = new PlayerState();
        this.opponent = new PlayerState();
        this.currentPhase = "MP1";
        this.turnOwner = "PLAYER";
    }

    // Getteri i Setteri
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
}