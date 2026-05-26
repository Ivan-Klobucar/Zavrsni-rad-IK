package com.app.backend.service;

import java.util.Objects;
import com.app.backend.dto.BoardSetupDTO;
import com.app.backend.dto.CardDTO;
import com.app.backend.dto.TurnStatisticsDTO;
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

        // Inicijalizacija objekta za statistiku!
        this.currentGame.setStatistics(new TurnStatisticsDTO());

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
        for (int i = this.currentGame.getPlayer().getHand().size(); i < 5; i++) {
            drawCard(this.currentGame.getPlayer());
        }
        for (int i = this.currentGame.getOpponent().getHand().size(); i < 5; i++) {
            drawCard(this.currentGame.getOpponent());
        }
        enrichHandWithProbabilities(this.currentGame);
        return this.currentGame;
    }

    // --- POMOĆNE METODE ZA STATISTIKU ---

    private void recordPlayerMonsterLost(CardDTO monster, String reason) {
        if (monster == null) return;
        TurnStatisticsDTO stats = currentGame.getStatistics();
        stats.setMonstersLost(stats.getMonstersLost() + 1);
        if (monster.getCardAttack() != null && monster.getCardAttack() >= 1500) {
            stats.setHighAtkMonstersLost(stats.getHighAtkMonstersLost() + 1);
        }
        stats.getActionLog().add("GUBITAK: " + monster.getCardName() + " (" + reason + ")");
    }

    private void recordOpponentMonsterDestroyed(CardDTO monster, String reason) {
        if (monster == null) return;
        TurnStatisticsDTO stats = currentGame.getStatistics();
        stats.setMonstersDestroyed(stats.getMonstersDestroyed() + 1);
        stats.getActionLog().add("USPJEH: Uništeno protivničko čudovište " + monster.getCardName() + " (" + reason + ")");
    }

    private void recordAiDecision(boolean followedAI, boolean isSuccess) {
        TurnStatisticsDTO stats = currentGame.getStatistics();
        if (followedAI) {
            stats.setAiFollowedTotal(stats.getAiFollowedTotal() + 1);
            if (isSuccess) stats.setAiFollowedSuccesses(stats.getAiFollowedSuccesses() + 1);
        } else {
            stats.setAiIgnoredTotal(stats.getAiIgnoredTotal() + 1);
            if (isSuccess) stats.setAiIgnoredSuccesses(stats.getAiIgnoredSuccesses() + 1);
        }
    }

    // ------------------------------------

    private void maskInitialSpellsAndTraps(PlayerState playerState) {
        if (playerState.getSpellTrapZone() != null) {
            for (CardDTO card : playerState.getSpellTrapZone()) {
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
        state.setHand(setup.getHand() != null ? setup.getHand() : new ArrayList<>());

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
                dto.setCardCost(dc.getCard().getCardCost());
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

    public GameState playCard(Long cardId, String action, List<Long> tributes) {
        if (currentGame == null) throw new RuntimeException("Igra nije nađena!");
        PlayerState p = currentGame.getPlayer();

        CardDTO cardToPlay = p.getHand().stream()
                .filter(Objects::nonNull)
                .filter(c -> c.getCardId().equals(cardId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Karta nije u ruci!"));

        if (action.equals("SUMMON") && cardToPlay.getCardType().equals("MONSTER")) {
            if (p.isHasNormalSummonedThisTurn()) throw new RuntimeException("Već si iskoristio Normal Summon ovog poteza!");
            if (!currentGame.getCurrentPhase().equals("MP1") && !currentGame.getCurrentPhase().equals("MP2")) throw new RuntimeException("Summon je moguć samo u Main fazi!");

            // AI Statistika za Summon (prag od 50%)
            double summonChance = calculateSummonSuccessRate(currentGame);
            boolean followedAI = summonChance >= 50.0;

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

                    recordPlayerMonsterLost(tributeMonster, "Žrtva za prizivanje");
                }
            }

            p.getHand().remove(cardToPlay);
            cardToPlay.setFacedown(false);
            placeCardInZone(p.getMonsterZone(), cardToPlay);
            p.setHasNormalSummonedThisTurn(true);

            boolean destroyedByTrap = checkOpponentSummonReactions(currentGame, cardToPlay);

            if (destroyedByTrap) {
                recordAiDecision(followedAI, false); // Prizivanje je propalo
            } else {
                recordAiDecision(followedAI, true);  // Prizivanje uspjelo
                currentGame.getStatistics().getActionLog().add("Korisnik je uspješno prizvao: " + cardToPlay.getCardName());
            }

        }
        else if (action.equals("SET") && (cardToPlay.getCardType().equals("SPELL") || cardToPlay.getCardType().equals("TRAP"))) {
            p.getHand().remove(cardToPlay);
            cardToPlay.setFacedown(true);
            placeCardInZone(p.getSpellTrapZone(), cardToPlay);
            currentGame.getStatistics().getActionLog().add("Korisnik je postavio kartu licem prema dolje.");
        }
        else if (action.equals("ACTIVATE") && cardToPlay.getCardType().equals("SPELL")) {
            if (!currentGame.getCurrentPhase().equals("MP1") && !currentGame.getCurrentPhase().equals("MP2")) throw new RuntimeException("Aktivacija magija moguća samo u Main fazi!");

            p.getHand().remove(cardToPlay);
            cardToPlay.setFacedown(false);

            String spellName = cardToPlay.getCardName();
            currentGame.getStatistics().getActionLog().add("Korisnik je aktivirao magiju: " + spellName);

            if (spellName.equalsIgnoreCase("Big Bang")) {
                p.getMonsterZone().stream().filter(Objects::nonNull).forEach(m -> {
                    p.getGraveyard().add(m);
                    recordPlayerMonsterLost(m, "Uništeno vlastitim Big Bangom");
                });
                Collections.fill(p.getMonsterZone(), null);

                currentGame.getOpponent().getMonsterZone().stream().filter(Objects::nonNull).forEach(m -> {
                    currentGame.getOpponent().getGraveyard().add(m);
                    recordOpponentMonsterDestroyed(m, "Uništeno Big Bangom");
                });
                Collections.fill(currentGame.getOpponent().getMonsterZone(), null);
            }
            else if (spellName.equalsIgnoreCase("A Beasts Revival")) {
                if (tributes == null || tributes.isEmpty()) throw new RuntimeException("Moraš odabrati metu iz groblja!");
                Long targetId = tributes.get(0);

                CardDTO targetMonster = p.getGraveyard().stream().filter(c -> c.getCardId().equals(targetId)).findFirst().orElse(null);
                if (targetMonster != null) {
                    p.getGraveyard().remove(targetMonster);
                } else {
                    targetMonster = currentGame.getOpponent().getGraveyard().stream().filter(c -> c.getCardId().equals(targetId)).findFirst()
                            .orElseThrow(() -> new RuntimeException("Karta nije u grobljima!"));
                    currentGame.getOpponent().getGraveyard().remove(targetMonster);
                }

                placeCardInZone(p.getSpellTrapZone(), cardToPlay);
                int spellIndex = p.getSpellTrapZone().indexOf(cardToPlay);
                if (spellIndex != -1) p.getSpellTrapZone().set(spellIndex, null);

                targetMonster.setFacedown(false);
                placeCardInZone(p.getMonsterZone(), targetMonster);
                currentGame.getStatistics().getActionLog().add("Uspješno oživljeno čudovište: " + targetMonster.getCardName());
            }
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

                placeCardInZone(p.getSpellTrapZone(), cardToPlay);
                int spellIndex = p.getSpellTrapZone().indexOf(cardToPlay);
                if (spellIndex != -1) p.getSpellTrapZone().set(spellIndex, null);

                int tIndex = currentGame.getOpponent().getMonsterZone().indexOf(targetMonster);
                currentGame.getOpponent().getMonsterZone().set(tIndex, null);
                sendToGraveyard(currentGame, targetMonster);

                recordOpponentMonsterDestroyed(targetMonster, "Uništeno magijom");
            }

            p.getHand().remove(cardToPlay);
            sendToGraveyard(currentGame, cardToPlay);
        } else {
            throw new RuntimeException("Nepoznata ili ilegalna akcija!");
        }
        enrichHandWithProbabilities(currentGame);
        return currentGame;
    }

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

        // AI Statistika za Napad
        double attackChance = calculateAttackSuccessRate(currentGame);
        boolean followedAI = attackChance >= 50.0;

        // Provjera zamki
        if (checkOpponentAttackReactions(currentGame, attacker)) {
            recordAiDecision(followedAI, false); // Napad zaustavljen zamkom = neuspjeh
            enrichHandWithProbabilities(currentGame);
            return currentGame;
        }

        if (targetId == null) {
            currentGame.getOpponent().setLifePoints(currentGame.getOpponent().getLifePoints() - attacker.getCardAttack());
            currentGame.getStatistics().getActionLog().add("Direktan napad! Nanesena šteta: " + attacker.getCardAttack());
            recordAiDecision(followedAI, true);
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

                recordOpponentMonsterDestroyed(target, "Uništeno u borbi");
                recordAiDecision(followedAI, true); // Borba uspješna

            } else if (atk < def) {
                currentGame.getPlayer().setLifePoints(currentGame.getPlayer().getLifePoints() - (def - atk));
                int attackerIndex = currentGame.getPlayer().getMonsterZone().indexOf(attacker);
                currentGame.getPlayer().getMonsterZone().set(attackerIndex, null);
                currentGame.getPlayer().getGraveyard().add(attacker);

                recordPlayerMonsterLost(attacker, "Uništeno napadom na jače čudovište");
                recordAiDecision(followedAI, false); // Borba neuspješna

            } else {
                int targetIndex = currentGame.getOpponent().getMonsterZone().indexOf(target);
                currentGame.getOpponent().getMonsterZone().set(targetIndex, null);
                currentGame.getOpponent().getGraveyard().add(target);

                int attackerIndex = currentGame.getPlayer().getMonsterZone().indexOf(attacker);
                currentGame.getPlayer().getMonsterZone().set(attackerIndex, null);
                currentGame.getPlayer().getGraveyard().add(attacker);

                recordOpponentMonsterDestroyed(target, "Obostrano uništenje");
                recordPlayerMonsterLost(attacker, "Obostrano uništenje");
                recordAiDecision(followedAI, false); // Tehnički gubitak resursa
            }
        }
        attacker.setHasAttackedThisTurn(true);
        enrichHandWithProbabilities(currentGame);
        return currentGame;
    }

    private boolean checkOpponentSummonReactions(GameState game, CardDTO summonedCard) {
        if (summonedCard.getCardAttack() >= 1000) {
            Optional<CardDTO> trapOpt = game.getOpponent().getSpellTrapZone().stream()
                    .filter(c -> c != null && c.isFacedown() && c.getCardName().equalsIgnoreCase("Bear Trap"))
                    .findFirst();

            if (trapOpt.isPresent()) {
                CardDTO trap = trapOpt.get();
                int trapIndex = game.getOpponent().getSpellTrapZone().indexOf(trap);
                game.getOpponent().getSpellTrapZone().set(trapIndex, null);
                trap.setFacedown(false);
                game.getOpponent().getGraveyard().add(trap);

                int monsterIndex = game.getPlayer().getMonsterZone().indexOf(summonedCard);
                game.getPlayer().getMonsterZone().set(monsterIndex, null);
                game.getPlayer().getGraveyard().add(summonedCard);

                recordPlayerMonsterLost(summonedCard, "Uništeno zamkom Bear Trap");
                return true;
            }
        }
        return false;
    }

    private boolean checkOpponentAttackReactions(GameState game, CardDTO attacker) {
        List<CardDTO> stZone = game.getOpponent().getSpellTrapZone();

        Optional<CardDTO> anAmbushOpt = stZone.stream()
                .filter(c -> c != null && c.getCardName().equalsIgnoreCase("An Ambush"))
                .findFirst();

        if (anAmbushOpt.isPresent()) {
            CardDTO trap = anAmbushOpt.get();
            stZone.set(stZone.indexOf(trap), null);
            sendToGraveyard(game, trap);

            game.getStatistics().getActionLog().add("KATASTROFA: Protivnik je aktivirao An Ambush!");
            game.getPlayer().getMonsterZone().stream()
                    .filter(Objects::nonNull)
                    .forEach(c -> {
                        sendToGraveyard(game, c);
                        recordPlayerMonsterLost(c, "Uništeno zamkom An Ambush");
                    });
            Collections.fill(game.getPlayer().getMonsterZone(), null);
            return true;
        }

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

            recordPlayerMonsterLost(attacker, "Uništeno zamkom Self-Destruct Sword");
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
        enrichHandWithProbabilities(currentGame);
        return currentGame;
    }

    private void sendToGraveyard(GameState game, CardDTO card) {
        if (card == null) return;
        card.setFacedown(false);

        if ("OPPONENT".equals(card.getOriginalOwner())) {
            game.getOpponent().getGraveyard().add(card);
        } else {
            game.getPlayer().getGraveyard().add(card);
        }
    }

    private double calculateSummonSuccessRate(GameState currentGame) {
        long setCardsCount = currentGame.getOpponent().getSpellTrapZone().stream()
                .filter(card -> card != null && card.isFacedown())
                .count();

        if (setCardsCount == 0) return 100.0;

        int initialThreats = 3;
        long threatsInGy = currentGame.getOpponent().getGraveyard().stream()
                .filter(card -> card.getCardName().equals("Bear Trap"))
                .count();

        long remainingThreats = initialThreats - threatsInGy;
        if (remainingThreats <= 0) return 100.0;

        int deckSize = currentGame.getOpponent().getDeck().size();
        int handSize = currentGame.getOpponent().getHand().size();
        int unknownCardsTotal = deckSize + handSize + (int) setCardsCount;

        double probabilitySafe = 1.0;
        for (int i = 0; i < setCardsCount; i++) {
            probabilitySafe *= (double) (unknownCardsTotal - remainingThreats - i) / (unknownCardsTotal - i);
        }

        return probabilitySafe * 100.0;
    }

    private double calculateAttackSuccessRate(GameState currentGame) {
        long setCardsCount = currentGame.getOpponent().getSpellTrapZone().stream()
                .filter(card -> card != null && card.isFacedown())
                .count();

        if (setCardsCount == 0) return 100.0;

        int initialAmbush = 3;
        int initialDestructSword = 3;

        long ambushInGy = currentGame.getOpponent().getGraveyard().stream()
                .filter(card -> card != null && card.getCardName().equalsIgnoreCase("An Ambush"))
                .count();

        long destructInGy = currentGame.getOpponent().getGraveyard().stream()
                .filter(card -> card != null && card.getCardName().equalsIgnoreCase("Self-Destruct Sword"))
                .count();

        long remainingThreats = (initialAmbush - ambushInGy) + (initialDestructSword - destructInGy);

        if (remainingThreats <= 0) return 100.0;

        int deckSize = currentGame.getOpponent().getDeck().size();
        int handSize = currentGame.getOpponent().getHand().size();
        int unknownCardsTotal = deckSize + handSize + (int) setCardsCount;

        double probabilitySafe = 1.0;
        int sampleSize = (int) setCardsCount;

        for (int i = 0; i < sampleSize; i++) {
            if (unknownCardsTotal - i > 0) {
                probabilitySafe *= (double) (unknownCardsTotal - remainingThreats - i) / (unknownCardsTotal - i);
            }
        }

        return Math.max(0.0, probabilitySafe * 100.0);
    }

    private void enrichHandWithProbabilities(GameState game) {
        if (game == null || game.getPlayer().getHand() == null) return;

        double summonChance = Math.round(calculateSummonSuccessRate(game) * 10.0) / 10.0;
        double attackChance = Math.round(calculateAttackSuccessRate(game) * 10.0) / 10.0;

        for (CardDTO card : game.getPlayer().getHand()) {
            if (card != null) {
                if ("MONSTER".equals(card.getCardType())) {
                    card.setSummonSuccessProb(summonChance);
                } else {
                    card.setActivateSuccessProb(100.0);
                }
            }
        }
        if (game.getPlayer().getMonsterZone() != null) {
            for (CardDTO card : game.getPlayer().getMonsterZone()) {
                if (card != null) {
                    card.setAttackSuccessProb(attackChance);
                }
            }
        }
    }
}