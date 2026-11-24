# Journal des versions — humans-web

## 1.0.0 — 2026-11-24

Première version web, publiée sur GitHub Pages.

- Cinq modules comme sur le bureau : (1) habitants 2025, (2) morts/an 2023,
  (3) morts de guerre (UCDP/PRIO), (4) machine en n.d., (5) carte du monde
  Equal Earth sur fond Natural Earth, plus le panneau SOURCES numéroté.
- Carte en trois lectures (boutons ou touche m), bulles proportionnelles,
  survol qui nomme le pays et sa valeur, cinq premiers nommés.
- `data.js` embarque les données pour un rendu sans requête et un usage
  `file://` ; `tools/assembler.py` le régénère, `tests/web.py` vérifie les
  totaux, la fraîcheur des données et les cinq sources.
- La page ne lit pas le poste : (4) MACHINE affiche n.d. et le dit. Aucune
  intrusion n'est affichée sans un agent local qui pousserait ses relevés.
