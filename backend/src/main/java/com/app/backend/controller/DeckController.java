package com.app.backend.controller;

import com.app.backend.model.Deck;
import com.app.backend.service.DeckService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/decks")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class DeckController {

    private final DeckService deckService;

    // sluzi za pozivanje potrebnog spila
    @GetMapping("/{deckName}")
    public ResponseEntity<Deck> getDeck(@PathVariable String deckName) {
        Deck deck = deckService.getDeckByName(deckName);
        return ResponseEntity.ok(deck);
    }
}
