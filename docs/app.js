"use strict";

/* ===================== STAV ROZHRANIA ===================== */

const ui = {
  tab: "today", prevTab: "today", date: todayIso(), anchor: todayIso(), more: false,
  q: "", cat: "Všetko", sort: "name", span: "week",
  off: { q: "", results: [], status: null, busy: false },
  aif: { q: "", results: [], status: null, busy: false },
  ai: { file: null, preview: null, items: [], dish: "", status: null, busy: false, text: "" },
  pool: new Map(),   // dočasné potraviny (výsledky z Open Food Facts a AI) podľa id
};
const anyFood = (id) => getFood(id) || ui.pool.get(id) || null;
const view = () => $("#view");

const ICON = {
  home: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  food: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>',
  chart: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>',
  gear: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h0a1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  close: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  search: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  cam: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  bar: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6v12M8 6v12M12 6v12M16 6v12M20 6v12" stroke-width="1.6"/></svg>',
  pen: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  star: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.4 6.4 20.3l1.1-6.2L3 9.7l6.2-.9z"/></svg>',
  run: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="14" cy="4.5" r="1.8"/><path d="M5 21l3-6 3 2v5M8 15l3-5 4 2 2 3M10 10L7 7"/></svg>',
  chev: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  left: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
  right: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  cal: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
};

/* ===================== PRSTENCE (plnia sa animovane od predošlej hodnoty) ===================== */

const ringPrev = {}, ringNext = {};
function ring(key, val, target, dir, center) {
  const st = ringState(val, target, dir), pct = Math.min(st.r, 1), C = 2 * Math.PI * 52;
  ringNext[key] = pct;
  const prev = ringPrev[key] || 0;
  return `<div class="ring"><svg viewBox="0 0 120 120"><circle class="trk" cx="60" cy="60" r="52"/>
    <circle class="arc" data-key="${key}" data-c="${C}" cx="60" cy="60" r="52" transform="rotate(-90 60 60)"
      stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - prev)}" style="stroke:${st.color};opacity:${prev > 0 ? 1 : 0}"/></svg>
    <div class="rc">${center}</div></div>`;
}
function animateRings() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    document.querySelectorAll(".arc").forEach((a) => {
      const k = a.dataset.key, C = +a.dataset.c;
      a.style.strokeDashoffset = C * (1 - (ringNext[k] || 0));
      a.style.opacity = ringNext[k] > 0 ? 1 : 0;
      ringPrev[k] = ringNext[k] || 0;
    });
  }));
}

/* ===================== VYKRESLENIE ===================== */

function render() {
  const d = parseIso(ui.date);
  const isToday = ui.date === todayIso();
  const heads = {
    today: [isToday ? "Dnes" : WD[d.getDay()], `${WD[d.getDay()]} ${d.getDate()}. ${MON[d.getMonth()]}`],
    foods: ["Potraviny", "Tabuľky na 100 g"],
    progress: ["Pokrok", ui.span === "week" ? "Posledných 7 dní" : "Posledných 30 dní"],
    settings: ["Nastavenia", "Profil, AI, záloha"],
  };
  const [t, s] = heads[ui.tab];
  document.body.classList.toggle("in-settings", ui.tab === "settings");
  $("#head").innerHTML = `<div><h1>${t}</h1><div class="sub">${s}</div></div>` + (ui.tab === "settings"
    ? `<button class="hbtn" data-act="settings-close" aria-label="Zavrieť">${ICON.close}</button>`
    : `<button class="hbtn" data-act="settings" aria-label="Nastavenia">${ICON.gear}</button>`);
  $("#nav").innerHTML = [["today", "Dnes", ICON.home], ["foods", "Potraviny", ICON.food], ["progress", "Pokrok", ICON.chart]]
    .map(([k, l, i]) => `<button data-tab="${k}" class="${ui.tab === k ? "on" : ""}">${i}${l}</button>`).join("");
  ({ today: renderToday, foods: renderFoods, progress: renderProgress, settings: renderSettings })[ui.tab]();
  animateRings();
}

const statusHtml = (st) => (st ? `<div class="msg ${st.cls}">${esc(st.text)}</div>` : "");
const srcLabel = (f) => ({
  usda: "Zdroj: USDA FoodData Central",
  recipe: "Odhad z receptúry, skutočné jedlo sa môže líšiť",
  off: "Zdroj: Open Food Facts",
  ai: "Odhad od AI, skontroluj hodnoty",
  custom: "Vlastná potravina",
}[f.src] || "");

function daysSince(iso) { return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000); }

function banners() {
  let h = "";
  if (!state.profileDone) {
    h += `<div class="banner"><span>Nastav profil a denný cieľ kalórií.</span><button class="btn" data-act="goto-profile">Nastaviť</button></div>`;
  }
  if (state.meals.length >= 5 && (!state.lastBackup || daysSince(state.lastBackup) >= 14)) {
    h += `<div class="banner"><span>${state.lastBackup ? `Posledná záloha bola pred ${daysSince(state.lastBackup)} dňami.` : "Zálohu dát si ešte nerobil."}</span><button class="btn" data-act="goto-backup">Zálohovať</button></div>`;
  }
  return h;
}

/* ----- DNES ----- */

function weekStrip() {
  const end = parseIso(ui.anchor);
  const days = Array.from({ length: 7 }, (_, i) => addDays(end, i - 6));
  const dot = (iso) => {
    const k = totals(dayEntries(iso)).k;
    return k === 0 ? "var(--track)" : ringState(k, state.goals.kcal + dayBurned(iso), "min").color;
  };
  const canNext = ui.anchor < todayIso();
  return `<div class="weekbar">
      <button data-act="week-prev" aria-label="Predchádzajúci týždeň">${ICON.left}</button>
      <span>${days[0].getDate()}. ${MON_S[days[0].getMonth()]} – ${days[6].getDate()}. ${MON_S[days[6].getMonth()]}</span>
      <span style="display:flex"><label aria-label="Vybrať dátum">${ICON.cal}<input type="date" id="date-pick" value="${ui.date}" max="${todayIso()}"></label>
      <button data-act="week-next" aria-label="Nasledujúci týždeň" ${canNext ? "" : 'disabled style="opacity:.3"'}>${ICON.right}</button></span></div>
    <div class="days">${days.map((d) => { const iso = isoDate(d);
      return `<button class="day ${iso === ui.date ? "on" : ""}" data-day="${iso}">${WDS[d.getDay()]}<b>${d.getDate()}</b><i style="background:${dot(iso)}"></i></button>`; }).join("")}</div>`;
}

function renderToday() {
  const entries = dayEntries(ui.date), t = totals(entries);
  const burned = dayBurned(ui.date), goals = state.goals, limits = nutrientTargets(goals.kcal);
  const target = goals.kcal + burned, rem = target - t.k;
  const mini = (key, name, val, tg, dir, label) => `<div class="mini">${ring(key, val, tg, dir, `<b>${fmt1(val)}</b><span>z ${fmt(tg)} g</span>`)}<div class="nm">${label || name}</div></div>`;

  const rows = entries.map((e) => `<button class="entry" data-edit="${e.id}"><div class="tm">${esc(e.t || "")}</div><div class="mid"><div class="n">${esc(e.name)}${e.est ? '<span class="est">odhad</span>' : ""}</div>
      <div class="g">${fmt(e.g)} g · ${esc(e.meal || mealForTime(e.t))}</div></div><div class="k">${fmt(nutr(e).k)} <small>kcal</small></div></button>`).join("");
  const meals = `<div class="meal">${rows || `<div class="empty">Zatiaľ nič. Odfoť jedlo a AI ho vyhodnotí, alebo ťukni na Pridať.</div>`}</div>`;
  const acts = dayActs(ui.date).map((a) => `<button class="actrow" data-act-edit="${a.id}"><b>${esc(a.name)}</b><span>−${fmt(a.cal)} kcal</span></button>`).join("");
  const aiCard = `<button class="aicard" data-act="ai-snap">${ICON.cam}<div><b>Odfotiť jedlo</b><span>AI vyhodnotí porciu, zloženie a kalórie</span></div></button>
    <div class="aisub"><button data-act="ai-gallery">Z galérie</button><button data-act="ai-describe">Opísať textom</button></div>`;

  view().innerHTML = banners() + weekStrip() + `
  <div class="card hero">
    ${ring("kcal", t.k, target, "min", `<b>${fmt(Math.abs(rem))}</b><span>${rem >= 0 ? "kcal zostáva" : "kcal nad cieľom"}</span>`)}
    <div class="hero-sub">Zjedené <b>${fmt(t.k)}</b> z ${fmt(goals.kcal)} kcal${burned ? ` · aktivita +${fmt(burned)}` : ""}</div>
    <div class="trio">${mini("p", "Bielkoviny", t.p, goals.p, "min")}${mini("c", "Sacharidy", t.c, goals.c, "min")}${mini("f", "Tuky", t.f, goals.f, "min")}</div>
    ${ui.more ? `<div class="trio">${mini("fib", "Vláknina", t.fib, limits.fib, "min")}${mini("sug", "Cukry", t.sug, limits.sug, "max", "Cukry · limit")}${mini("salt", "Soľ", t.salt, limits.salt, "max", "Soľ · limit")}</div>` : ""}
    <button class="more" data-act="more">${ui.more ? "Menej" : "Viac nutrientov"} ${ICON.chev}</button>
  </div>
  <h2>Jedlá dnes</h2>${aiCard}${meals}
  ${acts ? `<h2>Aktivita</h2>${acts}` : ""}`;
}

/* ----- POTRAVINY ----- */

function foodRow(f) {
  const tot = f.p * 4 + f.c * 4 + f.f * 9 || 1;
  return `<button class="frow" data-food="${esc(f.id)}"><div><div class="fn">${esc(f.n)}${isFav(f.id) ? " ★" : ""}${f.est ? '<span class="est">odhad</span>' : ""}</div>
    <div class="fm"><i style="color:var(--mp)">B</i> ${fmt1(f.p)} · <i style="color:var(--mc)">S</i> ${fmt1(f.c)} · <i style="color:var(--mf)">T</i> ${fmt1(f.f)}</div>
    <div class="mix"><i style="flex:${f.p * 4 / tot};background:var(--mp)"></i><i style="flex:${f.c * 4 / tot};background:var(--mc)"></i><i style="flex:${f.f * 9 / tot};background:var(--mf)"></i></div></div>
    <div class="fk"><b>${fmt(f.k)}</b><span>kcal / 100 g</span></div></button>`;
}

function foodList() {
  let list = searchFoods(ui.q).filter((f) => ui.cat === "Všetko" || (ui.cat === "Obľúbené" ? isFav(f.id) : ui.cat === "Moje" ? f.src === "custom" : f.cat === ui.cat));
  list.sort({ name: (a, b) => a.n.localeCompare(b.n, "sk"), kcal: (a, b) => b.k - a.k, protein: (a, b) => b.p - a.p }[ui.sort]);
  list.forEach((f) => ui.pool.set(f.id, f));
  return (list.map(foodRow).join("") || `<div class="cnt">Nič sa nenašlo v tabuľkách.${ui.q.trim() ? " Skús tlačidlo „Nájsť pomocou AI“ nižšie." : ""}</div>`) + (list.length ? `<div class="cnt">${list.length} potravín</div>` : "");
}

function aiFoodBlock() {
  const q = ui.q.trim();
  if (!q) return "";
  const o = ui.aif;
  const btn = `<button class="btn sec" data-act="ai-food-search" ${o.busy ? "disabled" : ""}>✨ Nájsť „${esc(q)}“ pomocou AI</button>`;
  const results = o.q === q ? o.results.map((f) => { ui.pool.set(f.id, f); return foodRow(f); }).join("") : "";
  return `<h2><span>AI návrhy</span></h2>${btn}${o.q === q ? statusHtml(o.status) : ""}${results}`;
}

function offBlock() {
  const q = ui.q.trim();
  const o = ui.off;
  const btn = q ? `<button class="btn sec" data-act="off-search" ${o.busy ? "disabled" : ""}>${ICON.search.replace('width="20" height="20"', 'width="18" height="18" style="display:inline;vertical-align:-3px"')} Hľadať „${esc(q)}“ aj v Open Food Facts</button>` : "";
  const results = o.q === q ? o.results.map((f) => { ui.pool.set(f.id, f); return foodRow(f); }).join("") : "";
  return `${aiFoodBlock()}<h2><span>Balené výrobky</span></h2>${btn}${o.q === q ? statusHtml(o.status) : ""}${results}
    <div class="src-note">Údaje z Open Food Facts (ODbL), môžu obsahovať chyby · základné potraviny z USDA FoodData Central (CC0)</div>`;
}

function renderFoods() {
  const cats = ["Všetko", "Obľúbené", "Moje", ...new Set(BUILTIN.map((f) => f.cat))];
  view().innerHTML = `<div class="search">${ICON.search}<input id="q" type="search" enterkeyhint="search" placeholder="Hľadať potravinu…" value="${esc(ui.q)}" autocomplete="off" autocapitalize="off">
      <button class="hbtn" style="background:none;width:44px" data-act="scan" aria-label="Skenovať čiarový kód">${ICON.bar}</button></div>
    <div class="chips">${cats.map((c) => `<button class="chip ${ui.cat === c ? "on" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`).join("")}</div>
    <div class="sortbar">Zoradiť:${[["name", "Názov"], ["kcal", "Kalórie"], ["protein", "Bielkoviny"]].map(([k, l]) => `<button data-sort="${k}" class="${ui.sort === k ? "on" : ""}">${l}</button>`).join("")}</div>
    <div id="flist">${foodList()}</div><div id="offblock">${offBlock()}</div>`;
}

/* ----- POKROK ----- */

function barChart(vals, labels, goal) {
  const W = 360, H = 190, L = 40, B = 24, T = 10, pw = W - L - 6, ph = H - B - T;
  const max = Math.max(...vals, goal) * 1.1 || 1, y = (v) => T + ph - (v / max) * ph, bw = pw / vals.length;
  let s = `<svg class="chart" viewBox="0 0 ${W} ${H}">`;
  for (let i = 0; i <= 3; i++) { const v = (max / 3) * i; s += `<line x1="${L}" x2="${W - 6}" y1="${y(v)}" y2="${y(v)}" style="stroke:var(--line)"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" font-size="10" style="fill:var(--muted)">${fmt(v)}</text>`; }
  vals.forEach((v, i) => {
    const h = (v / max) * ph, x = L + bw * i + bw * 0.2;
    s += `<rect x="${x}" y="${T + ph - h}" width="${bw * 0.6}" height="${Math.max(h, 2)}" rx="${Math.min(6, bw * 0.3)}" style="fill:${v ? ringState(v, goal, "min").color : "var(--track)"}"/>`;
    if (labels[i]) s += `<text x="${L + bw * i + bw / 2}" y="${H - 6}" text-anchor="middle" font-size="10" style="fill:var(--muted)">${labels[i]}</text>`;
  });
  return s + `<line x1="${L}" x2="${W - 6}" y1="${y(goal)}" y2="${y(goal)}" style="stroke:var(--text)" stroke-width="1.2" stroke-dasharray="4 4" opacity=".6"/></svg>`;
}

function weightHistory(days) {
  const limit = addDays(new Date(), -days);
  return Object.entries(state.weights).map(([d, w]) => ({ d: parseIso(d), w })).filter((h) => h.d >= limit).sort((a, b) => a.d - b.d);
}

function weightChart(hist) {
  const W = 360, H = 130, L = 6, R = 6, T = 10, B = 10;
  const ws = hist.map((h) => h.w), lo = Math.min(...ws) - 0.4, hi = Math.max(...ws) + 0.4;
  const t0 = hist[0].d.getTime(), t1 = hist[hist.length - 1].d.getTime();
  const x = (d) => L + (t1 === t0 ? (W - L - R) / 2 : ((d.getTime() - t0) / (t1 - t0)) * (W - L - R)), y = (v) => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
  return `<svg class="chart" viewBox="0 0 ${W} ${H}"><polyline fill="none" style="stroke:var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${hist.map((h) => `${x(h.d)},${y(h.w)}`).join(" ")}"/>
    ${hist.map((h) => `<circle cx="${x(h.d)}" cy="${y(h.w)}" r="3.5" style="fill:var(--accent)"/>`).join("")}</svg>`;
}

function renderProgress() {
  const n = ui.span === "week" ? 7 : 30, end = new Date();
  const days = Array.from({ length: n }, (_, i) => addDays(end, i - (n - 1)));
  const vals = days.map((d) => totals(dayEntries(isoDate(d))).k);
  const labels = days.map((d, i) => (n === 7 ? WDS[d.getDay()] : i % 5 === 0 || i === n - 1 ? d.getDate() : ""));
  const logged = vals.filter((v) => v > 0), avg = logged.reduce((a, b) => a + b, 0) / (logged.length || 1);
  const goal = state.goals.kcal;
  const inGoal = vals.filter((v) => v >= goal * 0.9 && v <= goal * 1.1).length;
  const proteinDays = days.map((d) => totals(dayEntries(isoDate(d)))).filter((t) => t.k > 0);
  const avgP = proteinDays.reduce((a, t) => a + t.p, 0) / (proteinDays.length || 1);
  const hist = weightHistory(30);
  const change = hist.length > 1 ? hist[hist.length - 1].w - hist[0].w : null;
  const noData = !logged.length;

  view().innerHTML = `<div class="seg"><button data-span="week" class="${ui.span === "week" ? "on" : ""}">Týždeň</button><button data-span="month" class="${ui.span === "month" ? "on" : ""}">Mesiac</button></div>
    <div class="card">${noData ? `<div class="cnt">Zatiaľ tu nie sú žiadne záznamy. Pridaj jedlo a uvidíš graf.</div>` : barChart(vals, labels, goal)}
      <div class="legend"><span><i style="background:var(--warn)"></i>pod cieľom</span><span><i style="background:var(--ok)"></i>v cieli</span><span><i style="background:var(--bad)"></i>nad cieľom</span></div></div>
    <div class="stats">
      <div class="stat"><div class="l">Priemer / deň</div><div class="v">${noData ? "–" : fmt(avg)} <small>kcal</small></div></div>
      <div class="stat"><div class="l">Dní v cieli</div><div class="v">${inGoal} <small>z ${n}</small></div></div>
      <div class="stat"><div class="l">Bielkoviny / deň</div><div class="v">${proteinDays.length ? fmt(avgP) : "–"} <small>g</small></div></div>
      <div class="stat"><div class="l">Zmena váhy</div><div class="v">${change === null ? "–" : (change > 0 ? "+" : "") + fmt1(change)} <small>kg</small></div></div></div>
    <h2><span>Váha</span><span style="text-transform:none;letter-spacing:0">${hist.length ? fmt1(hist[hist.length - 1].w) + " kg" : ""}</span></h2>
    <div class="card">${hist.length > 1 ? weightChart(hist) : `<div class="cnt">${hist.length ? "Zapíš váhu aj o pár dní, graf sa zobrazí od dvoch záznamov." : "Zatiaľ nemáš zapísanú váhu."}</div>`}
      <button class="btn sec" style="margin-top:10px" data-act="weight">Zapísať váhu</button></div>`;
}

/* ===================== PANELY ===================== */

let sheetTimer;
function openSheet(html) {
  clearTimeout(sheetTimer);
  $("#sheetbody").innerHTML = html;
  const w = $("#sheetwrap"); w.classList.add("vis");
  requestAnimationFrame(() => requestAnimationFrame(() => w.classList.add("open")));
}
function closeSheet() {
  const w = $("#sheetwrap"); w.classList.remove("open");
  sheetTimer = setTimeout(() => { w.classList.remove("vis"); $("#sheetbody").innerHTML = ""; }, 300);
}
let toastTimer;
function toast(msg, undo) {
  const t = $("#toast");
  t.innerHTML = `<span>${esc(msg)}</span>${undo ? '<button data-act="undo">Späť</button>' : ""}`;
  t.classList.add("show"); toast.undo = undo;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 4200);
}

function openAdd() {
  const recent = state.recent.slice(0, 8);
  recent.forEach((f) => ui.pool.set(f.id, f));
  openSheet(`<h3>Pridať jedlo</h3><span class="tag">Zaradí sa samo podľa času</span>
    <button class="aicard" data-act="ai-snap" style="margin-top:6px">${ICON.cam}<div><b>Odfotiť jedlo</b><span>AI vyhodnotí porciu, zloženie a kalórie</span></div></button>
    ${recent.length ? `<h4>Nedávne · jedno ťuknutie</h4><div class="recent">${recent.map((f) => `<button class="rcard" data-quick="${esc(f.id)}"><b>${esc(f.n)}</b><span>${esc(f.por[0][0])} · ${fmt(f.k * f.por[0][1] / 100)} kcal</span></button>`).join("")}</div>` : ""}
    <h4>Iné možnosti</h4>
    <div class="tiles">
      <button class="tile" data-act="ai-describe">${ICON.pen}Opísať textom<small>AI z opisu</small></button>
      <button class="tile" data-act="t-search">${ICON.search.replace(/width="20" height="20"/, 'width="26" height="26"')}Hľadať<small>v tabuľkách</small></button>
      <button class="tile" data-act="t-bar">${ICON.bar}Čiarový kód<small>naskenuj obal</small></button>
      <button class="tile" data-act="t-own">${ICON.pen}Vlastné<small>zadaj ručne</small></button>
      <button class="tile" data-act="t-favs">${ICON.star}Obľúbené<small>tvoje uložené</small></button>
      <button class="tile" data-act="t-activity">${ICON.run}Aktivita<small>spálené kalórie</small></button>
    </div>`);
}

function openFood(food) {
  ui.pool.set(food.id, food);
  const s = { mode: 0, qty: 1, grams: 100 };
  const grams = () => (s.mode === "g" ? s.grams : food.por[s.mode][1] * s.qty);
  const chipsHtml = () => food.por.map((p, i) => `<button class="chip ${s.mode === i ? "on" : ""}" data-p="${i}">${esc(p[0])} (${p[1]} g)</button>`).join("") + `<button class="chip ${s.mode === "g" ? "on" : ""}" data-p="g">Gramy</button>`;
  const favBtn = () => `<button class="chip" data-fav="${esc(food.id)}" style="float:right;${isFav(food.id) ? "background:var(--warn);color:#1b1b1b" : ""}">${isFav(food.id) ? "★ Obľúbené" : "☆ Obľúbené"}</button>`;
  const upd = () => {
    const g = grams(), k = g / 100, rem = state.goals.kcal + dayBurned(ui.date) - totals(dayEntries(ui.date)).k - food.k * k;
    $("#amt").innerHTML = s.mode === "g" ? `<input id="gin" inputmode="decimal" value="${fmt(s.grams)}"><small>gramov</small>` : `${s.qty}× ${esc(food.por[s.mode][0])}<small>= ${fmt(g)} g</small>`;
    $("#calc").innerHTML = `<div class="big">${fmt(food.k * k)} <small>kcal</small></div>
      <div class="macros"><span><b style="color:var(--mp)">B</b> ${fmt1(food.p * k)} g</span><span><b style="color:var(--mc)">S</b> ${fmt1(food.c * k)} g</span><span><b style="color:var(--mf)">T</b> ${fmt1(food.f * k)} g</span></div>
      <div class="after">${rem >= 0 ? `Po pridaní zostane <b>${fmt(rem)} kcal</b>` : `<span style="color:var(--bad)">Po pridaní budeš <b>${fmt(-rem)} kcal</b> nad cieľom</span>`}</div>`;
  };
  openFood.ctx = { food, s, grams, upd, chipsHtml, favBtn };
  openSheet(`<h3>${esc(food.n)}${food.est ? '<span class="est">odhad</span>' : ""}</h3><span class="tag">${esc(srcLabel(food))}</span>${favBtn()}
    <div class="chips" id="pchips">${chipsHtml()}</div>
    <div class="stepper"><button data-step="-1" aria-label="Menej">−</button><div id="amt"></div><button data-step="1" aria-label="Viac">+</button></div>
    <div id="calc"></div>
    <button class="btn" data-confirm="1">Pridať</button>
    ${state.custom.some((f) => f.id === food.id) ? `<button class="btn dng" data-del-food="${esc(food.id)}">Odstrániť z mojich potravín</button>` : ""}`);
  upd();
}

function openEdit(id) {
  const e = state.meals.find((x) => x.id === id);
  if (!e) return;
  const upd = () => { $("#eg").value = fmt(e.g); $("#ek").innerHTML = `${fmt(nutr(e).k)} <small>kcal</small>`; };
  openSheet(`<h3>${esc(e.name)}${e.est ? '<span class="est">odhad</span>' : ""}</h3>
    <div class="stepper"><button data-estep="-10" aria-label="Menej">−</button><div><input id="eg" inputmode="decimal"><small>gramov</small></div><button data-estep="10" aria-label="Viac">+</button></div>
    <div class="big" id="ek" style="margin-bottom:10px"></div>
    <label class="field">Čas<input id="e-time" type="time" value="${esc(e.t || "12:00")}"></label>
    <button class="btn" data-act="e-save">Hotovo</button>
    <label class="field" style="margin-top:12px">Skopírovať na deň<input id="e-date" type="date" value="${ui.date}" max="${todayIso()}"></label>
    <button class="btn sec" data-act="e-copy">Skopírovať</button>
    <button class="btn dng" data-act="e-del">Zmazať</button>`);
  upd();
  openEdit.ctx = { e, upd };
  $("#eg").oninput = (ev) => { const v = num(ev.target.value); e.g = v > 0 ? v : 1; $("#ek").innerHTML = `${fmt(nutr(e).k)} <small>kcal</small>`; };
}

function openOwn() {
  openSheet(`<h3>Vlastné jedlo</h3><span class="tag">Hodnoty na 100 g</span>
    <label class="field">Názov<input id="o-n" placeholder="Napr. Domáca omáčka"></label>
    <div class="grid4"><label class="field">kcal<input id="o-k" inputmode="decimal"></label><label class="field">Bielk.<input id="o-p" inputmode="decimal"></label>
      <label class="field">Sach.<input id="o-c" inputmode="decimal"></label><label class="field">Tuky<input id="o-f" inputmode="decimal"></label></div>
    <div class="grid3"><label class="field">Vláknina<input id="o-fib" inputmode="decimal" placeholder="0"></label><label class="field">Cukry<input id="o-sug" inputmode="decimal" placeholder="0"></label>
      <label class="field">Soľ<input id="o-salt" inputmode="decimal" placeholder="0"></label></div>
    <label class="field">Bežná porcia (g)<input id="o-por" inputmode="decimal" placeholder="100"></label>
    <button class="btn" data-act="own-save">Uložiť a pokračovať</button>`);
}

function openActivity(id) {
  const a = id ? state.acts.find((x) => x.id === id) : null;
  openActivity.id = id || null;
  openSheet(`<h3>${a ? "Upraviť aktivitu" : "Aktivita"}</h3><span class="tag">Spálené kalórie sa pripočítajú k dennému cieľu</span>
    <label class="field">Názov<input id="a-name" placeholder="Napr. Bicykel" value="${a ? esc(a.name) : ""}"></label>
    <label class="field">Spálené kcal<input id="a-cal" inputmode="decimal" value="${a ? fmt(a.cal) : ""}"></label>
    <button class="btn" data-act="act-save">Uložiť</button>${a ? '<button class="btn dng" data-act="act-del">Zmazať</button>' : ""}`);
}

function openWeight() {
  const hist = weightHistory(365);
  const last = hist.length ? hist[hist.length - 1].w : state.profile.weight_kg;
  openSheet(`<h3>Zapísať váhu</h3><label class="field">${ui.date === todayIso() ? "Dnes" : fmtDate(parseIso(ui.date))} (kg)<input id="wv" inputmode="decimal" value="${fmt1(last)}"></label>
    <button class="btn" data-act="w-save">Uložiť</button>`);
}

/* ----- AI ----- */

const aiTotals = () => ui.ai.items.reduce((t, it) => { const k = it.grams / 100; t.k += it.k * k; t.p += it.p * k; t.c += it.c * k; t.f += it.f * k; t.g += it.grams; return t; }, { k: 0, p: 0, c: 0, f: 0, g: 0 });
const aiMacrosHtml = (t) => `<span><b style="color:var(--mp)">B</b> ${fmt1(t.p)} g</span><span><b style="color:var(--mc)">S</b> ${fmt1(t.c)} g</span><span><b style="color:var(--mf)">T</b> ${fmt1(t.f)} g</span><span>${fmt(t.g)} g spolu</span>`;
const aiRowText = (it) => { const k = it.grams / 100; return `${fmt(it.k * k)} kcal · B ${fmt1(it.p * k)} · S ${fmt1(it.c * k)} · T ${fmt1(it.f * k)}`; };

function aiRowsHtml() {
  const a = ui.ai;
  if (!a.items.length) return "";
  const t = aiTotals();
  return `<div class="aitotal"><div class="note" style="margin:0">${esc(a.dish || "Rozpoznané jedlo")} · odhad AI</div>
      <div class="big" id="ai-total">${fmt(t.k)} <small>kcal</small></div><div class="macros" id="ai-macros" style="margin:0">${aiMacrosHtml(t)}</div></div>
    <div class="scale"><button data-ai-scale="0.75">−25 % porcia</button><button data-ai-scale="1.25">+25 % porcia</button></div>`
    + a.items.map((it, i) => {
      const conf = it.conf === null || it.conf === undefined ? "" : `<span class="conf ${it.conf < 50 ? "low" : ""}">istota ${it.conf} %</span>`;
      return `<div class="airow"><div class="i"><b>${esc(it.n)}</b><span id="ak${i}">${aiRowText(it)}</span>${conf}</div><input data-ai="${i}" inputmode="decimal" value="${fmt(it.grams)}" aria-label="gramy"><span class="note" style="margin:0">g</span></div>`; }).join("")
    + `<div class="note" style="margin:0 0 12px">Hodnoty od AI sú len odhad. Skontroluj gramy, uprav porciu tlačidlami alebo doplň opis (napr. „veľká porcia“) a analyzuj znova.</div>
       <button class="btn" data-act="ai-all">Pridať do denníka</button>`;
}

function openAi() {
  const a = ui.ai, hasKey = !!state.ai.key;
  openSheet(`<h3>AI rozpoznanie</h3><span class="tag">Gemini</span>
    ${hasKey ? "" : `<div class="banner"><span>Najprv zadaj API kľúč v Nastaveniach.</span><button class="btn" data-act="goto-ai">Nastaviť</button></div>`}
    ${a.preview ? `<img class="prev" src="${a.preview}" alt="Náhľad fotky">` : ""}
    <div id="ai-status">${statusHtml(a.status)}${a.busy ? '<div class="spin"></div>' : ""}</div><div id="ai-results">${aiRowsHtml()}</div>
    <div class="row" style="margin:10px 0"><button class="btn sec" data-act="ai-snap">${a.preview ? "Odfotiť znova" : "Odfotiť"}</button><button class="btn sec" data-act="ai-gallery">Z galérie</button></div>
    <label class="field">${a.preview ? "Doplnenie (nepovinné, napr. „veľká porcia“)" : "Alebo opíš jedlo textom"}<textarea id="ai-text" placeholder="Napr. 2 rožky so šunkou a káva s mliekom">${esc(a.text)}</textarea></label>
    <button class="btn sec" data-act="ai-run" ${a.busy ? "disabled" : ""}>${a.items.length ? "Analyzovať znova" : "Rozpoznať"}</button>`);
}

// Po výbere fotky sa analýza spustí sama, netreba ďalšie ťuknutie
async function startAiWithFile(file) {
  const a = ui.ai;
  try { a.preview = await fileToDataUrl(file, 480, 0.7); } catch (e) { toast(e.message); return; }
  a.file = file; a.items = []; a.dish = ""; a.status = null; a.text = "";
  openAi();
  if (state.ai.key) runAi();
}

function startAiText() {
  Object.assign(ui.ai, { file: null, preview: null, items: [], dish: "", status: null, text: "" });
  openAi();
  setTimeout(() => $("#ai-text") && $("#ai-text").focus(), 400);
}

function refreshAi() {
  const st = $("#ai-status"), res = $("#ai-results");
  if (st) st.innerHTML = statusHtml(ui.ai.status) + (ui.ai.busy ? '<div class="spin"></div>' : "");
  if (res) res.innerHTML = aiRowsHtml();
  const b = $('[data-act="ai-run"]'); if (b) { b.disabled = ui.ai.busy; b.textContent = ui.ai.items.length ? "Analyzovať znova" : "Rozpoznať"; }
}

function refreshAiTotals() {
  const t = aiTotals(), tot = $("#ai-total"), mac = $("#ai-macros");
  if (tot) tot.innerHTML = `${fmt(t.k)} <small>kcal</small>`;
  if (mac) mac.innerHTML = aiMacrosHtml(t);
  ui.ai.items.forEach((it, i) => { const el = $("#ak" + i); if (el) el.textContent = aiRowText(it); const inp = $(`[data-ai="${i}"]`); if (inp && document.activeElement !== inp) inp.value = fmt(it.grams); });
}

async function runAi() {
  const a = ui.ai;
  if (a.busy) return;
  a.text = ($("#ai-text")?.value || "").trim();
  if (!a.file && !a.text) { toast("Odfoť jedlo alebo napíš opis"); return; }
  a.busy = true; a.items = []; a.dish = ""; a.status = { cls: "warn", text: "AI vyhodnocuje porciu, zloženie a kalórie…" }; refreshAi();
  let payload = { text: a.text };
  if (a.file) {
    const size = IMAGE_SIZES[state.ai.imageSize] ? state.ai.imageSize : "1024";
    try { payload = { text: a.text, imageDataUrl: await fileToDataUrl(a.file, Number(size), IMAGE_SIZES[size][1]) }; }
    catch (e) { a.busy = false; a.status = { cls: "err", text: e.message }; refreshAi(); return; }
  }
  const { items, dish, error } = await aiAnalyze(payload);
  a.busy = false; a.items = items; a.dish = dish || "";
  a.status = error ? { cls: "err", text: error } : null;
  refreshAi();
}

/* ----- ČIAROVÝ KÓD ----- */

async function onBarcode(code) {
  ui.tab = "foods"; ui.q = ""; render();
  toast(`Hľadám produkt ${code}…`);
  const { food, error } = await lookupBarcode(code);
  if (error) { toast(error); return; }
  openFood(food);
}

/* ===================== NASTAVENIA ===================== */

const optionList = (map, cur) => Object.entries(map).map(([k, v]) => `<option value="${k}" ${k === cur ? "selected" : ""}>${esc(Array.isArray(v) ? v[0] : v)}</option>`).join("");

function renderSettings() {
  const p = state.profile, ai = state.ai, g = state.goals;
  const bk = state.lastBackup ? `Posledná záloha: pred ${daysSince(state.lastBackup)} dňami (${fmtDate(new Date(state.lastBackup))}).` : "Zálohu si ešte nerobil.";
  view().innerHTML = `
  <div class="panel" id="sec-profile"><h3>Profil a odporúčaný príjem</h3>
    <div id="profile-form">
      <div class="grid2"><label class="field">Pohlavie<select id="p-sex">${optionList(SEX_LABELS, p.sex)}</select></label>
        <label class="field">Vek<input id="p-age" inputmode="decimal" value="${esc(p.age)}"></label>
        <label class="field">Výška (cm)<input id="p-height" inputmode="decimal" value="${esc(p.height_cm)}"></label>
        <label class="field">Váha (kg)<input id="p-weight" inputmode="decimal" value="${esc(p.weight_kg)}"></label></div>
      <label class="field">Druh práce<select id="p-work">${optionList(WORK_TYPES, p.work)}</select></label>
      <label class="field">Šport<select id="p-sport">${optionList(SPORT_LEVELS, p.sport)}</select></label>
      <label class="field">Cieľ<select id="p-goal">${optionList(GOAL_TYPES, p.goal)}</select></label>
      <div id="profile-result"></div>
      <button class="btn" data-act="profile-apply">Použiť ako denný cieľ</button>
      <button class="btn sec" data-act="profile-save">Uložiť len profil</button>
      <div id="profile-status"></div>
    </div></div>

  <div class="panel"><h3>Denné ciele (ručne)</h3>
    <div class="grid2"><label class="field">Kalórie (kcal)<input id="g-kcal" inputmode="decimal" value="${g.kcal}"></label>
      <label class="field">Bielkoviny (g)<input id="g-p" inputmode="decimal" value="${g.p}"></label>
      <label class="field">Sacharidy (g)<input id="g-c" inputmode="decimal" value="${g.c}"></label>
      <label class="field">Tuky (g)<input id="g-f" inputmode="decimal" value="${g.f}"></label></div>
    <button class="btn" data-act="goals-save">Uložiť ciele</button></div>

  <div class="panel" id="sec-ai"><h3>AI rozpoznávanie (Gemini)</h3>
    <label class="field">API kľúč<input id="ai-key" type="password" value="${esc(ai.key)}" autocapitalize="off" autocorrect="off" autocomplete="off" placeholder="Vlož kľúč z Google AI Studio"></label>
    <label class="field">Model (musí podporovať obrázky)<input id="ai-model" value="${esc(ai.model)}" autocapitalize="off" autocorrect="off"></label>
    <label class="field">Kvalita fotky pre AI<select id="ai-size">${optionList(IMAGE_SIZES, IMAGE_SIZES[ai.imageSize] ? ai.imageSize : "1024")}</select></label>
    <details class="help"><summary>Ako získať bezplatný kľúč</summary><ol>
      <li>Otvor <code>aistudio.google.com/apikey</code> a prihlás sa účtom Google.</li><li>Vytvor nový API kľúč a skopíruj ho.</li><li>Vlož ho sem a ťukni na „Otestovať AI“.</li></ol>
      Bezplatná úroveň má denné limity. Pri 429 chybe chvíľu počkaj. Fotka alebo text jedla sa odosiela spoločnosti Google, preto si pred použitím prečítaj podmienky nakladania s údajmi pre bezplatnú úroveň. Kľúč sa ukladá len v tomto telefóne.</details>
    <div class="row"><button class="btn" data-act="ai-save">Uložiť</button><button class="btn sec" data-act="ai-test">Otestovať AI</button></div>
    <div id="ai-test-status"></div></div>

  <div class="panel"><h3>Vzhľad</h3>
    <div class="seg">${[["dark", "Tmavá"], ["light", "Svetlá"], ["auto", "Podľa systému"]].map(([k, l]) => `<button data-th="${k}" class="${state.theme === k ? "on" : ""}">${l}</button>`).join("")}</div>
    <div class="seg" style="margin-bottom:0">${[["blue", "Modrá"], ["violet", "Fialová"], ["cyan", "Azúrová"]].map(([k, l]) => `<button data-setpal="${k}" class="${state.pal === k ? "on" : ""}">${l}</button>`).join("")}</div></div>

  <div class="panel" id="sec-backup"><h3>Záloha dát</h3>
    <div class="note" style="margin:0 0 8px">Dáta sú len v tomto telefóne. Odinštalovanie appky ich zmaže, preto si občas urob zálohu (ulož súbor do iCloud Drive alebo pošli sám sebe). Importovať môžeš aj zálohu zo starej appky Kalórie.</div>
    <div class="msg" id="last-backup">${bk}</div>
    <div class="row"><button class="btn sec" data-act="export">Exportovať</button><button class="btn sec" data-act="import">Importovať</button></div>
    <input id="import-file" type="file" accept="application/json,.json" hidden><div id="backup-status"></div></div>

  <div class="panel"><h3>O appke</h3>
    <div style="margin-bottom:8px">Verzia <b>${APP_VERSION}</b> · ${state.meals.length} záznamov v pamäti</div>
    <div class="note" style="margin:0 0 10px">Základné potraviny: USDA FoodData Central (verejná doména, CC0). Balené výrobky: Open Food Facts (ODbL, openfoodfacts.org). Slovenské jedlá sú orientačné odhady z receptúr. Hodnoty sú len informatívne a nenahrádzajú rady lekára alebo výživového poradcu.</div>
    <button class="btn sec" data-act="check-update">Skontrolovať aktualizáciu</button><div id="update-status"></div></div>`;
  updateProfileResult();
}

function readProfileForm() {
  const p = { sex: $("#p-sex").value, height_cm: num($("#p-height").value), weight_kg: num($("#p-weight").value), age: num($("#p-age").value),
    work: $("#p-work").value, sport: $("#p-sport").value, goal: $("#p-goal").value };
  return profileIsValid(p) ? p : null;
}

function updateProfileResult() {
  const box = $("#profile-result"); if (!box) return;
  const p = readProfileForm();
  if (!p) { box.innerHTML = `<div class="msg warn">Zadaj platné hodnoty: výška 100–250 cm, váha 30–300 kg, vek 10–100 rokov.</div>`; return; }
  const r = calcIntake(p);
  box.innerHTML = `<div class="result"><div>BMI ${r.bmi.toFixed(1)} (${r.bmiText}) · ideálna váha ${fmt(r.ideal[0])}–${fmt(r.ideal[1])} kg</div>
    <div class="note" style="margin:4px 0 8px">BMR ${fmt(r.bmr)} + práca ${fmt(r.workKcal)} + šport ${fmt(r.sportKcal)} = výdaj ${fmt(r.tdee)} kcal</div>
    <div class="note" style="margin:0">Odporúčaný denný príjem</div><div class="big">${fmt(r.calories)} <small>kcal</small></div>
    <div>B ${fmt(r.protein)} g · S ${fmt(r.carbs)} g · T ${fmt(r.fat)} g</div><div class="note">${esc(r.goalText)}</div></div>`;
}

function readAiForm() {
  return { key: $("#ai-key").value.trim(), model: $("#ai-model").value.trim() || DEFAULT_AI_MODEL, imageSize: $("#ai-size").value };
}

/* ===================== ZÁLOHA ===================== */

function markBackup() {
  state.lastBackup = new Date().toISOString(); save();
  const el = $("#last-backup"); if (el) el.textContent = `Posledná záloha: dnes (${fmtDate(new Date())}).`;
}

async function exportData() {
  const copy = { ...state, ai: { ...state.ai, key: "" } };  // API kľúč sa do zálohy neukladá
  const name = `tabulky-zaloha-${todayIso()}.json`;
  const file = new File([JSON.stringify(copy, null, 2)], name, { type: "application/json" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); markBackup(); return; } catch (e) { if (e.name === "AbortError") return; }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(file); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  markBackup();
}

async function importData(file) {
  const st = $("#backup-status");
  try {
    const raw = JSON.parse(await file.text());
    if (!raw || typeof raw !== "object" || !Array.isArray(raw.meals)) throw new Error("format");
    const legacy = raw.meals.length > 0 && raw.meals[0].grams !== undefined && raw.meals[0].cal !== undefined && !raw.meals[0].per;
    const counts = `${raw.meals.length} záznamov jedál, ${(raw.acts || []).length} aktivít, ${Object.keys(raw.weights || {}).length} váh`;
    if (!confirm(`Súbor obsahuje: ${counts}${legacy ? " (záloha zo starej appky Kalórie)" : ""}.\n\nImportom sa prepíšu všetky dáta v tejto appke. Pokračovať?`)) return;
    const keep = { ai: state.ai, theme: state.theme, pal: state.pal };
    if (legacy) {
      state = convertLegacy(raw);
      state.ai = keep.ai; state.theme = keep.theme; state.pal = keep.pal;
    } else {
      state = normalizeState(raw);
      if (!state.ai.key) state.ai.key = keep.ai.key;  // záloha neobsahuje API kľúč
    }
    save(); applyTheme();
    st.innerHTML = statusHtml({ cls: "ok", text: `Importované: ${counts}.` });
  } catch (_) {
    st.innerHTML = statusHtml({ cls: "err", text: "Súbor sa nepodarilo načítať (očakáva sa záloha z tejto alebo zo starej appky Kalórie)." });
  }
}

async function checkUpdate() {
  const st = $("#update-status");
  st.innerHTML = statusHtml({ cls: "warn", text: "Kontrolujem…" });
  try {
    const res = await fetch(`lib.js?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error("http");
    const m = (await res.text()).match(/APP_VERSION = "([^"]+)"/);
    if (!m) throw new Error("parse");
    if (m[1] === APP_VERSION) { st.innerHTML = statusHtml({ cls: "ok", text: `Máš najnovšiu verziu (${APP_VERSION}).` }); return; }
    st.innerHTML = statusHtml({ cls: "ok", text: `Nová verzia ${m[1]}, načítavam…` });
    if ("serviceWorker" in navigator) for (const reg of await navigator.serviceWorker.getRegistrations()) await reg.update();
    setTimeout(() => location.reload(), 600);
  } catch (_) {
    st.innerHTML = statusHtml({ cls: "err", text: "Aktualizáciu sa nepodarilo skontrolovať (si offline?)." });
  }
}

/* ===================== TÉMA ===================== */

const lightMq = window.matchMedia ? matchMedia("(prefers-color-scheme: light)") : null;
function applyTheme() {
  const pref = ["dark", "light"].includes(state.theme) ? state.theme : "auto";
  const light = pref === "light" || (pref === "auto" && !!lightMq && lightMq.matches);
  document.documentElement.dataset.theme = light ? "light" : "dark";
  document.documentElement.dataset.pal = state.pal || "blue";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = light ? "#f3f5f8" : "#0e1013";
  try { localStorage.setItem("theme", pref); localStorage.setItem("pal", state.pal || "blue"); } catch (_) { /* súkromný režim */ }
}
if (lightMq && lightMq.addEventListener) lightMq.addEventListener("change", applyTheme);

/* ===================== UDALOSTI ===================== */

function setDate(iso) {
  if (!iso) return;
  ui.date = iso;
  const end = parseIso(ui.anchor), start = addDays(end, -6);
  const d = parseIso(iso);
  if (d < start || d > end) ui.anchor = iso;
  render();
}

function goSettings(sectionId) {
  if (ui.tab !== "settings") ui.prevTab = ui.tab;
  ui.tab = "settings"; render();
  const el = sectionId && $("#" + sectionId);
  if (el) el.scrollIntoView({ block: "start" }); else view().scrollTop = 0;
}

document.addEventListener("click", (ev) => {
  const t = ev.target, d = (sel) => t.closest(sel);
  let el;
  if ((el = d("[data-tab]"))) { ui.tab = el.dataset.tab; render(); view().scrollTop = 0; return; }
  if ((el = d("[data-day]"))) { setDate(el.dataset.day); return; }
  if ((el = d("[data-cat]"))) { ui.cat = el.dataset.cat; renderFoods(); return; }
  if ((el = d("[data-sort]"))) { ui.sort = el.dataset.sort; renderFoods(); return; }
  if ((el = d("[data-span]"))) { ui.span = el.dataset.span; render(); return; }
  if ((el = d("[data-food]"))) { const f = anyFood(el.dataset.food); if (f) openFood(f); return; }
  if ((el = d("[data-edit]"))) { openEdit(+el.dataset.edit); return; }
  if ((el = d("[data-act-edit]"))) { openActivity(+el.dataset.actEdit); return; }
  if ((el = d("[data-ai-scale]"))) {
    const f = +el.dataset.aiScale; ui.ai.items.forEach((it) => { it.grams = Math.max(1, Math.round(it.grams * f)); }); refreshAiTotals(); return;
  }
  if ((el = d("[data-quick]"))) {
    const f = anyFood(el.dataset.quick); if (!f) return;
    const e = addEntry(f, f.por[0][1], ui.date);
    closeSheet(); render(); toast(`Pridané: ${f.n}`, () => { removeEntry(e.id); render(); }); return;
  }
  if ((el = d("[data-p]"))) {
    const c = openFood.ctx; c.s.mode = el.dataset.p === "g" ? "g" : +el.dataset.p; c.s.qty = 1;
    $("#pchips").innerHTML = c.chipsHtml(); c.upd(); return;
  }
  if ((el = d("[data-step]"))) {
    const c = openFood.ctx, dir = +el.dataset.step;
    if (c.s.mode === "g") c.s.grams = Math.max(10, c.s.grams + dir * 10); else c.s.qty = Math.max(0.5, c.s.qty + dir * 0.5);
    c.upd(); return;
  }
  if ((el = d("[data-estep]"))) { const c = openEdit.ctx; c.e.g = Math.max(5, c.e.g + +el.dataset.estep); c.upd(); return; }
  if ((el = d("[data-fav]"))) {
    const c = openFood.ctx; toggleFav(c.food); el.outerHTML = c.favBtn(); return;
  }
  if ((el = d("[data-del-food]"))) {
    const id = el.dataset.delFood;
    state.custom = state.custom.filter((f) => f.id !== id); state.favs = state.favs.filter((x) => x !== id); save();
    closeSheet(); render(); toast("Potravina odstránená"); return;
  }
  if ((el = d("[data-confirm]"))) {
    const c = openFood.ctx, g = c.grams();
    if (!(g > 0)) { toast("Zadaj množstvo"); return; }
    // Potravina nájdená cez AI sa uloží, aby sa nabudúce našla aj ručným hľadaním
    if (c.food.src === "ai" && !getFood(c.food.id)) state.custom.push({ ...c.food });
    const e = addEntry(c.food, g, ui.date);
    closeSheet(); render(); toast(`Pridané: ${c.food.n} (${fmt(g)} g)`, () => { removeEntry(e.id); render(); }); return;
  }
  if ((el = d("[data-th]"))) { state.theme = el.dataset.th; save(); applyTheme(); renderSettings(); return; }
  if ((el = d("[data-setpal]"))) { state.pal = el.dataset.setpal; save(); applyTheme(); renderSettings(); return; }

  const act = (d("[data-act]") || {}).dataset?.act;
  if (!act) return;
  const A = {
    close: closeSheet, add: openAdd, weight: openWeight, scan: () => openScanner(onBarcode), "scan-close": closeScanner,
    settings: () => goSettings(), "settings-close": () => { ui.tab = ui.prevTab || "today"; render(); },
    "goto-profile": () => goSettings("sec-profile"), "goto-backup": () => goSettings("sec-backup"), "goto-ai": () => { closeSheet(); goSettings("sec-ai"); },
    more: () => { ui.more = !ui.more; render(); },
    "week-prev": () => { ui.anchor = isoDate(addDays(parseIso(ui.anchor), -7)); render(); },
    "week-next": () => { const n = isoDate(addDays(parseIso(ui.anchor), 7)); ui.anchor = n > todayIso() ? todayIso() : n; render(); },
    undo: () => { if (toast.undo) toast.undo(); $("#toast").classList.remove("show"); },
    "t-search": () => { closeSheet(); ui.tab = "foods"; ui.cat = "Všetko"; render(); setTimeout(() => $("#q") && $("#q").focus(), 350); },
    "t-favs": () => { closeSheet(); ui.tab = "foods"; ui.cat = "Obľúbené"; ui.q = ""; render(); },
    "t-own": openOwn, "t-activity": () => openActivity(null),
    "ai-snap": () => { if (!state.ai.key) { openAi(); return; } $("#ai-cam").click(); },
    "ai-gallery": () => { if (!state.ai.key) { openAi(); return; } $("#ai-gal").click(); },
    "ai-describe": startAiText,
    "t-bar": () => { closeSheet(); setTimeout(() => openScanner(onBarcode), 320); },
    "off-search": async () => {
      const q = ui.q.trim(); if (!q || ui.off.busy) return;
      ui.off = { q, results: [], status: { cls: "warn", text: `Hľadám „${q}“ v Open Food Facts…` }, busy: true }; $("#offblock").innerHTML = offBlock();
      const { products, error, note } = await searchOpenFoodFacts(q);
      ui.off = { q, results: products, busy: false, status: error ? { cls: "err", text: error } : note ? { cls: "warn", text: note } : { cls: "ok", text: `Nájdené: ${products.length}` } };
      if (ui.tab === "foods" && ui.q.trim() === q) $("#offblock").innerHTML = offBlock();
    },
    "ai-food-search": async () => {
      const q = ui.q.trim(); if (!q || ui.aif.busy) return;
      if (!state.ai.key) { openAi(); return; }
      ui.aif = { q, results: [], status: { cls: "warn", text: `AI hľadá „${q}“…` }, busy: true }; $("#offblock").innerHTML = offBlock();
      const { products, error } = await aiSearchFoods(q);
      ui.aif = { q, results: products, busy: false, status: error ? { cls: "err", text: error } : { cls: "ok", text: `Návrhy od AI: ${products.length} (odhady, skontroluj hodnoty)` } };
      if (ui.tab === "foods" && ui.q.trim() === q) $("#offblock").innerHTML = offBlock();
    },
    "ai-run": runAi,
    "ai-all": () => {
      let n = 0;
      ui.ai.items.forEach((it) => { if (it.grams > 0) { addEntry(it, it.grams, ui.date); n++; } });
      Object.assign(ui.ai, { file: null, preview: null, items: [], dish: "", text: "", status: null });
      closeSheet(); render(); toast(`Pridané položky: ${n}`);
    },
    "e-save": () => {
      const t = $("#e-time").value; if (/^\d{2}:\d{2}$/.test(t)) { openEdit.ctx.e.t = t; openEdit.ctx.e.meal = mealForTime(t); }
      save(); closeSheet(); render();
    },
    "e-copy": () => {
      const date = $("#e-date").value; if (!date) { toast("Vyber dátum"); return; }
      const e = openEdit.ctx.e; state.meals.push({ ...e, id: newId(), date }); save();
      closeSheet(); render(); toast(`Skopírované na ${fmtDate(parseIso(date))}`);
    },
    "e-del": () => { const e = openEdit.ctx.e; removeEntry(e.id); closeSheet(); render(); toast("Zmazané", () => { state.meals.push(e); save(); render(); }); },
    "own-save": () => {
      const name = $("#o-n").value.trim(), k = num($("#o-k").value), v = (id) => { const x = num($(id).value); return Number.isFinite(x) && x > 0 ? x : 0; };
      if (!name || !Number.isFinite(k) || k < 0) { toast("Vyplň názov a kcal na 100 g"); return; }
      const por = v("#o-por");
      const f = { id: "u" + newId(), n: name, cat: "Moje", k, p: v("#o-p"), c: v("#o-c"), f: v("#o-f"), fib: v("#o-fib"), sug: v("#o-sug"), salt: v("#o-salt"),
        por: por > 0 && por !== 100 ? [["1 porcia", por], ["100 g", 100]] : [["100 g", 100]], src: "custom", est: 0 };
      state.custom.push(f); save(); closeSheet(); setTimeout(() => openFood(f), 320);
    },
    "act-save": () => {
      const name = $("#a-name").value.trim() || "Aktivita", cal = num($("#a-cal").value);
      if (!(cal > 0)) { toast("Zadaj spálené kcal"); return; }
      if (openActivity.id) { const a = state.acts.find((x) => x.id === openActivity.id); if (a) { a.name = name; a.cal = cal; } }
      else state.acts.push({ id: newId(), date: ui.date, name, cal });
      save(); closeSheet(); render();
    },
    "act-del": () => { const id = openActivity.id; const a = state.acts.find((x) => x.id === id); state.acts = state.acts.filter((x) => x.id !== id); save(); closeSheet(); render(); toast("Zmazané", () => { state.acts.push(a); save(); render(); }); },
    "w-save": () => {
      const w = num($("#wv").value); if (!(w >= 30 && w <= 300)) { toast("Váha musí byť 30–300 kg"); return; }
      state.weights[ui.date] = w; save(); closeSheet(); render(); toast("Váha zapísaná");
    },
    "profile-save": () => {
      const p = readProfileForm(), st = $("#profile-status");
      if (!p) { st.innerHTML = statusHtml({ cls: "err", text: "Profil sa neuložil, skontroluj údaje." }); return; }
      state.profile = p; state.profileDone = true; state.weights[todayIso()] = p.weight_kg; save();
      st.innerHTML = statusHtml({ cls: "ok", text: "Profil uložený a váha zapísaná do histórie." });
    },
    "profile-apply": () => {
      const p = readProfileForm(), st = $("#profile-status");
      if (!p) { st.innerHTML = statusHtml({ cls: "err", text: "Najprv zadaj platné údaje." }); return; }
      const r = calcIntake(p);
      state.profile = p; state.profileDone = true; state.weights[todayIso()] = p.weight_kg;
      state.goals = { kcal: Math.round(r.calories), p: Math.round(r.protein), c: Math.round(r.carbs), f: Math.round(r.fat) }; save();
      $("#g-kcal").value = state.goals.kcal; $("#g-p").value = state.goals.p; $("#g-c").value = state.goals.c; $("#g-f").value = state.goals.f;
      st.innerHTML = statusHtml({ cls: "ok", text: `Denný cieľ: ${fmt(r.calories)} kcal · B ${fmt(r.protein)} g · S ${fmt(r.carbs)} g · T ${fmt(r.fat)} g` });
    },
    "goals-save": () => {
      const v = ["g-kcal", "g-p", "g-c", "g-f"].map((id) => num($("#" + id).value));
      if (v.some((n) => !Number.isFinite(n) || n <= 0)) { toast("Skontroluj hodnoty cieľov"); return; }
      state.goals = { kcal: v[0], p: v[1], c: v[2], f: v[3] }; save(); toast("Ciele uložené");
    },
    "ai-save": () => { state.ai = readAiForm(); save(); toast("AI nastavenia uložené"); },
    "ai-test": async () => {
      state.ai = readAiForm(); save();
      $("#ai-test-status").innerHTML = statusHtml({ cls: "warn", text: "Testujem spojenie…" });
      const r = await aiTest();
      const box = $("#ai-test-status"); if (box) box.innerHTML = statusHtml({ cls: r.ok ? "ok" : "err", text: r.text });
    },
    export: exportData, import: () => $("#import-file").click(), "check-update": checkUpdate,
  };
  if (A[act]) A[act]();
});

document.addEventListener("change", async (ev) => {
  const t = ev.target;
  if (t.id === "date-pick") setDate(t.value);
  else if ((t.id === "ai-cam" || t.id === "ai-gal") && t.files[0]) { const f = t.files[0]; t.value = ""; await startAiWithFile(f); }
  else if (t.id === "import-file" && t.files[0]) { await importData(t.files[0]); t.value = ""; }
});

document.addEventListener("input", (ev) => {
  const t = ev.target;
  if (t.id === "q") { ui.q = t.value; $("#flist").innerHTML = foodList(); $("#offblock").innerHTML = offBlock(); }
  else if (t.closest && t.closest("#profile-form")) updateProfileResult();
  else if (t.id === "gin") { const c = openFood.ctx; c.s.grams = Math.max(0, num(t.value) || 0); const k = c.s.grams / 100; $("#calc .big").innerHTML = `${fmt(c.food.k * k)} <small>kcal</small>`; }
  else if (t.dataset && t.dataset.ai !== undefined) {
    const i = +t.dataset.ai, g = Math.max(0, num(t.value) || 0), it = ui.ai.items[i];
    it.grams = g; refreshAiTotals();
  }
});

document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape") closeSheet();
  if (ev.key === "Enter" && ev.target.id === "q") {
    ev.preventDefault(); ev.target.blur();
    // Keď sa v tabuľkách nič nenašlo, Enter spustí hľadanie cez AI
    if (state.ai.key && ui.q.trim() && !$("#flist .frow")) { const b = $('[data-act="ai-food-search"]'); if (b) b.click(); }
  }
});

/* Pri písaní iOS zdvihne klávesnicu a spodná lišta by plávala nad ňou, preto ju skryjeme */
const isField = (el) => !!el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && el.type !== "file" && el.type !== "date";
document.addEventListener("focusin", (e) => { if (isField(e.target)) document.body.classList.add("kb"); });
document.addEventListener("focusout", () => setTimeout(() => { if (!isField(document.activeElement)) document.body.classList.remove("kb"); }, 80));

/* ===================== ŠTART ===================== */

let lastToday = todayIso();
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  const today = todayIso();
  if (today !== lastToday) { if (ui.date === lastToday) { ui.date = today; ui.anchor = today; } lastToday = today; render(); }
});

async function init() {
  try { state = normalizeState(await idbGet("state")); } catch (_) { state = defaultState(); }
  try { await loadFoods(); } catch (_) { view().innerHTML = `<div class="cnt">Databázu potravín sa nepodarilo načítať. Skús obnoviť stránku.</div>`; }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  applyTheme();
  render();
  window.__appStarted = true;
  if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
}
init();
