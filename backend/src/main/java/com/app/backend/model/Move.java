package com.app.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "moves")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Move {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "move_id")
    private Long moveId;

    @Column(name = "action_type")
    private String actionType;

    @Column(name = "source_card")
    private String sourceCard;

    @Column(name = "target")
    private String target;

    @Column(name = "probability")
    private Double probability;

    @Column(name = "score")
    private Double score;
}
