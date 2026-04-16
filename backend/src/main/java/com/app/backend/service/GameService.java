package com.app.backend.service;

import com.app.backend.dto.BoardSetupDTO;
import com.app.backend.dto.CardDTO;
import com.app.backend.model.GameState;
import com.app.backend.model.PlayerState;
import com.app.backend.model.Deck;
import com.app.backend.repository.DeckRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class GameService {

    @Autowired
    private DeckRepository deckRepository;

    public GameState initializeGame(BoardSetupDTO setup) {
        GameState gameState = new GameState();

        // 1. Postavi polje iz kastomizacije
        setupSide(gameState.getPlayer(), setup.getPlayer());
        setupSide(gameState.getOpponent(), setup.getOpponent());

        // 2. Dohvati pune dekove iz baze i napuni 'deck' listu (ono što nije na polju)
        fillRemainingDeck(gameState.getPlayer(), setup.getPlayerDeckName(), setup.getPlayer());

        String opponentDeckName = setup.getPlayerDeckName().equals("Mugi") ? "Saiba" : "Mugi";
        fillRemainingDeck(gameState.getOpponent(), opponentDeckName, setup.getOpponent());

        // 3. Promiješaj špilove
        Collections.shuffle(gameState.getPlayer().getDeck());
        Collections.shuffle(gameState.getOpponent().getDeck());

        // 4. Podijeli početne ruke (5 karata)
        for (int i = 0; i < 5; i++) {
            drawCard(gameState.getPlayer());
            drawCard(gameState.getOpponent());
        }

        return gameState;
    }

    private void setupSide(PlayerState state, BoardSetupDTO.SideSetup setup) {
        state.setMonsterZone(setup.getMonsterZone());
        state.setSpellTrapZone(setup.getSpellTrapZone());
        state.setGraveyard(setup.getGraveyard());
        state.setFieldZone(setup.getFieldZone());
    }

    private void fillRemainingDeck(PlayerState state, String deckName, BoardSetupDTO.SideSetup setup) {
        Deck fullDeck = deckRepository.findByDeckName(deckName).orElseThrow(() -> new RuntimeException("Greška: Špil pod nazivom '" + deckName + "' nije pronađen u bazi podataka!"));
        List<CardDTO> allCardsInDeck = new ArrayList<>();

        // Pretvaramo Entity u DTO
        fullDeck.getDeckCards().forEach(dc -> {
            for (int i = 0; i < dc.getQuantity(); i++) {
                CardDTO dto = new CardDTO();
                dto.setCardId(dc.getCard().getCardId());
                dto.setCardName(dc.getCard().getCardName());
                dto.setCardType(dc.getCard().getCardType().toString());
                dto.setCardAttack(dc.getCard().getCardAttack());
                dto.setCardDefense(dc.getCard().getCardDefense());
                dto.setImageUrl(dc.getCard().getImageUrl());
                allCardsInDeck.add(dto);
            }
        });

        // ODUZIMANJE KARATA KOJE SU VEĆ NA POLJU
        removeCards(allCardsInDeck, setup.getMonsterZone());
        removeCards(allCardsInDeck, setup.getSpellTrapZone());
        removeCards(allCardsInDeck, setup.getGraveyard());
        if (setup.getFieldZone() != null) {
            removeOneCard(allCardsInDeck, setup.getFieldZone().getCardId());
        }

        state.setDeck(allCardsInDeck);
    }

    private void removeCards(List<CardDTO> masterList, List<CardDTO> toRemove) {
        if (toRemove == null) return;
        for (CardDTO card : toRemove) {
            if (card != null) removeOneCard(masterList, card.getCardId());
        }
    }

    private void removeOneCard(List<CardDTO> masterList, Long cardId) {
        for (int i = 0; i < masterList.size(); i++) {
            if (masterList.get(i).getCardId().equals(cardId)) {
                masterList.remove(i);
                break;
            }
        }
    }

    public void drawCard(PlayerState player) {
        if (!player.getDeck().isEmpty()) {
            player.getHand().add(player.getDeck().remove(0));
        }
    }
}
