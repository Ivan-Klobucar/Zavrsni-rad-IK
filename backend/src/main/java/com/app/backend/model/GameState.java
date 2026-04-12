package com.app.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "game_states")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class GameState {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "gamestate_id")
    private Long gameStateId;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "player_id")
    private PlayerState player;

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "opponent_id")
    private PlayerState opponent;

    @Column(name = "turn_number")
    private Integer turnNumber;

    @Column(name = "player_turn")
    private boolean playerTurn;
}
