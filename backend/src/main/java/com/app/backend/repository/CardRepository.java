package com.app.backend.repository;
import com.app.backend.model.Card;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CardRepository extends JpaRepository<Card, Long> {
    Optional<Card> findByCardName(String cardName); // Trebat će nam za traženje "Mugi" ili "Saiba"
}
