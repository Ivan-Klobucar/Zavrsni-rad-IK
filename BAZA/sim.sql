
CREATE TABLE cards (
                       card_id BIGSERIAL PRIMARY KEY,
                       card_name VARCHAR(255) NOT NULL,
                       card_type VARCHAR(50) NOT NULL,
                       card_attack INTEGER,
                       card_defense INTEGER,
                       card_cost INTEGER,
                       card_effect TEXT
);

CREATE TABLE decks (
                       deck_id BIGSERIAL PRIMARY KEY,
                       deck_name VARCHAR(255)
);

CREATE TABLE deck_cards (
                            deck_id INT REFERENCES decks(deck_id),
                            card_id INT REFERENCES cards(card_id),
                            quantity INT DEFAULT 1,
                            PRIMARY KEY (deck_id, card_id)
);

CREATE TABLE player_states (
                               player_id BIGSERIAL PRIMARY KEY,
                               life_points INTEGER,
                               deck_id BIGINT,
                               FOREIGN KEY (deck_id) REFERENCES decks(deck_id) ON DELETE SET NULL
);

CREATE TABLE game_states (
                             game_state_id BIGSERIAL PRIMARY KEY,
                             player_id BIGINT,
                             opponent_id BIGINT,
                             turn_number INTEGER,
                             player_turn BOOLEAN DEFAULT TRUE,
                             FOREIGN KEY (player_id) REFERENCES player_states(player_id) ON DELETE CASCADE,
                             FOREIGN KEY (opponent_id) REFERENCES player_states(player_id) ON DELETE CASCADE
);

CREATE TABLE moves (
                       move_id BIGSERIAL PRIMARY KEY,
                       action_type VARCHAR(100),
                       source_card VARCHAR(255),
                       target VARCHAR(255),
                       probability DOUBLE PRECISION,
                       score DOUBLE PRECISION
);