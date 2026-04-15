package com.app.backend.repository;

import com.app.backend.model.Deck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface DeckRepository extends JpaRepository<Deck, Long> {

    // Dodajemo JOIN FETCH dc.card kako bi odmah povukli podatke o karti
    @Query("SELECT DISTINCT d FROM Deck d " +
            "LEFT JOIN FETCH d.deckCards dc " +
            "LEFT JOIN FETCH dc.card " +
            "WHERE d.deckName = :deckName")
    Optional<Deck> findByDeckName(@Param("deckName") String deckName);
}
