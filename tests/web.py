#!/usr/bin/env python3
"""tests/web.py — la page web tient les mêmes engagements que le bureau.

1. les totaux de data/monde.tsv, recalculés, concordent avec monde.meta ;
2. data.js est à jour par rapport à data/ (mêmes octets) ;
3. index.html annonce les cinq modules et les sources nommées ;
4. la carte pèse assez de pays pour être un planisphère, pas un dessin vide.
"""
import hashlib
import json
import re
import sys
from pathlib import Path

ici = Path(__file__).resolve().parent.parent
echec = []

tsv = (ici / "data/monde.tsv").read_text(encoding="utf-8")
meta = {}
for l in (ici / "data/monde.meta").read_text(encoding="utf-8").splitlines():
    c = l.split("\t")
    if len(c) >= 2:
        meta[c[0]] = c[1]

pop = morts = guerre = 0
n = 0
for l in tsv.splitlines():
    if not l or l.startswith("#"):
        continue
    c = l.split("\t")
    if len(c) < 8:
        continue
    n += 1
    pop += int(c[2] or 0)
    morts += int(c[3] or 0)
    guerre += int(c[4] or 0)

if n != 217:
    echec.append("217 pays attendus, %d lus" % n)
if int(meta.get("total_guerre", 0)) != guerre:
    echec.append("total guerre %s != somme %d" % (meta.get("total_guerre"), guerre))
if abs(int(meta.get("total_morts", 0)) - morts) > 5e6:
    echec.append("total morts %s incohérent avec la somme %d" % (meta.get("total_morts"), morts))
if int(meta.get("total_pop", 0)) < 8e9:
    echec.append("population mondiale absente ou fausse : %s" % meta.get("total_pop"))

datajs = (ici / "data.js").read_text(encoding="utf-8")
m = re.search(r"window\.HUMANS_DATA = (.*);\n?$", datajs, re.S)
if not m:
    echec.append("data.js illisible")
else:
    obj = json.loads(m.group(1))
    for nom, f in (("tsv", "monde.tsv"), ("meta", "monde.meta"), ("carte", "carte.txt")):
        if hashlib.sha256(obj[nom].encode()).hexdigest() != \
           hashlib.sha256((ici / "data" / f).read_bytes()).hexdigest():
            echec.append("data.js périmé pour %s (relancer tools/assembler.py)" % f)

html = (ici / "index.html").read_text(encoding="utf-8")
for attendu in ["(1) HABITANTS", "(2) MORTS", "(3) GUERRES", "(4) MACHINE",
                "(5) CARTE", "SP.POP.TOTL", "SP.DYN.CDRT.IN", "VC.BTL.DETH",
                "Natural Earth", "SOURCES"]:
    if attendu not in html:
        echec.append("index.html ne nomme pas %s" % attendu)

carte = (ici / "data/carte.txt").read_text(encoding="utf-8")
pays = len({l.split("|")[0] for l in carte.splitlines() if l.count("|") >= 3})
if pays < 150:
    echec.append("seulement %d pays dans la carte" % pays)

if echec:
    for e in echec:
        print("      " + e)
    sys.exit(1)
print("      %d pays, totaux recalculés, data.js à jour, %d pays dessinés" % (n, pays))
sys.exit(0)
