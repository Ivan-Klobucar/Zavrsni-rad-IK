package com.app.backend.service;

import java.util.Objects;
import com.app.backend.dto.BoardSetupDTO;
import com.app.backend.dto.CardDTO;
import com.app.backend.model.GameState;
import com.app.backend.model.PlayerState;
import com.app.backend.model.Deck;
import com.app.backend.repository.DeckRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class GameService {

    @Autowired
    private DeckRepository deckRepository;

    private GameState currentGame;

    public GameState initializeGame(BoardSetupDTO setup) {
        this.currentGame = new GameState();

        // 1. Postavi polje iz kastomizacije
        setupSide(this.currentGame.getPlayer(), setup.getPlayer(),"PLAYER");
        setupSide(this.currentGame.getOpponent(), setup.getOpponent(), "OPPONENT");

        maskInitialSpellsAndTraps(this.currentGame.getPlayer());
        maskInitialSpellsAndTraps(this.currentGame.getOpponent());

        // 2. Dohvati pune dekove iz baze i napuni 'deck' listu
        fillRemainingDeck(this.currentGame.getPlayer(), setup.getPlayerDeckName(), setup.getPlayer());

        String opponentDeckName = setup.getPlayerDeckName().equals("Mugi") ? "Saiba" : "Mugi";
        fillRemainingDeck(this.currentGame.getOpponent(), opponentDeckName, setup.getOpponent());

        // 3. Promiješaj špilove
        Collections.shuffle(this.currentGame.getPlayer().getDeck());
        Collections.shuffle(this.currentGame.getOpponent().getDeck());

        // 4. Podijeli početne ruke (5 karata)
        for (int i = 0; i < 5; i++) {
            drawCard(this.currentGame.getPlayer());
            drawCard(this.currentGame.getOpponent());
        }

        return this.currentGame;
    }

    private void maskInitialSpellsAndTraps(PlayerState playerState) {
        if (playerState.getSpellTrapZone() != null) {
            for (CardDTO card : playerState.getSpellTrapZone()) {
                // Ako u zoni postoji karta i ako je to TRAP (ili SPELL), okreni je licem prema dolje
                if (card != null && (card.getCardType().equals("TRAP") || card.getCardType().equals("SPELL"))) {
                    card.setFacedown(true);
                }
            }
        }
    }

    private void setupSide(PlayerState state, BoardSetupDTO.SideSetup setup, String owner) {
        state.setMonsterZone(setup.getMonsterZone());
        state.setSpellTrapZone(setup.getSpellTrapZone());
        state.setGraveyard(setup.getGraveyard());
        state.setFieldZone(setup.getFieldZone());

        assignOwnerToZone(state.getMonsterZone(), owner);
        assignOwnerToZone(state.getSpellTrapZone(), owner);
        assignOwnerToZone(state.getGraveyard(), owner);
        if (state.getFieldZone() != null) {
            state.getFieldZone().setOriginalOwner(owner);
        }
    }

    private void assignOwnerToZone(List<CardDTO> zone, String owner) {
        if (zone == null) return;
        for (CardDTO card : zone) {
            if (card != null) {
                card.setOriginalOwner(owner);
            }
        }
    }

    private void fillRemainingDeck(PlayerState state, String deckName, BoardSetupDTO.SideSetup setup) {
        Deck fullDeck = deckRepository.findByDeckName(deckName)
                .orElseThrow(() -> new RuntimeException("Greška: Špil pod nazivom '" + deckName + "' nije pronađen!"));
        List<CardDTO> allCardsInDeck = new ArrayList<>();

        fullDeck.getDeckCards().forEach(dc -> {
            for (int i = 0; i < dc.getQuantity(); i++) {
                CardDTO dto = new CardDTO();
                dto.setCardId(dc.getCard().getCardId());
                dto.setCardName(dc.getCard().getCardName());
                dto.setCardType(dc.getCard().getCardType().toString());
                dto.setCardAttack(dc.getCard().getCardAttack());
                dto.setCardDefense(dc.getCard().getCardDefense());
                dto.setImageUrl(dc.getCard().getImageUrl());
                dto.setCardCost(dc.getCard().getCardCost()); // Dodano da prebaci Cost iz entiteta
                allCardsInDeck.add(dto);
            }
        });

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

    private void placeCardInZone(List<CardDTO> zone, CardDTO card) {
        for (int i = 0; i < zone.size(); i++) {
            if (zone.get(i) == null) {
                zone.set(i, card);
                return;
            }
        }
        throw new RuntimeException("Nema slobodnog mjesta u zoni!");
    }

    // 2. Igranje karte iz ruke
    public GameState playCard(Long cardId, String action, List<Long> tributes) {
        if (currentGame == null) throw new RuntimeException("Igra nije nađena!");
        PlayerState p = currentGame.getPlayer();

        CardDTO cardToPlay = p.getHand().stream()
                .filter(Objects::nonNull)
                .filter(c -> c.getCardId().equals(cardId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Karta nije u ruci!"));

        // ------------------
        // LOGIKA ZA SUMMON
        // ------------------
        if (action.equals("SUMMON") && cardToPlay.getCardType().equals("MONSTER")) {
            if (p.isHasNormalSummonedThisTurn()) throw new RuntimeException("Već si iskoristio Normal Summon ovog poteza!");
            if (!currentGame.getCurrentPhase().equals("MP1") && !currentGame.getCurrentPhase().equals("MP2")) throw new RuntimeException("Summon je moguć samo u Main fazi!");

            int cost = cardToPlay.getCardCost() != null ? cardToPlay.getCardCost() : 0;
            int requiredTributes = 0;
            if (cost >= 5 && cost <= 6) requiredTributes = 1;
            else if (cost >= 7) requiredTributes = 2;

            if (requiredTributes > 0) {
                if (tributes == null || tributes.size() != requiredTributes) {
                    throw new RuntimeException("Nevaljan broj žrtava! Potrebno je: " + requiredTributes);
                }

                for (Long tributeId : tributes) {
                    CardDTO tributeMonster = p.getMonsterZone().stream()
                            .filter(m -> m != null && m.getCardId().equals(tributeId))
                            .findFirst()
                            .orElseThrow(() -> new RuntimeException("Odabrano čudovište za žrtvu nije na polju!"));

                    int tIndex = p.getMonsterZone().indexOf(tributeMonster);
                    p.getMonsterZone().set(tIndex, null);
                    sendToGraveyard(currentGame, tributeMonster);
                }
            }

            p.getHand().remove(cardToPlay);
            cardToPlay.setFacedown(false);
            placeCardInZone(p.getMonsterZone(), cardToPlay);
            p.setHasNormalSummonedThisTurn(true);

            checkOpponentSummonReactions(currentGame, cardToPlay);

        }
        // ------------------
        // LOGIKA ZA SET (Spells / Traps)
        // ------------------
        else if (action.equals("SET") && (cardToPlay.getCardType().equals("SPELL") || cardToPlay.getCardType().equals("TRAP"))) {
            p.getHand().remove(cardToPlay);
            cardToPlay.setFacedown(true); // OVO ŠALJE JSON "facedown": true
            placeCardInZone(p.getSpellTrapZone(), cardToPlay);
        }

        else if (action.equals("ACTIVATE") && cardToPlay.getCardType().equals("SPELL")) {
            if (!currentGame.getCurrentPhase().equals("MP1") && !currentGame.getCurrentPhase().equals("MP2")) throw new RuntimeException("Aktivacija magija moguća samo u Main fazi!");

            p.getHand().remove(cardToPlay);
            cardToPlay.setFacedown(false);

            String spellName = cardToPlay.getCardName();

            // 1. DARK HOLE: Uništava sve
            if (spellName.equalsIgnoreCase("Big Bang")) {
                p.getMonsterZone().stream().filter(Objects::nonNull).forEach(p.getGraveyard()::add);
                Collections.fill(p.getMonsterZone(), null);

                currentGame.getOpponent().getMonsterZone().stream().filter(Objects::nonNull).forEach(currentGame.getOpponent().getGraveyard()::add);
                Collections.fill(currentGame.getOpponent().getMonsterZone(), null);
            }
            // 2. MONSTER REBORN: Priziva iz groblja na tvoje polje
            else if (spellName.equalsIgnoreCase("A Beasts Revival")) {
                if (tributes == null || tributes.isEmpty()) throw new RuntimeException("Moraš odabrati metu iz groblja!");
                Long targetId = tributes.get(0);

                // Tražimo metu u oba groblja
                CardDTO targetMonster = p.getGraveyard().stream().filter(c -> c.getCardId().equals(targetId)).findFirst().orElse(null);
                if (targetMonster != null) {
                    p.getGraveyard().remove(targetMonster);
                } else {
                    targetMonster = currentGame.getOpponent().getGraveyard().stream().filter(c -> c.getCardId().equals(targetId)).findFirst()
                            .orElseThrow(() -> new RuntimeException("Karta nije u grobljima!"));
                    currentGame.getOpponent().getGraveyard().remove(targetMonster);
                }

                // Magija ide na polje pa u groblje
                placeCardInZone(p.getSpellTrapZone(), cardToPlay);
                int spellIndex = p.getSpellTrapZone().indexOf(cardToPlay);
                if (spellIndex != -1) p.getSpellTrapZone().set(spellIndex, null);

                // Prizivamo čudovište
                targetMonster.setFacedown(false);
                placeCardInZone(p.getMonsterZone(), targetMonster); // Ovo je Special Summon
            }
            // 3. SPECIFIČNI SPELL (Dragon/Spellcaster uništenje)
            else if (spellName.equalsIgnoreCase("Chaotic Orb") || spellName.equalsIgnoreCase("Dragons Call")) {
                boolean hasRequiredMonster = p.getMonsterZone().stream()
                        .filter(Objects::nonNull)
                        .anyMatch(c -> c.getCardName().equalsIgnoreCase("Sage Of Wisdom") || c.getCardName().equalsIgnoreCase("Bolt-Eyed Thunder Dragon"));

                if (!hasRequiredMonster) throw new RuntimeException("Moraš kontrolirati Sage Of Wisdom ili Bolt-Eyed Thunder Dragon!");
                if (tributes == null || tributes.isEmpty()) throw new RuntimeException("Moraš odabrati protivnikovo čudovište!");

                Long targetId = tributes.get(0);
                CardDTO targetMonster = currentGame.getOpponent().getMonsterZone().stream()
                        .filter(c -> c != null && c.getCardId().equals(targetId))
                        .findFirst().orElseThrow(() -> new RuntimeException("Meta nije na polju!"));

                // Magija ide na polje pa u groblje
                placeCardInZone(p.getSpellTrapZone(), cardToPlay);
                int spellIndex = p.getSpellTrapZone().indexOf(cardToPlay);
                if (spellIndex != -1) p.getSpellTrapZone().set(spellIndex, null);

                // Uništavanje mete
                int tIndex = currentGame.getOpponent().getMonsterZone().indexOf(targetMonster);
                currentGame.getOpponent().getMonsterZone().set(tIndex, null);
                sendToGraveyard(currentGame, targetMonster);
            }

            // Na kraju makni magiju iz ruke i pošalji u groblje (za obje magije)
            p.getHand().remove(cardToPlay);
            sendToGraveyard(currentGame, cardToPlay);
        } else {
            throw new RuntimeException("Nepoznata ili ilegalna akcija!");
        }

        return currentGame;
    }

    // 3. Napad
    public GameState attack(Long attackerId, Long targetId) {
        if (currentGame == null) throw new RuntimeException("Igra nije pokrenuta!");
        if (!currentGame.getCurrentPhase().equals("BP")) throw new RuntimeException("Napad samo u Battle fazi!");

        CardDTO attacker = currentGame.getPlayer().getMonsterZone().stream()
                .filter(c -> c != null && c.getCardId().equals(attackerId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Napadač nije pronađen na polju!"));

        if (attacker.isHasAttackedThisTurn()) {
            throw new RuntimeException("Ovo čudovište je već napalo ovog poteza!");
        }

        if (checkOpponentAttackReactions(currentGame, attacker)) {
            return currentGame;
        }

        if (targetId == null) {
            currentGame.getOpponent().setLifePoints(currentGame.getOpponent().getLifePoints() - attacker.getCardAttack());
        } else {
            CardDTO target = currentGame.getOpponent().getMonsterZone().stream()
                    .filter(c -> c != null && c.getCardId().equals(targetId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Meta nije pronađena na polju!"));

            int atk = attacker.getCardAttack();
            int def = target.getCardAttack();

            if (atk > def) {
                currentGame.getOpponent().setLifePoints(currentGame.getOpponent().getLifePoints() - (atk - def));
                int targetIndex = currentGame.getOpponent().getMonsterZone().indexOf(target);
                currentGame.getOpponent().getMonsterZone().set(targetIndex, null);
                currentGame.getOpponent().getGraveyard().add(target);

            } else if (atk < def) {
                currentGame.getPlayer().setLifePoints(currentGame.getPlayer().getLifePoints() - (def - atk));
                int attackerIndex = currentGame.getPlayer().getMonsterZone().indexOf(attacker);
                currentGame.getPlayer().getMonsterZone().set(attackerIndex, null);
                currentGame.getPlayer().getGraveyard().add(attacker);

            } else {
                int targetIndex = currentGame.getOpponent().getMonsterZone().indexOf(target);
                currentGame.getOpponent().getMonsterZone().set(targetIndex, null);
                currentGame.getOpponent().getGraveyard().add(target);

                int attackerIndex = currentGame.getPlayer().getMonsterZone().indexOf(attacker);
                currentGame.getPlayer().getMonsterZone().set(attackerIndex, null);
                currentGame.getPlayer().getGraveyard().add(attacker);
            }
        }
        attacker.setHasAttackedThisTurn(true);
        return currentGame;
    }

    // --- POMOĆNE METODE ---
    private void checkOpponentSummonReactions(GameState game, CardDTO summonedCard) {
        if (summonedCard.getCardAttack() >= 1000) {
            Optional<CardDTO> trapOpt = game.getOpponent().getSpellTrapZone().stream()
                    .filter(c -> c != null && c.isFacedown() && c.getCardName().equalsIgnoreCase("Bear Trap"))
                    .findFirst();

            if (trapOpt.isPresent()) {
                CardDTO trap = trapOpt.get();
                // 1. Makni Trap Hole u groblje
                int trapIndex = game.getOpponent().getSpellTrapZone().indexOf(trap);
                game.getOpponent().getSpellTrapZone().set(trapIndex, null);

                trap.setFacedown(false);
                game.getOpponent().getGraveyard().add(trap);

                // 2. Makni tvoje prizvano čudovište u groblje
                int monsterIndex = game.getPlayer().getMonsterZone().indexOf(summonedCard);
                game.getPlayer().getMonsterZone().set(monsterIndex, null);
                game.getPlayer().getGraveyard().add(summonedCard);

                // Opcijonalno: Prekidamo proces tako da obavijestimo frontend
            }
        }
    }

    // Provjera kod napada (Mirror Force & Sakuretsu Armor)
    // NAPOMENA: Dodan je CardDTO attacker kao parametar!
    private boolean checkOpponentAttackReactions(GameState game, CardDTO attacker) {
        List<CardDTO> stZone = game.getOpponent().getSpellTrapZone();

        // 1. PRIORITET: Tražimo An Ambush
        Optional<CardDTO> anAmbushOpt = stZone.stream()
                .filter(c -> c != null && c.getCardName().equalsIgnoreCase("An Ambush"))
                .findFirst();

        if (anAmbushOpt.isPresent()) {
            CardDTO trap = anAmbushOpt.get();
            stZone.set(stZone.indexOf(trap), null);
            sendToGraveyard(game, trap); // Trap ide u groblje

            // Sva tvoja čudovišta idu u groblje (vratit će se originalnom vlasniku!)
            game.getPlayer().getMonsterZone().stream()
                    .filter(Objects::nonNull)
                    .forEach(c -> sendToGraveyard(game, c));
            Collections.fill(game.getPlayer().getMonsterZone(), null);
            return true;
        }

        // 2. PRIORITET: Tražimo Sakuretsu Armor
        Optional<CardDTO> destructSwordOpt = stZone.stream()
                .filter(c -> c != null && c.getCardName().equalsIgnoreCase("Self-Destruct Sword"))
                .findFirst();

        if (destructSwordOpt.isPresent()) {
            CardDTO trap = destructSwordOpt.get();
            stZone.set(stZone.indexOf(trap), null);
            sendToGraveyard(game, trap);

            int attackerIndex = game.getPlayer().getMonsterZone().indexOf(attacker);
            game.getPlayer().getMonsterZone().set(attackerIndex, null);
            sendToGraveyard(game, attacker);
            return true;
        }

        return false;
    }

    public GameState changePhase(String nextPhase) {
        if (currentGame == null) throw new RuntimeException("Igra nije pokrenuta!");
        currentGame.setCurrentPhase(nextPhase);

        if (nextPhase.equals("EP")) {
            currentGame.getPlayer().setHasNormalSummonedThisTurn(false);
            currentGame.getOpponent().setHasNormalSummonedThisTurn(false);
            currentGame.getPlayer().getMonsterZone().stream()
                    .filter(Objects::nonNull)
                    .forEach(c -> c.setHasAttackedThisTurn(false));

            currentGame.getOpponent().getMonsterZone().stream()
                    .filter(Objects::nonNull)
                    .forEach(c -> c.setHasAttackedThisTurn(false));
        }
        return currentGame;
    }

    private void sendToGraveyard(GameState game, CardDTO card) {
        if (card == null) return;
        card.setFacedown(false); // Karta u groblju je uvijek otkrivena

        if ("OPPONENT".equals(card.getOriginalOwner())) {
            game.getOpponent().getGraveyard().add(card);
        } else {
            game.getPlayer().getGraveyard().add(card);
        }
    }
}