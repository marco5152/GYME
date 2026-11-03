# GYME – Kalorické tabuľky

Appka na sledovanie kalórií pre iPhone (webová appka, PWA). Dáta ostávajú v telefóne, funguje aj offline.

## Čo je v priečinkoch
- `docs/` – hotová appka (z tohto priečinka ju servíruje GitHub Pages)
  - `index.html`, `style.css`, `lib.js` (výpočty, úložisko, databáza), `services.js` (Open Food Facts, Gemini, skener), `app.js` (rozhranie)
  - `foods.json` – zabudovaná databáza (232 potravín), `sw.js` + `manifest.webmanifest` + `icons/` – inštalácia a offline, `vendor/` – skener ZXing (Apache 2.0)
- `mockup/` – pôvodný klikateľný náhľad (len na pozeranie)
- `tools/` – skripty na zostavenie databázy (`build_foods.py`, zoznam `curated.py`, receptúry `recipes.py`). Zdrojové dáta USDA (`sr.zip`) sa do repozitára nenahrávajú, stiahni ich z fdc.nal.usda.gov (SR Legacy, CSV) do `tools/data/sr.zip`.
- `databaza-potravin.md` – zdroje dát a licencie

## Čo appka robí (hlavné)
- **AI z fotky (hlavná funkcia):** ťukneš na „Odfotiť jedlo“, po nafotení sa analýza spustí sama. Gemini odhadne porciu v gramoch, zloženie a kalórie, ukáže súčet, makrá a istotu pri každej položke. Porciu upravíš gramami alebo tlačidlami −25 % / +25 %, prípadne doplníš opis a analyzuješ znova. Funguje aj z galérie a z textového opisu.
- **Jedlá sa nerozdeľujú ručne:** raňajky, obed, desiata a večera sa určia samy podľa času pridania (čas sa dá upraviť pri úprave záznamu). Denník je chronologický zoznam.

## Nasadenie na iPhone (GitHub Pages)
1. Repozitár → Settings → Pages → Deploy from a branch → vetva `main`, priečinok `/docs` → Save.
2. Adresu `https://marco515.github.io/GYME/` otvor v **Safari** → Zdieľať → Pridať na plochu. Používaj appku cez ikonu na ploche.
3. V Nastaveniach doplň profil a (voliteľne) Gemini API kľúč z `aistudio.google.com/apikey`. Kľúč sa ukladá len v telefóne a do repozitára sa nikdy nedostane.

## Úprava databázy
Zoznam potravín je v `tools/curated.py` (slovenský názov, kategória, dotaz do USDA, porcie), slovenské jedlá v `tools/recipes.py`.
Po úprave spusti `python3 tools/build_foods.py`, vznikne nový `docs/foods.json`. Po nasadení zvýš `CACHE` v `docs/sw.js` a `APP_VERSION` v `docs/lib.js`.

## Čo je overené a čo nie
- Overené v prehliadači: pridávanie, úprava (aj čas), kópia, aktivita, vlastné jedlo, profil a cieľ, hľadanie bez diakritiky, Open Food Facts (živé), čiarový kód (hľadanie produktu), AI z fotky so simulovanou odpoveďou Gemini (automatická analýza, súčet, istota, škálovanie porcie), automatické zaradenie jedla podľa času a migrácia starších záznamov, import zo starej appky, offline režim, svetlá a tmavá téma.
- **Neoverené:** reálne volanie Gemini s tvojím kľúčom, skenovanie kamerou, inštalácia a správanie na skutočnom iPhone.
- Hodnoty slovenských jedál sú odhady z receptúr, nie laboratórne rozbory. Slovenská databáza PBD sa nepoužíva (podmienky len z druhej ruky).

## Čo ešte chýba oproti starej appke
- Import údajov z hodiniek (Apple Zdravie → Skratky), ak ho chceš, dá sa doplniť.
