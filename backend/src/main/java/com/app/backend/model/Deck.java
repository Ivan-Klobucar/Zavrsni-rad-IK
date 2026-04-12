package com.app.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "decks")
@Data
@NoArgsConstructor
@AllArgsConstructor

public class Deck{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "deckid")
    private Long deckId;

    @Column(name = "deck_name")
    private String deckName;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "deck_cards",
            joinColumns = @JoinColumn(name = "deck_id"),
            inverseJoinColumns = @JoinColumn(name = "card_id")
    )
    private List<Card> deckCards;
}
