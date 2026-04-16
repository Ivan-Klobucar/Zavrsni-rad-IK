package com.app.backend.controller;

import com.app.backend.dto.BoardSetupDTO;
import com.app.backend.model.GameState;
import com.app.backend.service.GameService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/game")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class GameController {

    private final GameService gameService;

    // Ova ruta se poziva kada klikneš "Spreman sam" u Reactu
    @PostMapping("/start")
    public GameState startGame(@RequestBody BoardSetupDTO setup) {
        return gameService.initializeGame(setup);
    }
}