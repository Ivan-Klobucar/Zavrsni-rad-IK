package com.app.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "cards")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Card {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "card_id")
    private Long cardId;

    @Column(name = "card_name", nullable = false)
    private String cardName;

    @Column(name = "card_type", nullable = false)
    private CardType cardType;

    @Column(name = "card_attack")
    private Integer cardAttack;

    @Column(name = "card_defense")
    private Integer cardDefense;

    @Column(name = "card_cost")
    private Integer cardCost;

    @Column(name = "card_effect")
    private String cardEffect;
}
