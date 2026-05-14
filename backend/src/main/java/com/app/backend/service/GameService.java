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
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

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

        // 2. Dohvati pune dekove iz baze i napuni 'deck' listu (ono što nije na polju)
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

    private void placeCardInZone(List<CardDTO> zone, CardDTO card) {
        for (int i = 0; i < zone.size(); i++) {
            if (zone.get(i) == null) {
                zone.set(i, card); // Stavi na prvo prazno mjesto
                return;
            }
        }
        zone.add(card); // Fallback ako lista nema null-ova
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

        // Ukloni iz ruke
        p.getHand().remove(cardToPlay);

        // ------------------
        // LOGIKA ZA SUMMON
        // ------------------
        if (action.equals("SUMMON") && cardToPlay.getCardType().equals("MONSTER")) {
            if (p.isHasNormalSummonedThisTurn()) throw new RuntimeException("Već si iskoristio Normal Summon ovog poteza!");
            if (!currentGame.getCurrentPhase().equals("MP1") && !currentGame.getCurrentPhase().equals("MP2")) throw new RuntimeException("Summon je moguć samo u Main fazi!");

            // Izračunavanje potrebnih žrtava na temelju Card Cost-a (Level-a)
            int cost = cardToPlay.getCardCost() != null ? cardToPlay.getCardCost() : 0;
            int requiredTributes = 0;
            if (cost >= 5 && cost <= 6) requiredTributes = 1;
            else if (cost >= 7) requiredTributes = 2;

            // Procesiranje žrtvovanja (Tribute Summon)
            if (requiredTributes > 0) {
                if (tributes == null || tributes.size() != requiredTributes) {
                    throw new RuntimeException("Nevaljan broj žrtava! Potrebno je: " + requiredTributes);
                }

                // Provjeri i ukloni svaku žrtvu s polja u groblje
                for (Long tributeId : tributes) {
                    CardDTO tributeMonster = p.getMonsterZone().stream()
                            .filter(m -> m != null && m.getCardId().equals(tributeId))
                            .findFirst()
                            .orElseThrow(() -> new RuntimeException("Odabrano čudovište za žrtvu nije na polju!"));

                    p.getMonsterZone().remove(tributeMonster);
                    p.getGraveyard().add(tributeMonster);
                }
            }

            // Izvršavanje Summona
            cardToPlay.setFacedown(false); // Summon je uvijek otvoren
            placeCardInZone(p.getMonsterZone(), cardToPlay); // Stavlja na polje
            p.setHasNormalSummonedThisTurn(true);

            // REAKCIJA PROTIVNIKA: Trap Hole provjera (ostaje kao i prije)
            //checkOpponentSummonReactions(game, cardToPlay);

        }
        // ------------------
        // LOGIKA ZA SET (Spells / Traps)
        // ------------------
        else if (action.equals("SET")) {
            cardToPlay.setFacedown(true); // OVO JE KLJUČNO ZA POLEDINU
            if (cardToPlay.getCardType().equals("MONSTER")) {
                placeCardInZone(p.getMonsterZone(), cardToPlay);
            } else {
                placeCardInZone(p.getSpellTrapZone(), cardToPlay);
            }

        }
        // ------------------
        // LOGIKA ZA ACTIVATE (Spells)
        // ------------------
        else if (action.equals("ACTIVATE") && cardToPlay.getCardType().equals("SPELL")) {
            if (!currentGame.getCurrentPhase().equals("MP1") && !currentGame.getCurrentPhase().equals("MP2")) throw new RuntimeException("Aktivacija magija je moguća samo u Main fazi!");

            p.getHand().remove(cardToPlay);

            cardToPlay.setFacedown(false);
            // I magija ide na polje pri aktivaciji!
            placeCardInZone(p.getSpellTrapZone(), cardToPlay);


            p.getGraveyard().add(cardToPlay);

            // Ovdje bi išla specifična logika za Pot of Greed, Raigeki itd.
            if (cardToPlay.getCardName().equalsIgnoreCase("Pot of Greed")) {
                drawCard(p); drawCard(p);
            } else if (cardToPlay.getCardName().equalsIgnoreCase("Raigeki")) {
                // Prebaci sva protivnička čudovišta koja nisu null u groblje
                currentGame.getOpponent().getMonsterZone().stream()
                        .filter(c -> c != null)
                        .forEach(c -> currentGame.getOpponent().getGraveyard().add(c));
                // Očisti zonu
                Collections.fill(currentGame.getOpponent().getMonsterZone(), null);
            }


            // Magija odlazi u groblje nakon korištenja
            p.getSpellTrapZone().remove(cardToPlay);
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

        // REAKCIJA PROTIVNIKA: Mirror Force provjera
        if (checkOpponentAttackReactions(currentGame)) {
            return currentGame; // Ako se aktivirao Mirror Force, prekidamo napad
        }

        CardDTO attacker = currentGame.getPlayer().getMonsterZone().stream()
                .filter(c -> c != null && c.getCardId().equals(attackerId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Napadač nije pronađen na polju!"));

        if (targetId == null) {
            // Direct Attack
            currentGame.getOpponent().setLifePoints(currentGame.getOpponent().getLifePoints() - attacker.getCardAttack());
        } else {
            // Napad na čudovište uz zaštitu od null vrijednosti
            CardDTO target = currentGame.getOpponent().getMonsterZone().stream()
                    .filter(c -> c != null && c.getCardId().equals(targetId))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Meta nije pronađena na polju!"));

            int atk = attacker.getCardAttack();
            int def = target.getCardAttack(); // Ovdje ćemo kasnije dodati logiku za DEF poziciju

            if (atk > def) {
                // Tvoje čudovište je jače -> Protivnik gubi LP, meta ide u groblje
                currentGame.getOpponent().setLifePoints(currentGame.getOpponent().getLifePoints() - (atk - def));
                int targetIndex = currentGame.getOpponent().getMonsterZone().indexOf(target);
                currentGame.getOpponent().getMonsterZone().set(targetIndex, null); // Oslobađamo slot
                currentGame.getOpponent().getGraveyard().add(target);

            } else if (atk < def) {
                // Protivnikovo čudovište je jače -> Ti gubiš LP, tvoj napadač ide u groblje
                currentGame.getPlayer().setLifePoints(currentGame.getPlayer().getLifePoints() - (def - atk));
                int attackerIndex = currentGame.getPlayer().getMonsterZone().indexOf(attacker);
                currentGame.getPlayer().getMonsterZone().set(attackerIndex, null); // Oslobađamo tvoj slot
                currentGame.getPlayer().getGraveyard().add(attacker);

            } else {
                // Izjednačenje (Crash) -> Oboje idu u groblje, nema štete
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

    // --- POMOĆNE METODE ZA TRAP REAKCIJE ---
    private void checkOpponentSummonReactions(GameState game, CardDTO summonedCard) {
        if (summonedCard.getCardAttack() >= 1000) {
            Optional<CardDTO> trap = game.getOpponent().getSpellTrapZone().stream()
                    .filter(c -> c != null) // KLJUČNO: Preskoči prazna polja!
                    .filter(c -> c.isFacedown() && c.getCardName().equalsIgnoreCase("Trap Hole"))
                    .findFirst();

            if (trap.isPresent()) {
                int trapIndex = game.getOpponent().getSpellTrapZone().indexOf(trap.get());
                game.getOpponent().getSpellTrapZone().set(trapIndex, null);
                game.getOpponent().getGraveyard().add(trap.get());

                int monsterIndex = game.getPlayer().getMonsterZone().indexOf(summonedCard);
                game.getPlayer().getMonsterZone().set(monsterIndex, null);
                game.getPlayer().getGraveyard().add(summonedCard);
            }
        }
    }

    private boolean checkOpponentAttackReactions(GameState game) {
        Optional<CardDTO> trap = game.getOpponent().getSpellTrapZone().stream()
                .filter(c -> c != null) // KLJUČNO: Preskoči prazna polja!
                .filter(c -> c.isFacedown() && c.getCardName().equalsIgnoreCase("Mirror Force"))
                .findFirst();

        if (trap.isPresent()) {
            int trapIndex = game.getOpponent().getSpellTrapZone().indexOf(trap.get());
            game.getOpponent().getSpellTrapZone().set(trapIndex, null);
            game.getOpponent().getGraveyard().add(trap.get());

            // Prebaci sva tvoja čudovišta u groblje
            game.getPlayer().getMonsterZone().stream()
                    .filter(c -> c != null)
                    .forEach(c -> game.getPlayer().getGraveyard().add(c));

            Collections.fill(game.getPlayer().getMonsterZone(), null);
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
        }
        return currentGame;
    }
}
