package com.app.backend.controller;

import com.app.backend.dto.BoardSetupDTO;
import com.app.backend.model.GameState;
import com.app.backend.service.GameService;
import com.app.backend.service.StatisticsPdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.DeserializationFeature;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;

@RestController
@RequestMapping("/api/game")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
// zaduzen za logiku simulatora
public class GameController {

    private final GameService gameService;
    private final StatisticsPdfService pdfService;

    // pocetak poteza
    @PostMapping("/start")
    public GameState startGame(@RequestBody BoardSetupDTO setup) {
        return gameService.initializeGame(setup);
    }

    // promjena faza
    @PostMapping("/phase")
    public GameState changePhase(@RequestParam String phase) {
        return gameService.changePhase(phase);
    }

    // potez koji korisnik odigra
    @PostMapping("/play")
    public GameState playCard(
            @RequestParam Long cardId,
            @RequestParam String action,
            @RequestParam(required = false) List<Long> tributes) {
        return gameService.playCard(cardId, action, tributes);
    }

    // provedba napada
    @PostMapping("/attack")
    public GameState attack(@RequestParam Long attackerId, @RequestParam(required = false) Long targetId) {
        return gameService.attack(attackerId, targetId);
    }

    // preuzimanje statistike
    @PostMapping("/statistics/download")
    public ResponseEntity<byte[]> downloadStatisticsPdf(@RequestBody GameState gameState) {

        byte[] pdfBytes = pdfService.generateStatisticsPdf(gameState);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "YGO_Analiza_Poteza.pdf");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}