package com.app.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class TurnStatisticsDTO {

    // Ekonomija čudovišta
    private int monstersGained = 0;               // Naša stvorena/prizvana čudovišta (+1)
    private int monstersLostNormal = 0;           // Naša uništena s < 2000 ATK (-1)
    private int monstersLostBoss = 0;             // Naša uništena s >= 2000 ATK (-2)
    private int monstersDestroyedNormal = 0;       // Protivnička uništena s < 2000 ATK (+1)
    private int monstersDestroyedBoss = 0;         // Protivnička uništena s >= 2000 ATK (+2)

    // AI Praćenje (Granica 85%)
    private int aiFollowedCount = 0;              // Koliko puta smo poslušali AI (Aktivno ili Pasivno)
    private int aiIgnoredCount = 0;               // Koliko puta nismo poslušali AI (Aktivno ili Pasivno)
    private String turnFeedback;

    // Dnevnik uništenja (npr. "Igračev 'Dark Magician' (2500 ATK) uništen je kartom 'Raigeki'")
    private List<String> destructionLog = new ArrayList<>();
    private java.util.List<String> actionLog = new java.util.ArrayList<>();

    public TurnStatisticsDTO() {}

    // Getteri i Setteri
    public int getMonstersGained() { return monstersGained; }
    public void setMonstersGained(int monstersGained) { this.monstersGained = monstersGained; }
    public int getMonstersLostNormal() { return monstersLostNormal; }
    public void setMonstersLostNormal(int monstersLostNormal) { this.monstersLostNormal = monstersLostNormal; }
    public int getMonstersLostBoss() { return monstersLostBoss; }
    public void setMonstersLostBoss(int monstersLostBoss) { this.monstersLostBoss = monstersLostBoss; }
    public int getMonstersDestroyedNormal() { return monstersDestroyedNormal; }
    public void setMonstersDestroyedNormal(int monstersDestroyedNormal) { this.monstersDestroyedNormal = monstersDestroyedNormal; }
    public int getMonstersDestroyedBoss() { return monstersDestroyedBoss; }
    public void setMonstersDestroyedBoss(int monstersDestroyedBoss) { this.monstersDestroyedBoss = monstersDestroyedBoss; }
    public int getAiFollowedCount() { return aiFollowedCount; }
    public void setAiFollowedCount(int aiFollowedCount) { this.aiFollowedCount = aiFollowedCount; }
    public int getAiIgnoredCount() { return aiIgnoredCount; }
    public void setAiIgnoredCount(int aiIgnoredCount) { this.aiIgnoredCount = aiIgnoredCount; }
    public List<String> getDestructionLog() { return destructionLog; }
    public void setDestructionLog(List<String> destructionLog) { this.destructionLog = destructionLog; }
    public String getTurnFeedback() { return turnFeedback; }
    public void setTurnFeedback(String turnFeedback) { this.turnFeedback = turnFeedback; }
    public java.util.List<String> getActionLog() { return actionLog; }
    public void setActionLog(java.util.List<String> actionLog) { this.actionLog = actionLog; }

    // Pomoćna metoda za lakše dodavanje zapisa o borbi/uništenju
    public void addDestructionLog(String cijaKarta, String imeKarte, int atk, String sKojomKartom) {
        this.destructionLog.add(String.format("• [%s] Čudovište '%s' (%d ATK) je uništeno pomoću karte '%s'.",
                cijaKarta.toUpperCase(), imeKarte, atk, sKojomKartom));
    }
}
