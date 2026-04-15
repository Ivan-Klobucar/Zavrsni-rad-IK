package com.app.backend.service;

import com.app.backend.model.Deck;
import com.app.backend.repository.DeckRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Transactional
public class DeckService {

    private final DeckRepository deckRepository;

    public Deck getDeckByName(String deckName) {
        return deckRepository.findByDeckName(deckName)
                .orElseThrow(() -> new RuntimeException("Deck nije pronađen: " + deckName));
    }
}
