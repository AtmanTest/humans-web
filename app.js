/* HUMANS — le monde en direct, version web.
 *
 * Mêmes chiffres que l'application de bureau : population (Banque mondiale
 * SP.POP.TOTL 2025), morts/an (population 2023 × taux brut 2023 / 1000) et
 * morts de guerre (VC.BTL.DETH, source UCDP/PRIO). La carte est un fond
 * Natural Earth projeté en Equal Earth.
 *
 * Aucune valeur n'est inventée : ce qui manque s'affiche « n.d. ».
 */
"use strict";

const $ = (s) => document.querySelector(s);
const fr = new Intl.NumberFormat("fr-FR");
const COUL = ["#6ad0ff", "#ffcc55", "#ff5a4a"];
const NOMS = ["population", "morts / an (2023)", "morts de guerre (UCDP)"];

const DATA = { monde: [], meta: {}, anneaux: [], pays: new Map(), mode: 0 };
let bulles = [];          // {x,y,r,nom,val,iso}
let dims = { w: 0, h: 0, ech: 1, ox: 0, oy: 0 };

/* ---------------------------------------------------------------- data */
async function charger() {
  const txt = (f) => fetch(f, { cache: "no-cache" }).then((r) => {
    if (!r.ok) throw new Error(f + " : " + r.status);
    return r.text();
  });
  let tsv, meta, carte;
  if (window.HUMANS_DATA) {
    /* data.js : les mêmes fichiers, embarqués, pour un premier rendu sans
       aller-retour (et pour que la page marche depuis file://) */
    ({ tsv, meta, carte } = window.HUMANS_DATA);
  } else {
    [tsv, meta, carte] = await Promise.all([
      txt("data/monde.tsv"), txt("data/monde.meta"), txt("data/carte.txt"),
    ]);
  }

  for (const l of meta.split("\n")) {
    const c = l.split("\t");
    if (c.length >= 2) DATA.meta[c[0]] = c[1];
  }

  for (const l of tsv.split("\n")) {
    if (!l || l[0] === "#") continue;
    const c = l.split("\t");
    if (c.length < 8) continue;
    DATA.monde.push({
      iso: c[0], nom: c[1],
      pop: +c[2], morts: +c[3], guerre: +c[4], annee: c[5],
      lat: +c[6], lon: +c[7],
    });
  }

  for (const l of carte.split("\n")) {
    const p = l.split("|");
    if (p.length < 4 || p[0] === "ATA") continue;
    const [clon, clat] = p[2].split(",").map(Number);
    const nums = p[3].trim().split(/\s+/);
    const pts = [];
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const a = nums[i].split(",");
      if (a.length === 2) pts.push([+a[0], +a[1]]);
    }
    if (!pts.length) continue;
    if (!DATA.pays.has(p[0]))
      DATA.pays.set(p[0], { iso: p[0], nom: p[1], clon, clat });
    DATA.anneaux.push(pts);
  }
}

/* ----------------------------------------------------------- projection */
const EE = [1.340264, -0.081106, 0.000893, 0.003796];
const MM = 0.8660254037844386;

function poly(t) {
  const t2 = t * t, t6 = t2 * t2 * t2;
  return EE[0] + t2 * (3 * EE[1] + t6 * (7 * EE[2] + 9 * EE[3] * t2));
}
function proj(lon, lat) {
  const phi = lat * Math.PI / 180, lam = lon * Math.PI / 180;
  let s = MM * Math.sin(phi);
  s = Math.max(-1, Math.min(1, s));
  const th = Math.asin(s), p = poly(th);
  return [2 * Math.sqrt(3) * lam * Math.cos(th) / (3 * p), th * p];
}
function regler(w, h) {
  const [x0] = proj(-180, 0), [, yh] = proj(180, 90);
  const lp = 2 * Math.abs(x0), hp = 2 * Math.abs(yh);
  const marge = Math.min(w, h) * 0.03;
  dims.ech = Math.min((w - 2 * marge) / lp, (h - 2 * marge) / hp);
  dims.ox = w / 2;
  dims.oy = h / 2;
  dims.w = w; dims.h = h;
}
function xy(lon, lat) {
  const [px, py] = proj(lon, lat);
  return [dims.ox + px * dims.ech, dims.oy - py * dims.ech];
}

/* ---------------------------------------------------------------- carte */
const cv = $("#monde");
const ctx = cv.getContext("2d");

function taille() {
  const box = cv.parentElement.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.max(320, Math.round(box.width * dpr));
  cv.height = Math.max(240, Math.round(box.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  regler(box.width, box.height);
}

function dessine() {
  const { w, h } = dims;
  ctx.clearRect(0, 0, w, h);

  /* graticule */
  ctx.strokeStyle = "rgba(126,240,164,0.055)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let lon = -180; lon <= 180; lon += 30)
    for (let lat = -90; lat < 90; lat += 3) {
      const [x1, y1] = xy(lon, lat), [x2, y2] = xy(lon, lat + 3);
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    }
  for (let lat = -60; lat <= 60; lat += 30)
    for (let lon = -180; lon < 180; lon += 3) {
      const [x1, y1] = xy(lon, lat), [x2, y2] = xy(lon + 3, lat);
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    }
  ctx.stroke();

  /* terres */
  ctx.beginPath();
  for (const a of DATA.anneaux) {
    for (let i = 0; i < a.length; i++) {
      const [x, y] = xy(a[i][0], a[i][1]);
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
  }
  ctx.fillStyle = "rgba(24,58,38,0.88)";
  ctx.fill();
  ctx.strokeStyle = "rgba(126,240,164,0.32)";
  ctx.lineWidth = 0.7;
  ctx.stroke();

  /* bulles */
  const cle = ["pop", "morts", "guerre"][DATA.mode];
  let vmax = 1;
  for (const p of DATA.monde) if (p[cle] > vmax) vmax = p[cle];
  const rmax = Math.min(w, h) * 0.045;
  bulles = [];

  for (const p of DATA.monde) {
    const v = p[cle];
    if (!v) continue;
    const c = DATA.pays.get(p.iso) || { clon: p.lon, clat: p.lat };
    const [x, y] = xy(c.clon, c.clat);
    const r = 1.8 + rmax * Math.sqrt(v / vmax);
    bulles.push({ x, y, r, nom: p.nom, val: v, iso: p.iso });

    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = COUL[DATA.mode] + "38";
    ctx.fill();
    ctx.strokeStyle = COUL[DATA.mode] + "d9";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  /* les cinq premiers, nommés */
  const top = [...DATA.monde].filter((p) => p[cle] > 0)
    .sort((a, b) => b[cle] - a[cle]).slice(0, 5);
  ctx.font = "600 " + Math.max(10, Math.round(h * 0.020)) + "px ui-monospace, monospace";
  ctx.textAlign = "left";
  ctx.shadowColor = "#05060a";
  ctx.shadowBlur = 5;
  top.forEach((p, i) => {
    const c = DATA.pays.get(p.iso) || { clon: p.lon, clat: p.lat };
    const [x, y] = xy(c.clon, c.clat);
    ctx.fillStyle = COUL[DATA.mode];
    ctx.fillText(p.nom + " " + compact(p[cle]), x + 6, i % 2 ? y + 14 : y - 7);
  });
  ctx.shadowBlur = 0;
}

function compact(v) {
  if (v >= 1e9) return (v / 1e9).toFixed(2).replace(".", ",") + " Md";
  if (v >= 1e6) return Math.round(v / 1e6) + " M";
  if (v >= 1e3) return (v / 1e3).toFixed(1).replace(".", ",") + " k";
  return fr.format(v);
}

/* --------------------------------------------------------------- listes */
function remplit(id, cle, couleur) {
  const hote = $(id);
  /* le nombre de lignes suit la hauteur réelle : rien n'est coupé */
  const place = (hote.clientHeight || 260);
  const lignes = Math.max(3, Math.floor((place - 2) / 17));
  const p = DATA.monde.filter((x) => x[cle] > 0)
    .sort((a, b) => b[cle] - a[cle]).slice(0, lignes);
  const vmax = p.length ? p[0][cle] : 1;
  const total = DATA.monde.reduce((s, x) => s + (x[cle] || 0), 0) || 1;
  hote.innerHTML = "";
  p.forEach((x, i) => {
    const pc = (100 * x[cle] / total).toFixed(1).replace(".", ",");
    const d = document.createElement("div");
    d.className = "ligne";
    d.innerHTML =
      '<span class="barre" style="width:' + (100 * x[cle] / vmax).toFixed(1) + "%\"></span>" +
      '<span class="rg">' + String(i + 1).padStart(2, "0") + "</span>" +
      '<span class="nom">' + x.nom + "</span>" +
      '<span class="val">' + fr.format(x[cle]) + "</span>" +
      '<span class="pc">' + pc + " %</span>";
    d.style.color = couleur;
    hote.appendChild(d);
  });
}

const SOURCES = [
  ["(1)", "HABITANTS", "Banque mondiale · SP.POP.TOTL, 2025", "api.worldbank.org/v2", "pop"],
  ["(2)", "MORTS", "SP.POP.TOTL + SP.DYN.CDRT.IN, 2023", "morts = population × taux brut / 1000", "morts"],
  ["(3)", "GUERRES", "VC.BTL.DETH (UCDP/PRIO), dernière année", "morts de conflit armé, pays par pays", "guerre"],
  ["(4)", "MACHINE", "/proc/stat · /proc/meminfo", "application de bureau uniquement", null],
  ["(5)", "CARTE", "Natural Earth (domaine public)", "projection Equal Earth", null],
];

function source(idDate, sourceDate) {
  const d = DATA.meta[idDate] || "?";
  return d.split("-").reverse().join("/");
}

function rendu() {
  const m = DATA.meta;
  $("#ver").textContent = "web 1.0.0";
  $("#tot-pop").textContent = fr.format(+m.total_pop || 0);
  $("#tot-morts").textContent = fr.format(+m.total_morts || 0);
  $("#tot-guerres").textContent = fr.format(+m.total_guerre || 0);
  $("#an-pop").textContent = m.pop ? source("pop") : "n.d.";
  $("#an-morts").textContent = m.morts ? source("morts") : "n.d.";
  $("#an-guerres").textContent = m.guerre ? "UCDP " + source("guerre") : "n.d.";
  $("#an-sources").textContent = "édition " + source("pop");
  $("#sous-guerres").textContent =
    "morts de guerre · " + Math.round((+m.total_guerre || 0) / 365.25) + " par jour en moyenne";
  $("#pied-date").textContent = "édition des données : " + source("pop");

  $("#ticker").innerHTML =
    "<b>" + compact(+m.total_pop || 0) + "</b> hab · <b>" +
    compact(+m.total_morts || 0) + "</b> morts/an · <span class='r'><b>" +
    fr.format(+m.total_guerre || 0) + "</b> de guerre</span> · " +
    DATA.monde.length + " pays";

  const hote = $("#liste-sources");
  hote.innerHTML = "";
  for (const [num, nom, txt, petit, cle] of SOURCES) {
    const d = document.createElement("div");
    d.className = "bloc";
    d.innerHTML = '<span class="num">' + num + "</span>" +
      '<span class="txt">' + nom + " — " + txt +
      " · <small>" + petit + (cle && m[cle] ? " · édition " + source(cle) : "") + "</small></span>";
    hote.appendChild(d);
  }

  renderListes();
  $("#legende").textContent = NOMS[DATA.mode] +
    " · " + DATA.monde.length + " pays · taille des bulles ∝ valeur";
}

function renderListes() {
  remplit("#liste-pop", "pop", COUL[0]);
  remplit("#liste-morts", "morts", COUL[1]);
  remplit("#liste-guerres", "guerre", COUL[2]);
}

/* ---------------------------------------------------------------- carte UI */
function mode(n) {
  DATA.mode = n % 3;
  document.querySelectorAll("#modes button").forEach((b, i) =>
    b.classList.toggle("actif", i === DATA.mode));
  dessine();
  $("#legende").textContent = NOMS[DATA.mode] +
    " · " + DATA.monde.length + " pays · taille des bulles ∝ valeur";
}

$("#modes").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (b) mode(+b.dataset.mode);
});

addEventListener("keydown", (e) => {
  if (e.key === "m" || e.key === "M") mode(DATA.mode + 1);
});

/* infobulle : le pays sous le curseur, avec sa valeur */
const bulleInfo = $("#infobulle");
cv.addEventListener("mousemove", (e) => {
  const r = cv.getBoundingClientRect();
  const x = e.clientX - r.left, y = e.clientY - r.top;
  let trouve = null;
  for (const b of bulles) {
    const d = Math.hypot(b.x - x, b.y - y);
    if (d < b.r + 3) { trouve = b; break; }
  }
  if (!trouve) { bulleInfo.hidden = true; return; }
  bulleInfo.hidden = false;
  bulleInfo.style.left = trouve.x + "px";
  bulleInfo.style.top = trouve.y + "px";
  bulleInfo.innerHTML = "<b>" + trouve.nom + "</b> · " +
    fr.format(trouve.val) + " " + NOMS[DATA.mode];
});
cv.addEventListener("mouseleave", () => { bulleInfo.hidden = true; });

/* ---------------------------------------------------------------- boucle */
function horloge() {
  $("#heure").textContent = new Date().toLocaleTimeString("fr-FR");
}
setInterval(horloge, 1000);
horloge();

let minuteur = 0;
function redessinerTout() {
  taille(); dessine(); renderListes();
}
new ResizeObserver(() => {
  clearTimeout(minuteur);
  minuteur = setTimeout(redessinerTout, 120);
}).observe(cv.parentElement);
addEventListener("resize", () => {
  clearTimeout(minuteur);
  minuteur = setTimeout(redessinerTout, 120);
});

charger().then(() => {
  rendu();
  taille();
  dessine();
}).catch((e) => {
  $("#ticker").textContent = "données indisponibles : " + e.message;
  $("#tot-pop").textContent = "n.d.";
  $("#tot-morts").textContent = "n.d.";
  $("#tot-guerres").textContent = "n.d.";
  console.error(e);
});
