# HUMANS — version web

Le tableau de bord de HUMANS (application de bureau GTK4, projet `matrix`) en
page statique : population, morts et morts de guerre pays par pays, carte du
monde, sources officielles. Aucune dépendance, aucun serveur, aucun build :
trois fichiers et des données.

    index.html   la page
    style.css    le noir et l'orange des sources
    app.js       lecture des données, listes, carte (canvas, Equal Earth)
    data.js      les mêmes données embarquées (généré)
    data/        monde.tsv, monde.meta, carte.txt (source publiée)
    tools/assembler.py   régénère data.js depuis data/
    tests/web.py         contrôles

## Ce que la page montre

| module | contenu | source |
|---|---|---|
| (1) HABITANTS | top pays, 2025 | Banque mondiale `SP.POP.TOTL` |
| (2) MORTS | morts/an, 2023 | `SP.POP.TOTL` × `SP.DYN.CDRT.IN` / 1000 |
| (3) GUERRES | morts de conflit armé | `VC.BTL.DETH`, source UCDP/PRIO |
| (4) MACHINE | CPU, RAM | **n.d.** — une page web ne lit pas `/proc` |
| (5) CARTE | planisphère, bulles ∝ valeur | Natural Earth (domaine public) |
| SOURCES | les cinq numéros, jeu, URL, édition | — |

La carte se lit en trois modes : `population`, `morts/an`, `guerres` (boutons
ou touche `m`). Survoler une bulle donne le pays et sa valeur. La taille des
bulles est proportionnelle à la valeur de la lecture courante ; la légende dit
laquelle.

Les chiffres sont ceux du fichier publié à côté : `data/monde.tsv` (217 pays)
et `data/monde.meta` (totaux). Un pays sans mesure n'a pas de bulle et
n'apparaît pas dans les listes ; rien n'est mis à zéro pour faire joli.

## Ce qui ne peut pas passer sur le web

The Punisher (`~/Projets/sentinelle`) lit `/proc`, `ss`, `journalctl`, `ufw`,
lance lynis, fail2ban, clamav, nmap : tout cela exige une machine et des
droits. Une page hébergée ne peut pas inspecter ton poste, et un site public ne
doit pas en avoir l'occasion. Ce qui est en ligne ici est le versant monde —
des données publiques — pas le versant poste.

Seule exception possible : un agent local qui pousse ses relevés (attaques,
santé du poste) vers un stockage privé, et une page qui les lit. Cela demande
un hébergement avec écriture, donc pas GitHub Pages.

## Lancer en local

    python3 -m http.server 8811
    # http://127.0.0.1:8811/

`index.html` s'ouvre aussi en `file://` : `data.js` évite les requêtes.

Après une mise à jour des données (par `~/Projets/matrix/tools/fetch_monde.py`) :

    cp ../matrix/data/{monde.tsv,monde.meta,carte.txt} data/
    ./tools/assembler.py
    python3 tests/web.py

## Tests

    python3 tests/web.py

Il recalcule les totaux depuis `monde.tsv`, vérifie qu'ils concordent avec
`monde.meta`, que `data.js` est à jour (SHA-256), que `index.html` nomme les
cinq modules et les sources, et que la carte porte au moins 150 pays.

## Déploiement

GitHub Pages, branche `master`, racine. `data.js` est versionné : la page se
sert sans build. Rien à installer côté serveur.

## Crédits

Données : Banque mondiale (API officielle), UCDP/PRIO via `VC.BTL.DETH`.
Fond de carte : Natural Earth, domaine public, pré-traité par le projet FLUX.
Le dessin reprend la projection Equal Earth (Šavrič, Patterson, Jenny, 2018).
Application de bureau : `~/Projets/matrix`, onglet HUMANS.
