package com.app.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class TurnStatisticsDTO {

    // Ekonomija čudovišta
    private Integer monstersDestroyed = 0;
    private Integer monstersLost = 0;
    private Integer highAtkMonstersLost = 0; // Npr. čudovišta s 1500+ ATK

    // AI Usporedba
    private Integer aiFollowedSuccesses = 0;
    private Integer aiFollowedTotal = 0;
    private Integer aiIgnoredSuccesses = 0;
    private Integer aiIgnoredTotal = 0;

    // Logika poteza
    private List<String> actionLog = new ArrayList<>();

    public TurnStatisticsDTO() {}

    // Pomoćna metoda za računanje "Sume čudovišta"
    public int getMonsterSum() {
        return (monstersDestroyed != null ? monstersDestroyed : 0) - (monstersLost != null ? monstersLost : 0);
    }

    // Pomoćna metoda za ocjenu kruga
    public String getTurnVerdict() {
        int sum = getMonsterSum();
        if (sum > 0) return "USPJEŠAN (Pozitivna ekonomija resursa)";
        if (sum < 0) return "NEUSPJEŠAN (Gubitak ključnih resursa)";
        return "PASIVAN (Postavljanje ploče / Setup)";
    }

    // Getteri i Setteri
    public Integer getMonstersDestroyed() { return monstersDestroyed; }
    public void setMonstersDestroyed(Integer monstersDestroyed) { this.monstersDestroyed = monstersDestroyed; }
    public Integer getMonstersLost() { return monstersLost; }
    public void setMonstersLost(Integer monstersLost) { this.monstersLost = monstersLost; }
    public Integer getHighAtkMonstersLost() { return highAtkMonstersLost; }
    public void setHighAtkMonstersLost(Integer highAtkMonstersLost) { this.highAtkMonstersLost = highAtkMonstersLost; }
    public Integer getAiFollowedSuccesses() { return aiFollowedSuccesses; }
    public void setAiFollowedSuccesses(Integer aiFollowedSuccesses) { this.aiFollowedSuccesses = aiFollowedSuccesses; }
    public Integer getAiFollowedTotal() { return aiFollowedTotal; }
    public void setAiFollowedTotal(Integer aiFollowedTotal) { this.aiFollowedTotal = aiFollowedTotal; }
    public Integer getAiIgnoredSuccesses() { return aiIgnoredSuccesses; }
    public void setAiIgnoredSuccesses(Integer aiIgnoredSuccesses) { this.aiIgnoredSuccesses = aiIgnoredSuccesses; }
    public Integer getAiIgnoredTotal() { return aiIgnoredTotal; }
    public void setAiIgnoredTotal(Integer aiIgnoredTotal) { this.aiIgnoredTotal = aiIgnoredTotal; }
    public List<String> getActionLog() { return actionLog; }
    public void setActionLog(List<String> actionLog) { this.actionLog = actionLog; }
}
