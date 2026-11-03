"use strict";

/* ===================== OPEN FOOD FACTS (živé API, údaje ODbL) ===================== */

const OFF_FIELDS = "code,product_name,generic_name,brands,nutriments,serving_quantity";
const OFF_ERRORS = {
  timeout: "Open Food Facts neodpovedá (timeout). Skús to znova.",
  network: "Open Food Facts sa nepodarilo kontaktovať (internet alebo je služba dočasne preťažená). Skús to znova.",
  busy: "Open Food Facts je dočasne preťažená. Skús o chvíľu.",
  json: "Neplatná odpoveď z Open Food Facts (skús to znova).",
};
const offErrorText = (code) => OFF_ERRORS[code] || `Open Food Facts vrátila chybu ${String(code).replace("http ", "")}.`;

// Preťažená služba odpovedá bez CORS hlavičiek, prehliadač to vidí ako sieťovú chybu, preto sa skúša znova
async function offRequest(url, retries = 1, timeoutMs = 12000) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    let res;
    try {
      res = await fetch(url, { signal: ctrl.signal });
    } catch (e) {
      if (e.name === "AbortError") return { error: "timeout" };
      if (attempt < retries) { await sleep(1500); continue; }
      return { error: "network" };
    } finally {
      clearTimeout(timer);
    }
    if (res.status === 429 || res.status === 503) {
      if (attempt < retries) { await sleep(1500); continue; }
      return { error: "busy" };
    }
    if (!res.ok) return { error: `http ${res.status}` };
    try { return { data: await res.json() }; } catch (_) { return { error: "json" }; }
  }
  return { error: "network" };
}

function offFood(p) {
  const base = (p.product_name || p.generic_name || "").trim();
  const n = p.nutriments || {};
  let kcal = n["energy-kcal_100g"] || n["energy-kcal_value"];
  if (!kcal) {
    const kj = n["energy-kj_100g"] || n["energy_100g"];
    if (kj) kcal = parseFloat(kj) / 4.184;
  }
  if (!base || !kcal) return null;
  const v = (key, d = 1) => { const x = parseFloat(n[key]); return Number.isFinite(x) ? Math.round(x * 10 ** d) / 10 ** d : 0; };
  const brand = (p.brands || "").split(",")[0].trim();
  const por = [["100 g", 100]];
  const serv = parseFloat(p.serving_quantity);
  if (serv > 0 && serv !== 100) por.unshift(["1 porcia", Math.round(serv)]);
  return {
    id: "off-" + (p.code || norm(base).replace(/\W+/g, "-")), n: brand && !norm(base).includes(norm(brand)) ? `${base} (${brand})` : base,
    cat: "Open Food Facts", k: Math.round(parseFloat(kcal) * 10) / 10, p: v("proteins_100g"), c: v("carbohydrates_100g"), f: v("fat_100g"),
    fib: v("fiber_100g"), sug: v("sugars_100g"), salt: v("salt_100g", 2), por, src: "off", est: 0,
  };
}

// Najprv slovenská databáza, potom svetová. Výsledky bez výpadku sa ukladajú pre prípad, že služba nebude dostupná.
async function searchOpenFoodFacts(query) {
  const key = norm(query).trim();
  const url = (host) => `https://${host}.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}` +
    `&search_simple=1&action=process&json=1&page_size=30&fields=${OFF_FIELDS}`;
  const products = [], seen = new Set();
  const collect = (list) => {
    for (const raw of list || []) {
      const f = offFood(raw);
      if (!f) continue;
      const id = `${norm(f.n)}|${f.k}`;
      if (seen.has(id)) continue;
      seen.add(id); products.push(f);
      if (products.length >= 10) return;
    }
  };
  const sk = await offRequest(url("sk"), 0);
  if (sk.data) collect(sk.data.products);
  let lastError = sk.error || null;
  if (products.length < 6) {
    const world = await offRequest(url("world"));
    if (world.data) { collect(world.data.products); lastError = null; } else if (!products.length) lastError = world.error;
  }
  if (products.length) { cachePut(key, products); return { products, error: null, note: null }; }
  if (lastError) {
    const cached = await cacheGet(key);
    if (cached && cached.length) return { products: cached, error: null, note: "Databáza je nedostupná, zobrazené sú naposledy uložené výsledky." };
    return { products: [], error: offErrorText(lastError), note: null };
  }
  return { products: [], error: `Pre „${query}“ sa nič nenašlo. Skús iný alebo všeobecnejší názov.`, note: null };
}

async function cacheGet(key) {
  try { return ((await idbGet("offCache")) || {})[key]?.products || null; } catch (_) { return null; }
}
async function cachePut(key, products) {
  try {
    const cache = (await idbGet("offCache")) || {};
    cache[key] = { t: Date.now(), products };
    const keep = Object.keys(cache).sort((a, b) => cache[b].t - cache[a].t).slice(0, 40);
    const out = {}; keep.forEach((k) => { out[k] = cache[k]; });
    await idbSet("offCache", out);
  } catch (_) { /* cache je len bonus */ }
}

async function lookupBarcode(code) {
  const { data, error } = await offRequest(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=${OFF_FIELDS}`);
  if (error) return { food: null, error: offErrorText(error) };
  if (!data || data.status !== 1 || !data.product) return { food: null, error: `Produkt s kódom ${code} sa v databáze nenašiel. Skús ho nájsť podľa názvu.` };
  data.product.code = data.product.code || code;
  const food = offFood(data.product);
  if (!food) return { food: null, error: `Produkt ${code} nemá v databáze výživové údaje.` };
  return { food, error: null };
}

/* ===================== AI (Gemini cez OpenAI-kompatibilné API) ===================== */

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai";
const IMAGE_SIZES = { "640": ["Nízka (rýchla)", 0.75], "1024": ["Stredná (odporúčané)", 0.85], "1536": ["Vysoká (presnejšia)", 0.9] };

const AI_SYSTEM_PROMPT =
  "Si slovenský nutričný asistent. Z fotky jedla alebo z textového opisu urč potraviny, odhadni veľkosť porcie a ich reálne nutričné hodnoty (ako z nutričnej databázy). " +
  "Odpovedz VÝHRADNE jedným JSON objektom, bez akéhokoľvek textu navyše.\n" +
  'PRÍKLAD SPRÁVNEJ ODPOVEDE pre opis "2 rožky so šunkou a káva s mliekom":\n' +
  '{"jedlo": "Rožky so šunkou a káva", "jedla": [{"nazov": "Rožok", "gramy": 100, "kcal_100g": 270, "bielkoviny_100g": 8, "sacharidy_100g": 55, "tuky_100g": 2, "vlaknina_100g": 3, "cukry_100g": 3, "sol_100g": 1.2, "istota": 80}, ' +
  '{"nazov": "Šunka", "gramy": 40, "kcal_100g": 110, "bielkoviny_100g": 18, "sacharidy_100g": 1, "tuky_100g": 4, "vlaknina_100g": 0, "cukry_100g": 1, "sol_100g": 2, "istota": 70}, ' +
  '{"nazov": "Káva s mliekom", "gramy": 200, "kcal_100g": 40, "bielkoviny_100g": 2, "sacharidy_100g": 4, "tuky_100g": 1, "vlaknina_100g": 0, "cukry_100g": 4, "sol_100g": 0.1, "istota": 60}]}\n' +
  "Význam polí: jedlo = krátky názov celého jedla, gramy = hmotnosť CELEJ PORCIE tej potraviny v gramoch (nikdy tam nedávaj hodnotu na 100 g), " +
  "kcal_100g a všetky ostatné _100g hodnoty sú na 100 g, istota = tvoja istota odhadu v percentách (0 až 100). " +
  "Ukážka vyššie slúži LEN na vysvetlenie formátu, potraviny v odpovedi sa musia vzťahovať na skutočnú fotku alebo opis, nie na potraviny z ukážky. " +
  "Veľkosť porcie odhadni z fotky: zohľadni veľkosť taniera (bežný jedálenský tanier má priemer asi 26 cm), príbor, pohár, ruku alebo iné predmety na porovnanie a hrúbku jedla. " +
  "Zložené jedlo rozdeľ na jednotlivé potraviny vrátane viditeľného tuku, omáčky a prílohy. Vráť maximálne 8 potravín a každú iba raz. " +
  "Hodnoty musia byť realistické a pre každú potravinu iné. Názvy potravín píš po slovensky.";
const AI_PROMPT_IMAGE = "Rozpoznaj jedlo na tejto fotke, odhadni veľkosť porcie v gramoch pre každú potravinu a vráť JSON podľa zadanej schémy.";
const AI_PROMPT_TEXT = (t) => `Textový opis jedla od používateľa: ${t}\nRozpoznaj potraviny, odhadni veľkosť porcie v gramoch a vráť JSON podľa zadanej schémy.`;

function aiNum(entry, keys, def = 0) {
  for (const k of keys) {
    const v = entry[k];
    if (v === null || v === undefined || v === "") continue;
    if (typeof v === "number") return v;
    const m = String(v).match(/\d+(?:[.,]\d+)?/);
    if (m) return parseFloat(m[0].replace(",", "."));
  }
  return def;
}

function salvageJson(txt) {
  const cut = txt.lastIndexOf("}");
  if (cut === -1) return null;
  const base = txt.slice(0, cut + 1);
  for (const closing of ["]}", "]", "}"]) { try { return JSON.parse(base + closing); } catch (_) { /* skúsi ďalšie */ } }
  return null;
}

// Z odpovede modelu vytiahne {items, dish}: zoznam potravín a názov celého jedla (aj z odpovede v ``` alebo odrezanej v polovici)
function parseAiJson(raw) {
  if (!raw) return { items: [], dish: "" };
  let txt = raw.trim();
  if (txt.includes("```")) {
    for (const part of txt.split("```")) {
      let cand = part.trim();
      if (cand.toLowerCase().startsWith("json")) cand = cand.slice(4).trim();
      if (cand.startsWith("{") || cand.startsWith("[")) { txt = cand; break; }
    }
  }
  const starts = [txt.indexOf("{"), txt.indexOf("[")].filter((i) => i !== -1);
  const first = starts.length ? Math.min(...starts) : -1;
  const last = Math.max(txt.lastIndexOf("}"), txt.lastIndexOf("]"));
  if (first !== -1 && last > first) txt = txt.slice(first, last + 1);
  let data;
  try { data = JSON.parse(txt); } catch (_) { data = salvageJson(txt); }
  if (data === null || data === undefined) return { items: [], dish: "" };
  let dish = "";
  if (!Array.isArray(data) && typeof data === "object") {
    const d = data.jedlo ?? data.nazov_jedla ?? data.dish;
    if (typeof d === "string") dish = d.trim().slice(0, 80);
    const key = ["jedla", "jedlo", "potraviny", "items", "foods", "results"].find((k) => Array.isArray(data[k]));
    data = key ? data[key] : [data];
  }
  if (!Array.isArray(data)) return { items: [], dish };

  const items = [], seen = new Set();
  for (const entry of data) {
    if (!entry || typeof entry !== "object") continue;
    const nameKey = ["nazov", "názov", "name", "food", "jedlo", "potravina"].find((k) => entry[k]);
    const name = nameKey ? String(entry[nameKey]).trim() : "";
    if (!name) continue;
    const k = aiNum(entry, ["kcal_100g", "calories_100g", "energy_kcal_100g", "kcal", "kalorie"]);
    const p = aiNum(entry, ["bielkoviny_100g", "protein_100g", "proteins_100g", "bielkoviny", "protein"]);
    const c = aiNum(entry, ["sacharidy_100g", "carbs_100g", "carbohydrates_100g", "sacharidy", "carbs"]);
    const f = aiNum(entry, ["tuky_100g", "fat_100g", "tuky", "fat"]);
    if (k <= 0 && p <= 0 && c <= 0 && f <= 0) continue;
    if (seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    const grams = Math.max(aiNum(entry, ["gramy", "grams", "hmotnost", "weight", "g"], 100) || 100, 1);
    let conf = aiNum(entry, ["istota", "confidence"], -1);
    if (conf >= 0 && conf <= 1) conf *= 100;
    items.push({
      id: "ai-" + norm(name).replace(/\W+/g, "-"), n: name, cat: "AI odhad", k, p, c, f,
      fib: aiNum(entry, ["vlaknina_100g", "vláknina_100g", "fiber_100g", "vlaknina", "fiber"]),
      sug: aiNum(entry, ["cukry_100g", "sugars_100g", "sugar_100g", "cukry", "sugars"]),
      salt: aiNum(entry, ["sol_100g", "soľ_100g", "salt_100g", "sol", "salt"]),
      por: [["100 g", 100]], src: "ai", est: 1, grams, conf: conf >= 0 ? Math.min(100, Math.round(conf)) : null,
    });
    if (items.length >= 8) break;
  }
  return { items, dish };
}

function fileToDataUrl(file, maxSide = 1024, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Fotku sa nepodarilo načítať.")); };
    img.src = url;
  });
}

function aiHttpError(status, body) {
  const snippet = body ? ` (${body.slice(0, 160)})` : "";
  if (status === 401 || status === 403) return `Neplatný API kľúč alebo nemáš oprávnenie (HTTP ${status}).${snippet}`;
  if (status === 404) return `Zlý názov modelu alebo adresa (HTTP 404).${snippet}`;
  if (status === 429) return `Prekročený limit bezplatnej úrovne alebo kvóta (HTTP 429). Skús o chvíľu.${snippet}`;
  if (status === 400) return `Služba požiadavku odmietla (HTTP 400). Skontroluj kľúč a model.${snippet}`;
  if (status >= 500) return `AI služba má výpadok (HTTP ${status}). Skús to neskôr.`;
  return `AI služba vrátila chybu ${status}.${snippet}`;
}

// Vráti {content, error}. Ak služba odmietne response_format, skúsi to ešte raz bez neho.
async function aiChat(messages, { json = true, maxTokens = 4096, timeoutMs = 90000 } = {}) {
  const cfg = state.ai;
  if (!cfg.key) return { content: "", error: "Chýba API kľúč. Zadaj ho v Nastaveniach." };
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${cfg.key}` };
  const endpoint = GEMINI_URL + "/chat/completions";
  for (const useJson of json ? [true, false] : [false]) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const body = { model: cfg.model || "gemini-2.5-flash", messages, temperature: 0.2, max_tokens: maxTokens };
      if (useJson) body.response_format = { type: "json_object" };
      const res = await fetch(endpoint, { method: "POST", headers, signal: ctrl.signal, body: JSON.stringify(body) });
      if (!res.ok) {
        const text = await res.text();
        if (res.status === 400 && useJson && /response_format|json_object/i.test(text)) continue;
        return { content: "", error: aiHttpError(res.status, text) };
      }
      const data = await res.json();
      return { content: data.choices?.[0]?.message?.content || "", error: null };
    } catch (e) {
      if (e.name === "AbortError") return { content: "", error: `AI neodpovedala do ${Math.round(timeoutMs / 1000)} s. Skús to znova.` };
      return { content: "", error: "Nepodarilo sa spojiť s AI službou (internet alebo blokované spojenie)." };
    } finally {
      clearTimeout(timer);
    }
  }
  return { content: "", error: "AI služba nepodporuje požadovaný formát odpovede." };
}

async function aiAnalyze({ text, imageDataUrl }) {
  const userContent = imageDataUrl
    ? [{ type: "text", text: text ? `${AI_PROMPT_IMAGE} Doplnenie od používateľa: ${text}` : AI_PROMPT_IMAGE }, { type: "image_url", image_url: { url: imageDataUrl } }]
    : AI_PROMPT_TEXT(text);
  const { content, error } = await aiChat([{ role: "system", content: AI_SYSTEM_PROMPT }, { role: "user", content: userContent }]);
  if (error) return { items: [], dish: "", error };
  const { items, dish } = parseAiJson(content);
  if (!items.length) return { items: [], dish: "", error: `Model nevrátil použiteľné potraviny. Odpoveď: ${content.slice(0, 200)}` };
  return { items, dish, error: null };
}

async function aiTest() {
  const { content, error } = await aiChat([{ role: "user", content: "Odpovedz len jedným slovom: OK" }], { json: false, maxTokens: 256, timeoutMs: 30000 });
  if (error) return { ok: false, text: error };
  return { ok: true, text: `AI odpovedá (model ${state.ai.model}): ${content.trim().slice(0, 40) || "bez textu"}` };
}

/* ===================== SKENER ČIAROVÝCH KÓDOV (ZXing, offline) ===================== */

let barcodeReader = null;

function loadZxing() {
  if (window.ZXing) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = "vendor/zxing.min.js";
    el.onload = resolve;
    el.onerror = () => reject(new Error("Skener sa nepodarilo načítať."));
    document.head.appendChild(el);
  });
}

function closeScanner() {
  try { if (barcodeReader) barcodeReader.reset(); } catch (_) { /* nič */ }
  barcodeReader = null;
  $("#scanner").hidden = true;
}

async function openScanner(onCode) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { toast("Kamera nie je dostupná (potrebné je HTTPS)"); return; }
  const status = $("#scan-status");
  status.textContent = "Namier kameru na čiarový kód";
  $("#scanner").hidden = false;
  try {
    await loadZxing();
    const { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } = window.ZXing;
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E]);
    barcodeReader = new BrowserMultiFormatReader(hints, 250);
    await barcodeReader.decodeFromConstraints({ video: { facingMode: { ideal: "environment" } } }, $("#scan-video"), (result) => {
      if (!result) return;
      const code = result.getText();
      closeScanner();
      onCode(code);
    });
  } catch (e) {
    status.textContent = e && e.name === "NotAllowedError"
      ? "Prístup ku kamere je zakázaný. Povoľ ho v Nastavenia → Safari → Kamera."
      : `Kameru sa nepodarilo spustiť${e && e.message ? ": " + e.message : "."}`;
  }
}
