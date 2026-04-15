INSERT INTO cards (card_name, card_type, card_attack, card_defense, card_cost, card_effect, image_url)
VALUES
    ('Sage Of Wisdom', 'MONSTER', 2500, 2100, 7, 'Dark and grueling times have led this man to learn the most powerful of magic.', '/images/cards/sage_of_wisdom.jpg'),
    ('Phantom Jester', 'MONSTER', 1800, 900, 4, 'This jester on the run will make sure to make a fool out of everyone who dares to apprehend him.', '/images/cards/phantom_jester.jpg'),
    ('Leader Of Wolves', 'MONSTER', 1200, 800, 3, 'Showing off his dominance is what got him to a position of a leader.', '/images/cards/leader_of_wolves.jpg'),
    ('Emperor Of Skulls', 'MONSTER', 2500, 1200, 6, 'Anyone who dares to defy this presence will meet their demise.', '/images/cards/emperor_of_skulls.jpg'),
    ('Nefarious Imp', 'MONSTER', 1300, 1400, 4, 'Falling into one of his traps will lead those weak minded into a state of craziness.', '/images/cards/nefarious_imp.jpg'),
    ('Throne Guardian', 'MONSTER', 1400, 1200, 4, 'His honor as a warrior relies on protecting the throne with his life.', '/images/cards/throne_guardian.jpg'),
    ('Whitelodon', 'MONSTER', 1600, 500, 4, 'The number one rival of the Great Orca.', '/images/cards/whitelodon.jpg'),
    ('Praying Elf', 'MONSTER', 800, 2000, 4, 'Due to its nature of praying, it is said that this elf has terrific defense.', '/images/cards/praying_elf.jpg'),
    ('Metal Drago', 'MONSTER', 1800, 900, 4, 'A shiny dragon not afraid to swift and take someone elses prey.', '/images/cards/metal_drago.jpg'),
    ('Bolt-Eyed Thunder Dragon', 'MONSTER', 3000, 2500, 8, 'When you hear the roar of this majestic creature, it is already too late.', '/images/cards/bolt_eyed_thunder_dragon.jpg'),
    ('A Beasts Revival', 'SPELL', NULL, NULL, 0, 'Target 1 monster in either GY; Special Summon it.', '/images/cards/a_beasts_revival.jpg'),
    ('Big Bang', 'SPELL', NULL, NULL, 0, 'Destroy all monsters on the field.', '/images/cards/big_bang.jpg'),
    ('Chaotic Orb', 'SPELL', NULL, NULL, 0, 'If you control a Spellcaster-type monster: Target 1 monster on your opponents side of the field; Destroy that target.', '/images/cards/chaotic_orb.jpg'),
    ('An Ambush', 'TRAP', NULL, NULL, 0, 'When an opponents monster declares an attack: Destroy all Attack Position monsters yout opponent controls.', '/images/cards/an_ambush.jpg'),
    ('Bear Trap', 'TRAP', NULL, NULL, 0, 'When your opponent Normal Summons a monster with 1000 or more ATK: Target that monster; destroy that target.', '/images/cards/bear_trap.jpg'),
    ('Self-Destruct Sword', 'TRAP', NULL, NULL, 0, 'When an opponents monster declares an attack: Target the attacking monster; destroy that target.', '/images/cards/self_destruct_sword.jpg');

-- 2. Ubaci Dekove
INSERT INTO decks (deck_name) VALUES ('Mugi'), ('Saiba');

-- 3. Poveži karte s Mugi dekom (ID deka je vjerojatno 1, ID karata 1 i 2)
-- Ako si koristio tablicu deck_cards s quantity:
INSERT INTO deck_cards (deck_id, card_id, quantity) VALUES (1, 1, 2); -- 3 Sage of wisdom
INSERT INTO deck_cards (deck_id, card_id, quantity) VALUES (1, 4, 2);
INSERT INTO deck_cards (deck_id, card_id, quantity) VALUES (1, 2, 3);
INSERT INTO deck_cards (deck_id, card_id, quantity) VALUES (1, 3, 3);
INSERT INTO deck_cards (deck_id, card_id, quantity) VALUES (1, 5, 3);
INSERT INTO deck_cards (deck_id, card_id, quantity) VALUES (1, 6, 3);
INSERT INTO deck_cards (deck_id, card_id, quantity) VALUES (1, 7, 3);
INSERT INTO deck_cards (deck_id, card_id, quantity) VALUES (1, 8, 3);
INSERT INTO deck_cards (deck_id, card_id, quantity) VALUES (1, 11, 3);
INSERT INTO deck_cards (deck_id, card_id, quantity) VALUES (1, 12, 3);
INSERT INTO deck_cards (deck_id, card_id, quantity) VALUES (1, 13, 3);
INSERT INTO deck_cards (deck_id, card_id, quantity) VALUES (1, 14, 3);
INSERT INTO deck_cards (deck_id, card_id, quantity) VALUES (1, 15, 3);
INSERT INTO deck_cards (deck_id, card_id, quantity) VALUES (1, 16, 3);
