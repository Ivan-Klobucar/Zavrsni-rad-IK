package com.app.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Entity
@Table(name = "player_states")
@Data
@NoArgsConstructor
@AllArgsConstructor

public class PlayerState {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "player_id")
    private Long playerId;

    @Column(name = "life_points")
    private Integer lifePoints;

    @Transient
    private List<Card> hand;

    @Transient
    private List<Card> field;

    @Transient
    private List<Card> graveyard;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "deck_id")
    private Deck deck;
}
