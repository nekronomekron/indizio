# Ausgangslage vor dem Refactoring

Gemessen am 28.08.2026, 25 Rätsel je Stufe, Node auf dem Entwicklungsrechner.

| Stufe | Mittel | p95 |
|---|---|---|
| vl (5x5, 6x6) | 8 ms | 21 ms |
| l (7x7) | 26 ms | 52 ms |
| m (8x8) | 37 ms | 118 ms |
| s (9x9) | 80 ms | 192 ms |
| x (10x10) | 223 ms | 720 ms |

Keine Fehlschläge bei 125 Erzeugungen.

## Weitere Ausgangswerte

- Bibliothek: 4005 Zeilen Quelltext in 23 Modulen, 5 Testdateien mit 70 Tests
- Regelstufen R3 und R4: bei 60 von 60 geprüften Rätseln **nie** ausgelöst
- Öffentliche Schnittstelle: rund 60 Exporte
- Laufzeitabhängigkeiten: keine
