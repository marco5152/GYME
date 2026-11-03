"use strict";

const APP_VERSION = "2.1.0";

/* ===================== POMOCNÉ FUNKCIE ===================== */

const $ = (sel, root = document) => root.querySelector(sel);
const fmt = (n) => Math.round(n).toLocaleString("sk-SK");
const fmt1 = (n) => (Math.round(n * 10) / 10).toString().replace(".", ",");
const num = (s) => parseFloat(String(s).replace(/[\s\u00a0]/g, "").replace(",", "."));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const norm = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const WD = ["Nedeľa", "Pondelok", "Utorok", "Streda", "Štvrtok", "Piatok", "Sobota"];
const WDS = ["Ne", "Po", "Ut", "St", "Št", "Pi", "So"];
const MON = ["januára", "februára", "marca", "apríla", "mája", "júna", "júla", "augusta", "septembra", "októbra", "novembra", "decembra"];
const MON_S = ["jan", "feb", "mar", "apr", "máj", "jún", "júl", "aug", "sep", "okt", "nov", "dec"];

function isoDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function parseIso(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
function addDays(d, n) { const r = new Date(d.getFullYear(), d.getMonth(), d.getDate()); r.setDate(r.getDate() + n); return r; }
const todayIso = () => isoDate(new Date());
const fmtDate = (d) => `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;

/* ===================== PROFIL A PRÍJEM (Mifflin-St Jeor) ===================== */

const WORK_TYPES = {
  sedava: ["Sedavá (kancelária, celý deň sedenie)", 1.20],
  lahka: ["Ľahká manuálna (státie, predavač, učiteľ)", 1.32],
  stredna: ["Stredná (chôdza, montáž, sklad, obchôdzky)", 1.46],
  tazka: ["Ťažká fyzická (stavba, pole, nakladanie)", 1.62],
};
const SPORT_LEVELS = {
  ziadny: ["Žiadny šport", 0.0],
  obcas: ["Občas (1-2 tréningy týždenne)", 0.08],
  pravidelne: ["Pravidelne (3-4 tréningy týždenne)", 0.15],
  casto: ["Často (5-6 tréningov týždenne)", 0.25],
  denne: ["Denne alebo 2× denne", 0.35],
};
const GOAL_TYPES = {
  schudnut: ["Schudnúť (deficit 20 %)", 0.8],
  udrzat: ["Udržať váhu", 1.0],
  nabrat: ["Nabrať svaly (prebytok 15 %)", 1.15],
};
const SEX_LABELS = { muz: "Muž", zena: "Žena" };

function calcIntake(profile) {
  const sex = profile.sex || "muz";
  const height = Number(profile.height_cm) || 0, weight = Number(profile.weight_kg) || 0, age = Number(profile.age) || 0;
  const [, workFactor] = WORK_TYPES[profile.work] || WORK_TYPES.sedava;
  const [, sportFactor] = SPORT_LEVELS[profile.sport] || SPORT_LEVELS.ziadny;
  const [goalLabel, goalFactor] = GOAL_TYPES[profile.goal] || GOAL_TYPES.udrzat;

  const bmr = 10 * weight + 6.25 * height - 5 * age + (sex === "muz" ? 5 : -161);
  const workKcal = bmr * (workFactor - 1.0), sportKcal = bmr * sportFactor;
  const tdee = bmr + workKcal + sportKcal;
  const calories = Math.max(tdee * goalFactor, sex === "muz" ? 1500 : 1200);
  const protein = Math.min(weight * 1.8, (calories * 0.4) / 4);
  const fat = (calories * 0.25) / 9;
  const carbs = Math.max(calories - protein * 4 - fat * 9, 0) / 4;
  const bmi = height ? weight / (height / 100) ** 2 : 0;
  return {
    bmr, workKcal, sportKcal, tdee, calories, protein, carbs, fat, bmi, goalText: goalLabel,
    bmiText: bmi < 18.5 ? "podváha" : bmi < 25 ? "normálna váha" : bmi < 30 ? "nadváha" : "obezita",
    ideal: height ? [18.5 * (height / 100) ** 2, 24.9 * (height / 100) ** 2] : [0, 0],
  };
}

function profileIsValid(p) {
  const h = Number(p.height_cm), w = Number(p.weight_kg), a = Number(p.age);
  return h >= 100 && h <= 250 && w >= 30 && w <= 300 && a >= 10 && a <= 100;
}

function nutrientTargets(cal) {
  return { fib: Math.max(25, (cal * 14) / 1000), sug: Math.max(10, (cal * 0.1) / 4), salt: 5 };
}

/* Stav prstenca: farby sú CSS premenné, aby ich šlo meniť paletou */
const C_WARN = "var(--warn)", C_OK = "var(--ok)", C_BAD = "var(--bad)";
function ringState(value, target, dir) {
  const r = target > 0 ? value / target : 0;
  if (dir === "max") return { r, color: r > 1.1 ? C_BAD : r > 0.8 ? C_WARN : C_OK };
  return { r, color: r > 1.1 ? C_BAD : r >= 0.9 ? C_OK : C_WARN };
}

/* ===================== ÚLOŽISKO (IndexedDB) ===================== */

function defaultState() {
  return {
    version: 2, nextId: 1,
    meals: [],        // {id, date, t (HH:MM), meal (odvodené z času), fid, name, g, per:{k,p,c,f,fib,sug,salt}, src, est}
    acts: [],         // {id, date, name, cal}
    favs: [],         // id potravín
    custom: [],       // vlastné a uložené potraviny (aj z Open Food Facts a AI)
    recent: [],       // naposledy pridané potraviny (kópie objektov)
    weights: {},      // { "YYYY-MM-DD": kg }
    goals: { kcal: 2200, p: 140, c: 250, f: 70 },
    profile: { sex: "muz", height_cm: 180, weight_kg: 80, age: 30, work: "sedava", sport: "ziadny", goal: "udrzat" },
    profileDone: false,
    ai: { key: "", model: "gemini-2.5-flash", imageSize: "1024" },
    theme: "auto", pal: "blue", lastBackup: null,
  };
}

function normalizeState(raw) {
  const base = defaultState();
  const s = Object.assign(base, raw || {});
  s.goals = Object.assign(base.goals, s.goals);
  s.profile = Object.assign(base.profile, s.profile);
  s.ai = Object.assign(base.ai, s.ai);
  for (const k of ["meals", "acts", "favs", "custom", "recent"]) if (!Array.isArray(s[k])) s[k] = [];
  if (!s.weights || typeof s.weights !== "object") s.weights = {};
  // Staršie záznamy (z čias ručného výberu jedla) dostanú čas podľa pôvodného zaradenia
  for (const m of s.meals) if (!m.t) m.t = MEAL_AT[m.meal] || "12:00";
  const maxId = Math.max(0, ...s.meals.map((x) => Number(x.id) || 0), ...s.acts.map((x) => Number(x.id) || 0));
  s.nextId = Math.max(Number(s.nextId) || 1, maxId + 1);
  return s;
}

let state = defaultState();

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("tabulky", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("kv");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbGet(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction("kv").objectStore("kv").get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbSet(key, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("kv", "readwrite");
    tx.objectStore("kv").put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
let saveWarned = false;
function save() {
  idbSet("state", state).catch(() => {
    if (!saveWarned) { saveWarned = true; if (typeof toast === "function") toast("Dáta sa nepodarilo uložiť"); }
  });
}
const newId = () => state.nextId++;

/* Záloha zo starej appky Kalórie (formát 1.x) sa prevedie na nový formát */
function convertLegacy(raw) {
  const s = defaultState();
  const per = (g, v) => (g > 0 ? (v || 0) / g * 100 : 0);
  s.meals = raw.meals.map((m) => {
    const g = Number(m.grams) || 100;
    return {
      id: s.nextId++, date: m.date, t: "12:30", meal: "Obed", fid: "legacy", name: m.name, g,
      per: { k: per(g, m.cal), p: per(g, m.p), c: per(g, m.c), f: per(g, m.f), fib: per(g, m.fib), sug: per(g, m.sug), salt: per(g, m.salt) },
      src: "custom", est: 0,
    };
  });
  s.acts = (raw.acts || []).map((a) => ({ id: s.nextId++, date: a.date, name: a.name, cal: a.cal }));
  for (const f of raw.favs || []) {
    const id = "u" + s.nextId++;
    s.custom.push({ id, n: f.name, cat: "Moje", k: f.cal_100g, p: f.p_100g || 0, c: f.c_100g || 0, f: f.f_100g || 0,
      fib: f.fib_100g || 0, sug: f.sug_100g || 0, salt: f.salt_100g || 0, por: [["100 g", 100]], src: "custom", est: 0 });
    s.favs.push(id);
  }
  s.weights = raw.weights || {};
  if (raw.goals) s.goals = { kcal: raw.goals.cal, p: raw.goals.p, c: raw.goals.c, f: raw.goals.f };
  if (raw.profile) { s.profile = Object.assign(s.profile, raw.profile); s.profileDone = true; }
  return normalizeState(s);
}

/* ===================== DATABÁZA POTRAVÍN ===================== */

let BUILTIN = [];
let BUILTIN_MAP = new Map();

function prepFood(it) {
  return { id: it.id, n: it.n, cat: it.cat, k: it.k, p: it.p, c: it.c, f: it.f, fib: it.fib || 0, sug: it.sug || 0, salt: it.salt || 0,
    por: it.por && it.por.length ? it.por : [["100 g", 100]], src: it.src, est: it.est ? 1 : 0 };
}

async function loadFoods() {
  const res = await fetch("foods.json");
  if (!res.ok) throw new Error("foods.json");
  const data = await res.json();
  BUILTIN = data.items.map(prepFood);
  BUILTIN_MAP = new Map(BUILTIN.map((f) => [f.id, f]));
}

const allFoods = () => BUILTIN.concat(state.custom);
const getFood = (id) => BUILTIN_MAP.get(id) || state.custom.find((f) => f.id === id) || null;
const isFav = (id) => state.favs.includes(id);

function searchFoods(query) {
  const words = norm(query).split(/\s+/).filter(Boolean);
  if (!words.length) return allFoods();
  return allFoods().filter((f) => { const k = norm(f.n); return words.every((w) => k.includes(w)); });
}

function toggleFav(food) {
  if (isFav(food.id)) { state.favs = state.favs.filter((x) => x !== food.id); save(); return false; }
  if (!BUILTIN_MAP.has(food.id) && !state.custom.some((f) => f.id === food.id)) state.custom.push({ ...food });
  state.favs.push(food.id);
  save();
  return true;
}

/* ===================== ZÁZNAMY ===================== */

const MEAL_AT = { "Raňajky": "08:00", "Obed": "12:30", "Desiate": "15:30", "Večera": "18:30" };
// Jedlá sa nerozdeľujú ručne: čas pridania určí, či ide o raňajky, obed, desiatu alebo večeru
function mealForTime(t) {
  const h = parseInt(String(t).slice(0, 2), 10);
  return h < 10 ? "Raňajky" : h < 14 ? "Obed" : h < 17 ? "Desiate" : "Večera";
}
const nowTime = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
const ZERO = { k: 0, p: 0, c: 0, f: 0, fib: 0, sug: 0, salt: 0 };

const nutr = (e) => { const k = e.g / 100, o = {}; for (const key in ZERO) o[key] = (e.per[key] || 0) * k; return o; };
function totals(list) {
  const t = { ...ZERO };
  for (const e of list) { const n = nutr(e); for (const key in t) t[key] += n[key]; }
  return t;
}
const dayEntries = (date) => state.meals.filter((m) => m.date === date).sort((a, b) => (a.t || "").localeCompare(b.t || "") || a.id - b.id);
const dayActs = (date) => state.acts.filter((a) => a.date === date);
const dayBurned = (date) => dayActs(date).reduce((a, x) => a + x.cal, 0);

function rememberFood(food) {
  const snap = { id: food.id, n: food.n, cat: food.cat, k: food.k, p: food.p, c: food.c, f: food.f, fib: food.fib, sug: food.sug,
    salt: food.salt, por: food.por, src: food.src, est: food.est };
  state.recent = [snap, ...state.recent.filter((x) => x.id !== food.id)].slice(0, 12);
}

function addEntry(food, grams, date, time = nowTime()) {
  const e = {
    id: newId(), date, t: time, meal: mealForTime(time), fid: food.id, name: food.n, g: grams,
    per: { k: food.k, p: food.p, c: food.c, f: food.f, fib: food.fib || 0, sug: food.sug || 0, salt: food.salt || 0 },
    src: food.src, est: food.est ? 1 : 0,
  };
  state.meals.push(e);
  rememberFood(food);
  save();
  return e;
}

function removeEntry(id) { state.meals = state.meals.filter((m) => m.id !== id); save(); }
