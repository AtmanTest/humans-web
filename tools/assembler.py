#!/usr/bin/env python3
"""tools/assembler.py — écrit data.js à partir des fichiers de données.

La page est statique : un seul fichier data.js (chaînes) évite trois requêtes
et rend le premier affichage synchrone — utile hors ligne et pour les captures.
Les .tsv/.txt restent la source, publiée à côté.
"""
from pathlib import Path
import json

ici = Path(__file__).resolve().parent.parent
morceaux = {}
for nom, fichier in (("tsv", "monde.tsv"), ("meta", "monde.meta"),
                     ("carte", "carte.txt")):
    morceaux[nom] = (ici / "data" / fichier).read_text(encoding="utf-8")

sortie = "/* généré par tools/assembler.py — ne pas éditer à la main */\n"
sortie += "window.HUMANS_DATA = " + json.dumps(morceaux, ensure_ascii=False) + ";\n"
(ici / "data.js").write_text(sortie, encoding="utf-8")
print("data.js :", len(sortie), "octets")
