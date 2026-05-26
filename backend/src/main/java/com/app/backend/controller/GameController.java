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
public class GameController {

    private final GameService gameService;
    private final StatisticsPdfService pdfService;

    // Ova ruta se poziva kada klikneš "Spreman sam" u Reactu
    @PostMapping("/start")
    public GameState startGame(@RequestBody BoardSetupDTO setup) {
        return gameService.initializeGame(setup);
    }

    @PostMapping("/phase")
    public GameState changePhase(@RequestParam String phase) {
        return gameService.changePhase(phase);
    }

    @PostMapping("/play")
    public GameState playCard(
            @RequestParam Long cardId,
            @RequestParam String action,
            @RequestParam(required = false) List<Long> tributes) {
        return gameService.playCard(cardId, action, tributes);
    }

    @PostMapping("/attack")
    public GameState attack(@RequestParam Long attackerId, @RequestParam(required = false) Long targetId) {
        return gameService.attack(attackerId, targetId);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleException(RuntimeException e) {
        // Sada će umjesto "500 Internal Server Error" Reactu poslati pravu poruku!
        return ResponseEntity.badRequest().body(e.getMessage());
    }

    @PostMapping("/statistics/download")
    public ResponseEntity<byte[]> downloadStatisticsPdf(@RequestBody GameState gameState) {

        // Šaljemo taj primljeni gameState u servis koji generira PDF
        byte[] pdfBytes = pdfService.generateStatisticsPdf(gameState);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "YGO_Analiza_Poteza.pdf");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
    }
}