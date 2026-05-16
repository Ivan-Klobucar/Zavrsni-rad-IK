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
        setupSide(this.currentGame.getPlayer(), setup.getPlayer());
        setupSide(this.currentGame.getOpponent(), setup.getOpponent());

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

    private void setupSide(PlayerState state, BoardSetupDTO.SideSetup setup) {
        state.setMonsterZone(setup.getMonsterZone());
        state.setSpellTrapZone(setup.getSpellTrapZone());
        state.setGraveyard(setup.getGraveyard());
        state.setFieldZone(setup.getFieldZone());
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
                    p.getGraveyard().add(tributeMonster);
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
                if (tributes == null || tributes.isEmpty()) throw new RuntimeException("Moraš odabrati čudovište iz groblja!");
                Long targetId = tributes.get(0);

                CardDTO targetMonster = null;
                boolean foundInPlayerGy = false;

                // Provjeri tvoje groblje
                targetMonster = p.getGraveyard().stream().filter(c -> c.getCardId().equals(targetId)).findFirst().orElse(null);
                if (targetMonster != null) foundInPlayerGy = true;

                // Provjeri protivnikovo groblje ako nije u tvom
                if (targetMonster == null) {
                    targetMonster = currentGame.getOpponent().getGraveyard().stream().filter(c -> c.getCardId().equals(targetId)).findFirst().orElseThrow(() -> new RuntimeException("Čudovište nije pronađeno u grobljima!"));
                }

                // Makni iz groblja i stavi na polje
                if (foundInPlayerGy) p.getGraveyard().remove(targetMonster);
                else currentGame.getOpponent().getGraveyard().remove(targetMonster);

                placeCardInZone(p.getMonsterZone(), targetMonster);
            }
            // 3. SPECIFIČNI SPELL (Dragon/Spellcaster uništenje)
            else if (spellName.equalsIgnoreCase("Chaotic Orb") || spellName.equalsIgnoreCase("Dragons Call")) {
                boolean hasRequiredMonster = p.getMonsterZone().stream()
                        .filter(Objects::nonNull)
                        .anyMatch(c -> c.getCardName().contains("Dragon") || c.getCardName().contains("Spellcaster")); // Prilagodi prepoznavanje tipa

                if (!hasRequiredMonster) throw new RuntimeException("Moraš kontrolirati Dragona ili Spellcastera!");
                if (tributes == null || tributes.isEmpty()) throw new RuntimeException("Moraš odabrati protivnikovo čudovište!");

                Long targetId = tributes.get(0);
                CardDTO targetMonster = currentGame.getOpponent().getMonsterZone().stream()
                        .filter(c -> c != null && c.getCardId().equals(targetId))
                        .findFirst().orElseThrow(() -> new RuntimeException("Meta nije na polju!"));

                int tIndex = currentGame.getOpponent().getMonsterZone().indexOf(targetMonster);
                currentGame.getOpponent().getMonsterZone().set(tIndex, null);
                currentGame.getOpponent().getGraveyard().add(targetMonster);
            }

            p.getGraveyard().add(cardToPlay);

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
        Optional<CardDTO> trapOpt = game.getOpponent().getSpellTrapZone().stream()
                .filter(c -> c != null && c.isFacedown())
                .filter(c -> c.getCardName().equalsIgnoreCase("An Ambush") || c.getCardName().equalsIgnoreCase("Self-Destruct Sword"))
                .findFirst();

        if (trapOpt.isPresent()) {
            CardDTO trap = trapOpt.get();

            // Makni trap u groblje
            int trapIndex = game.getOpponent().getSpellTrapZone().indexOf(trap);
            game.getOpponent().getSpellTrapZone().set(trapIndex, null);

            trap.setFacedown(false);
            game.getOpponent().getGraveyard().add(trap);

            if (trap.getCardName().equalsIgnoreCase("An Ambush")) {
                // Pošalji SVA tvoja čudovišta u groblje
                game.getPlayer().getMonsterZone().stream()
                        .filter(Objects::nonNull)
                        .forEach(c -> game.getPlayer().getGraveyard().add(c));
                Collections.fill(game.getPlayer().getMonsterZone(), null);
            }
            else if (trap.getCardName().equalsIgnoreCase("Self-Destruct Sword")) {
                // Pošalji SAMO napadača u groblje
                int attackerIndex = game.getPlayer().getMonsterZone().indexOf(attacker);
                game.getPlayer().getMonsterZone().set(attackerIndex, null);
                game.getPlayer().getGraveyard().add(attacker);
            }
            return true; // Napad je prekinut
        }
        return false;
    }

    public GameState changePhase(String nextPhase) {
        if (currentGame == null) throw new RuntimeException("Igra nije pokrenuta!");
        currentGame.setCurrentPhase(nextPhase);

        if (nextPhase.equals("EP")) {
            currentGame.getPlayer().setHasNormalSummonedThisTurn(false);
            currentGame.getOpponent().setHasNormalSummonedThisTurn(false);
        }
        return currentGame;
    }
}