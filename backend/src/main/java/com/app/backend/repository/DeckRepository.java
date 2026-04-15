package com.app.backend.repository;
import com.app.backend.model.Deck;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DeckRepository extends JpaRepository<Deck, Long> {
    Optional<Deck> findByDeckName(String deckName); // Trebat će nam za traženje "Mugi" ili "Saiba"
}
