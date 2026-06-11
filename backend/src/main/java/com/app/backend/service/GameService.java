package com.app.backend.service;

import java.util.Objects;

import com.app.backend.dto.AiMoveSuggestionDTO;
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

// glavni servis u kojem se odvija logika igre
@Service
public class GameService {

    @Autowired
    private DeckRepository deckRepository;

    private GameState currentGame;

    // inicijalizacija igre, postavljanje polja, namjestanje ruku...
    public GameState initializeGame(BoardSetupDTO setup) {
        this.currentGame = new GameState();
        this.currentGame.setStatistics(new TurnStatisticsDTO());

        setupSide(this.currentGame.getPlayer(), setup.getPlayer(),"PLAYER");
        setupSide(this.currentGame.getOpponent(), setup.getOpponent(), "OPPONENT");

        maskInitialSpellsAndTraps(this.currentGame.getPlayer());
        maskInitialSpellsAndTraps(this.currentGame.getOpponent());

        fillRemainingDeck(this.currentGame.getPlayer(), setup.getPlayerDeckName(), setup.getPlayer());

        String opponentDeckName = setup.getPlayerDeckName().equals("Mugi") ? "Saiba" : "Mugi";
        fillRemainingDeck(this.currentGame.getOpponent(), opponentDeckName, setup.getOpponent());

        Collections.shuffle(this.currentGame.getPlayer().getDeck());
        Collections.shuffle(this.currentGame.getOpponent().getDeck());

        for (int i = this.currentGame.getPlayer().getHand().size(); i < 5; i++) {
            drawCard(this.currentGame.getPlayer());
        }
        for (int i = this.currentGame.getOpponent().getHand().size(); i < 5; i++) {
            drawCard(this.currentGame.getOpponent());
        }
        enrichHandWithProbabilities(this.currentGame);
        return this.currentGame;
    }

    // pracenje ako je izgubljeno cudoviste
    private void recordPlayerMonsterLost(CardDTO monster, String reason) {
        if (monster == null) return;
        TurnStatisticsDTO stats = currentGame.getStatistics();
        int atk = monster.getCardAttack() != null ? monster.getCardAttack() : 0;

        if (atk >= 2000) {
            stats.setMonstersLostBoss(stats.getMonstersLostBoss() + 1);
        } else {
            stats.setMonstersLostNormal(stats.getMonstersLostNormal() + 1);
        }

        stats.getDestructionLog().add(String.format("• [IGRAČ] Čudovište '%s' (%d ATK) je uništeno. (Uzrok: %s)", monster.getCardName(), atk, reason));
    }

    // pracenje ako je protivnicko cudoviste izgubljeno
    private void recordOpponentMonsterDestroyed(CardDTO monster, String reason) {
        if (monster == null) return;
        TurnStatisticsDTO stats = currentGame.getStatistics();
        int atk = monster.getCardAttack() != null ? monster.getCardAttack() : 0;

        if (atk >= 2000) {
            stats.setMonstersDestroyedBoss(stats.getMonstersDestroyedBoss() + 1);
        } else {
            stats.setMonstersDestroyedNormal(stats.getMonstersDestroyedNormal() + 1);
        }

        stats.getDestructionLog().add(String.format("• [PROTIVNIK] Čudovište '%s' (%d ATK) je uništeno. (Uzrok: %s)", monster.getCardName(), atk, reason));
    }

    // provjera da li se odluka smatra pracenjem ai savjeta ili je to korisnikov rizik
    private void recordAiDecision(double successProbability, boolean userExecutedMove) {
        TurnStatisticsDTO stats = currentGame.getStatistics();
        if (successProbability >= 85.0) {
            if (userExecutedMove) {
                stats.setAiFollowedCount(stats.getAiFollowedCount() + 1);
            }
        } else {
            if (!userExecutedMove) {
                stats.setAiFollowedCount(stats.getAiFollowedCount() + 1);
            } else {
                stats.setAiIgnoredCount(stats.getAiIgnoredCount() + 1);
            }
        }
    }

    // karte namjestamo da se nemru vidjet kod inicijalizacije
    private void maskInitialSpellsAndTraps(PlayerState playerState) {
        if (playerState.getSpellTrapZone() != null) {
            for (CardDTO card : playerState.getSpellTrapZone()) {
                if (card != null && (card.getCardType().equals("TRAP") || card.getCardType().equals("SPELL"))) {
                    card.setFacedown(true);
                }
            }
        }
    }

    // namjestanje karata na njihovo mjesto
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

    // pridodjela pripadnosti pojedine karte
    private void assignOwnerToZone(List<CardDTO> zone, String owner) {
        if (zone == null) return;
        for (CardDTO card : zone) {
            if (card != null) {
                card.setOriginalOwner(owner);
            }
        }
    }

    // ispunjenje ostatka spila sa preostalim kartama koje nisu pridodjeljenje direktno protivniku i igracu
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

    // micanje karata
    private void removeCards(List<CardDTO> masterList, List<CardDTO> toRemove) {
        if (toRemove == null) return;
        for (CardDTO card : toRemove) {
            if (card != null) removeOneCard(masterList, card.getCardId());
        }
    }

    // micanje jedne karte
    private void removeOneCard(List<CardDTO> masterList, Long cardId) {
        for (int i = 0; i < masterList.size(); i++) {
            if (masterList.get(i).getCardId().equals(cardId)) {
                masterList.remove(i);
                break;
            }
        }
    }

    // izvacenje karte
    public void drawCard(PlayerState player) {
        if (!player.getDeck().isEmpty()) {
            player.getHand().add(player.getDeck().remove(0));
        }
    }

    // postavljanje karte u jednu od zona
    private void placeCardInZone(List<CardDTO> zone, CardDTO card) {
        for (int i = 0; i < zone.size(); i++) {
            if (zone.get(i) == null) {
                zone.set(i, card);
                return;
            }
        }
        throw new RuntimeException("Nema slobodnog mjesta u zoni!");
    }

    // odigravanje karte
    public GameState playCard(Long cardId, String action, List<Long> tributes) {
        if (currentGame == null) throw new RuntimeException("Igra nije nađena!");
        PlayerState p = currentGame.getPlayer();
        verifyUserCompliance(cardId, action);
        CardDTO cardToPlay = p.getHand().stream()
                .filter(Objects::nonNull)
                .filter(c -> c.getCardId().equals(cardId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Karta nije u ruci!"));

        // ako zelimo prizvati cudoviste
        if (action.equals("SUMMON") && cardToPlay.getCardType().equals("MONSTER")) {
            if (p.isHasNormalSummonedThisTurn()) throw new RuntimeException("Već si iskoristio Normal Summon ovog poteza!");
            if (!currentGame.getCurrentPhase().equals("MP1") && !currentGame.getCurrentPhase().equals("MP2")) throw new RuntimeException("Summon je moguć samo u Main fazi!");

            // racunamo vjerojatnost uspjeha prizivanja
            double summonChance = calculateSummonSuccessRate(currentGame);
            recordAiDecision(summonChance, true);

            int cost = cardToPlay.getCardCost() != null ? cardToPlay.getCardCost() : 0;
            int requiredTributes = 0;
            if (cost >= 5 && cost <= 6) requiredTributes = 1;
            else if (cost >= 7) requiredTributes = 2;

            // logika ako cudoviste zahtjeva druga cudovista za prizivanje
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

                    recordPlayerMonsterLost(tributeMonster, "Žrtva za prizivanje ('" + cardToPlay.getCardName() + "')");
                }
            }

            p.getHand().remove(cardToPlay);
            cardToPlay.setFacedown(false);
            placeCardInZone(p.getMonsterZone(), cardToPlay);
            p.setHasNormalSummonedThisTurn(true);

            // biljezimo dobiveno cudoviste
            currentGame.getStatistics().setMonstersGained(currentGame.getStatistics().getMonstersGained() + 1);
            // gledamo hoce li se zamka aktivirat
            checkOpponentSummonReactions(currentGame, cardToPlay);
            currentGame.getStatistics().getActionLog().add("[KORISNIK] Prizvana karta: '" + cardToPlay.getCardName() + "'.");
        }
        // ako zelimo postaviti karte spell ili trap
        else if (action.equals("SET") && (cardToPlay.getCardType().equals("SPELL") || cardToPlay.getCardType().equals("TRAP"))) {
            p.getHand().remove(cardToPlay);
            cardToPlay.setFacedown(true);
            placeCardInZone(p.getSpellTrapZone(), cardToPlay);
            currentGame.getStatistics().getActionLog().add("[KORISNIK] Karta postavljena licem prema dolje (SET).");
        }
        // ako zelim aktivirati spell karte
        else if (action.equals("ACTIVATE") && cardToPlay.getCardType().equals("SPELL")) {
            if (!currentGame.getCurrentPhase().equals("MP1") && !currentGame.getCurrentPhase().equals("MP2")) throw new RuntimeException("Aktivacija magija moguća je samo u main fazi.");

            p.getHand().remove(cardToPlay);
            cardToPlay.setFacedown(false);
            String spellName = cardToPlay.getCardName();

            // ovisno o imenu karte ce se izvrsiti odredena akcija
            if (spellName.equalsIgnoreCase("Big Bang")) {
                p.getMonsterZone().stream().filter(Objects::nonNull).forEach(m -> {
                    p.getGraveyard().add(m);
                    recordPlayerMonsterLost(m, "Vlastita magija 'Big Bang'");
                });
                Collections.fill(p.getMonsterZone(), null);

                currentGame.getOpponent().getMonsterZone().stream().filter(Objects::nonNull).forEach(m -> {
                    currentGame.getOpponent().getGraveyard().add(m);
                    recordOpponentMonsterDestroyed(m, "Magija 'Big Bang'");
                });
                Collections.fill(currentGame.getOpponent().getMonsterZone(), null);
            }
            else if (spellName.equalsIgnoreCase("A Beasts Revival")) {
                if (tributes == null || tributes.isEmpty()) throw new RuntimeException("Moraš odabrati metu iz groblja.");
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

                currentGame.getStatistics().setMonstersGained(currentGame.getStatistics().getMonstersGained() + 1);
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

                recordOpponentMonsterDestroyed(targetMonster, "Magija '" + spellName + "'");
            }

            p.getHand().remove(cardToPlay);
            sendToGraveyard(currentGame, cardToPlay);
            currentGame.getStatistics().getActionLog().add("[KORISNIK] Aktivirana magija: '" + cardToPlay.getCardName() + "'.");
        } else {
            throw new RuntimeException("Nepoznata ili ilegalna akcija!");
        }
        // pridodjeljuju se sve vjerojatnosti kartama u ruci
        enrichHandWithProbabilities(currentGame);
        return currentGame;
    }

    // logika za napad
    public GameState attack(Long attackerId, Long targetId) {
        if (currentGame == null) throw new RuntimeException("Igra nije pokrenuta!");
        if (!currentGame.getCurrentPhase().equals("BP")) throw new RuntimeException("Napad samo u Battle fazi!");

        verifyUserCompliance(attackerId, "ATTACK");

        CardDTO attacker = currentGame.getPlayer().getMonsterZone().stream()
                .filter(c -> c != null && c.getCardId().equals(attackerId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Napadač nije pronađen na polju!"));

        if (attacker.isHasAttackedThisTurn()) {
            throw new RuntimeException("Ovo čudovište je već napalo ovog poteza!");
        }
        // racunamo vjerojatnost uspjesnosti prolaza napada
        double attackChance = calculateAttackSuccessRate(currentGame);
        recordAiDecision(attackChance, true);

        if (checkOpponentAttackReactions(currentGame, attacker)) {
            enrichHandWithProbabilities(currentGame);
            return currentGame;
        }

        // logika o biranju i interakciji sa protivnikovim cudovistem
        if (targetId == null) {
            currentGame.getOpponent().setLifePoints(currentGame.getOpponent().getLifePoints() - attacker.getCardAttack());
            currentGame.getStatistics().getActionLog().add("[KORISNIK] Direktan napad s: '" + attacker.getCardName() + "'.");
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

                recordOpponentMonsterDestroyed(target, "Borba (Napad čudovištem '" + attacker.getCardName() + "')");

            } else if (atk < def) {
                currentGame.getPlayer().setLifePoints(currentGame.getPlayer().getLifePoints() - (def - atk));
                int attackerIndex = currentGame.getPlayer().getMonsterZone().indexOf(attacker);
                currentGame.getPlayer().getMonsterZone().set(attackerIndex, null);
                currentGame.getPlayer().getGraveyard().add(attacker);

                recordPlayerMonsterLost(attacker, "Borba protiv jačeg čudovišta ('" + target.getCardName() + "')");

            } else {
                int targetIndex = currentGame.getOpponent().getMonsterZone().indexOf(target);
                currentGame.getOpponent().getMonsterZone().set(targetIndex, null);
                currentGame.getOpponent().getGraveyard().add(target);

                int attackerIndex = currentGame.getPlayer().getMonsterZone().indexOf(attacker);
                currentGame.getPlayer().getMonsterZone().set(attackerIndex, null);
                currentGame.getPlayer().getGraveyard().add(attacker);

                recordOpponentMonsterDestroyed(target, "Obostrano uništenje čudovištem '" + attacker.getCardName() + "'");
                recordPlayerMonsterLost(attacker, "Obostrano uništenje u borbi s '" + target.getCardName() + "'");
            }
            currentGame.getStatistics().getActionLog().add("[KORISNIK] '" + attacker.getCardName() + "' napada protivničku kartu.");
        }
        attacker.setHasAttackedThisTurn(true);
        // azuriramo vjerojatnosti pojedine karte na polju
        enrichHandWithProbabilities(currentGame);
        return currentGame;
    }

    // gledamo reagiraju li protivnikove karte na nase
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

                recordPlayerMonsterLost(summonedCard, "Zamka 'Bear Trap'");
                return true;
            }
        }
        return false;
    }

    // gledamo reagiraju li protivnikove karte na nase kod napadanja
    private boolean checkOpponentAttackReactions(GameState game, CardDTO attacker) {
        List<CardDTO> stZone = game.getOpponent().getSpellTrapZone();

        Optional<CardDTO> anAmbushOpt = stZone.stream()
                .filter(c -> c != null && c.getCardName().equalsIgnoreCase("An Ambush"))
                .findFirst();
        // logika se svodi na dvije razlicite karte, pa svaka od njih ima vlastitu fukcionalnost
        if (anAmbushOpt.isPresent()) {
            CardDTO trap = anAmbushOpt.get();
            stZone.set(stZone.indexOf(trap), null);
            sendToGraveyard(game, trap);

            game.getPlayer().getMonsterZone().stream()
                    .filter(Objects::nonNull)
                    .forEach(c -> {
                        sendToGraveyard(game, c);
                        recordPlayerMonsterLost(c, "Zamka 'An Ambush'");
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

            recordPlayerMonsterLost(attacker, "Zamka 'Self-Destruct Sword'");
            return true;
        }

        return false;
    }

    // promjena faze
    public GameState changePhase(String nextPhase) {
        if (currentGame == null) throw new RuntimeException("Igra nije pokrenuta!");

        if (nextPhase.equals("EP") && !currentGame.getCurrentPhase().equals("EP")) {

            boolean hasMonsterInHand = currentGame.getPlayer().getHand().stream()
                    .filter(Objects::nonNull)
                    .anyMatch(c -> c.getCardType().equals("MONSTER"));
            boolean canSummon = !currentGame.getPlayer().isHasNormalSummonedThisTurn() && hasMonsterInHand;

            // pracenje donesenih odluka
            if (canSummon) {
                double summonChance = calculateSummonSuccessRate(currentGame);
                recordAiDecision(summonChance, false);
            }

            boolean hasReadyMonsterOnField = currentGame.getPlayer().getMonsterZone().stream()
                    .filter(Objects::nonNull)
                    .anyMatch(c -> !c.isHasAttackedThisTurn());

            if (hasReadyMonsterOnField) {
                double attackChance = calculateAttackSuccessRate(currentGame);
                recordAiDecision(attackChance, false);
            }

            currentGame.getPlayer().setHasNormalSummonedThisTurn(false);
            currentGame.getOpponent().setHasNormalSummonedThisTurn(false);

            currentGame.getPlayer().getMonsterZone().stream()
                    .filter(Objects::nonNull)
                    .forEach(c -> c.setHasAttackedThisTurn(false));

            currentGame.getOpponent().getMonsterZone().stream()
                    .filter(Objects::nonNull)
                    .forEach(c -> c.setHasAttackedThisTurn(false));
        }

        currentGame.setCurrentPhase(nextPhase);
        enrichHandWithProbabilities(currentGame);
        return currentGame;
    }

    // slanje u groblje
    private void sendToGraveyard(GameState game, CardDTO card) {
        if (card == null) return;
        card.setFacedown(false);

        if ("OPPONENT".equals(card.getOriginalOwner())) {
            game.getOpponent().getGraveyard().add(card);
        } else {
            game.getPlayer().getGraveyard().add(card);
        }
    }

    // racunanje vjerojatnosti da ce nam prizivanje biti uspjesno
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
    // racunanje vjerojatnosti da ce nam napad biti uspjesan
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

    // dodjela vjerojatnosti svakoj karti u ruci i na polju
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
        game.setAiSuggestions(generateAiSuggestions(game));
    }

    // generiranje ai savjeta
    private List<AiMoveSuggestionDTO> generateAiSuggestions(GameState game) {
        List<AiMoveSuggestionDTO> allPossibleMoves = new ArrayList<>();
        if (game == null) return allPossibleMoves;

        String phase = game.getCurrentPhase();
        // gledamo u kojoj smo fazi dvoboja i na temelju toga se gledaju najveci moguci potezi
        if ("MP1".equals(phase) || "MP2".equals(phase)) {
            boolean canSummon = !game.getPlayer().isHasNormalSummonedThisTurn();

            if (game.getPlayer().getHand() != null) {
                for (CardDTO card : game.getPlayer().getHand()) {
                    if (card == null) continue;

                    if ("SPELL".equals(card.getCardType()) || "TRAP".equals(card.getCardType())) {
                        double chance = 100.0;
                        allPossibleMoves.add(new AiMoveSuggestionDTO(card.getCardId(), card.getCardName(), "ACTIVATE", chance));
                    }

                    if ("MONSTER".equals(card.getCardType()) && canSummon) {
                        double chance = calculateSummonSuccessRate(game);
                        allPossibleMoves.add(new AiMoveSuggestionDTO(card.getCardId(), card.getCardName(), "SUMMON", chance));
                    }
                }
            }
        } else if ("BP".equals(phase)) {
            if (game.getPlayer().getMonsterZone() != null) {
                for (CardDTO monster : game.getPlayer().getMonsterZone()) {
                    if (monster != null && !monster.isHasAttackedThisTurn()) {
                        double chance = calculateAttackSuccessRate(game); // Tvoja računica za napad
                        allPossibleMoves.add(new AiMoveSuggestionDTO(monster.getCardId(), monster.getCardName(), "ATTACK", chance));
                    }
                }
            }
        }

        double maxChance = -1.0;
        for (AiMoveSuggestionDTO move : allPossibleMoves) {
            if (move.getSuccessProb() > maxChance) {
                maxChance = move.getSuccessProb();
            }
        }

        List<AiMoveSuggestionDTO> absoluteBestMoves = new ArrayList<>();
        if (maxChance >= 0) {
            for (AiMoveSuggestionDTO move : allPossibleMoves) {
                if (Math.abs(move.getSuccessProb() - maxChance) < 0.01) {
                    absoluteBestMoves.add(move);
                }
            }
        }
        //vracamo najbolje mogucce poteze
        return absoluteBestMoves;
    }

    // gledamo uskladenost sa prijedlozima AI agenta
    private void verifyUserCompliance(Long cardId, String action) {
        if (currentGame == null || currentGame.getStatistics() == null) return;
        TurnStatisticsDTO stats = currentGame.getStatistics();

        if (currentGame.getAiSuggestions() == null || currentGame.getAiSuggestions().isEmpty()) return;

        boolean followedAi = currentGame.getAiSuggestions().stream()
                .anyMatch(s -> s.getCardId().equals(cardId) && s.getAction().equalsIgnoreCase(action));

        if (followedAi) {
            stats.setAiFollowedCount(stats.getAiFollowedCount() + 1);
            stats.getActionLog().add("• [AI USKLAĐENOST] Korisnik je pratio optimalan savjet za akciju: " + action);
        } else {
            stats.setAiIgnoredCount(stats.getAiIgnoredCount() + 1);
            stats.getActionLog().add("• [AI ODVAJANJE] Korisnik je ignorirao AI i odigrao potez: " + action);
        }
    }
}