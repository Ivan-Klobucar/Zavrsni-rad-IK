package com.app.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "deck_cards")
@Data
@NoArgsConstructor
public class DeckCard {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "deck_id")
    @JsonIgnore
    private Deck deck;

    @ManyToOne
    @JoinColumn(name = "card_id")
    private Card card;

    @Column(name = "quantity")
    private Integer quantity = 1; // Defaultno 1 kopija
}
