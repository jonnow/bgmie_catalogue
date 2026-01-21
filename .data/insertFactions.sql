INSERT INTO Team(id, team)
VALUES
  (1, 'Good'),
  (2, 'Evil');

INSERT INTO FilmSeries(id, series)
VALUES
  (1, 'Lord of the Rings'),
  (2, 'The Hobbit'),
  (3, 'Rings of Power'),
  (4, 'War of the Rohirrm');

INSERT INTO Film(id, film, seriesId) 
VALUES
(1, 'The Fellowship of the Ring', 1),
(2, 'The Two Towers', 1),
(3, 'The Return of the King',1),
(4, 'An Unexpected Journey',2),
(5, 'The Desolation of Smaug',2),
(6, 'The Battle of the Five Armies', 2),
(7, 'War of the Rohirrm', 4);


INSERT INTO Faction(faction,teamId,filmId) VALUES
( 'Gondor', 1, 1),
( 'Rohan', 1, 1),
( 'The Shire', 1, 1),
( 'The Last Alliance of Elves and Men', 1, 1),
( 'Arnor', 1, 1),
( 'Fangorn', 1, 1),
( 'Lothlorien', 1, 1),
('Numenor', 1, 1),
('Rivendell', 1, 1),
('The Dead of Dunharrow', 1, 1),
('The Fellowship', 1, 1),
('The Fiefdoms', 1, 1),
('The Kingdom of Khazad-Dum', 1, 1),
('The Misty Mountains', 1, 1),
('The Rangers', 1, 1),
('Wanderers in the Wild', 1, 1),
('Army of Thror', 1, 2),
('Erebor Reclaimed', 1, 2),
('Garrison of Dale', 1, 2),
('Halls of Thranduil', 1, 2),
("Radagast's Alliance", 1, 2),
('The Army of Lake-town', 1, 2),
('The Iron Hills', 1, 2),
('The Survivors of Lake-town', 1, 2),
("Thorin's Company", 1, 2),
('Angmar', 2, 1),
('Barad-Dur', 2, 1),
('Corsairs of Umbar', 2, 1),
('Dunland', 2, 1),
('Far Harad', 2, 1),
('Isengard', 2, 1),
('Mordor', 2, 1),
('Moria', 2, 1),
("Sharkey's Rogues", 2, 1),
('The Easterlings', 2, 1),
('The Serpent Horde', 2, 1),
("Azog's Hunters", 2, 2),
("Azog's Legion", 2, 2),
('Dark Powers of Dol Guldur', 2, 2),
('Desolator of the North', 2, 2),
('Goblin Town', 2, 2),
('The Dark Denizens of Mirkwood', 2, 2),
('The Trolls', 2, 2),
('The Hill Tribes', 2, 4);
