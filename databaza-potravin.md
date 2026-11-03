# Zdroje databázy potravín a licencie (overené 3. 11. 2026)

Stav overenia: **P** = potvrdené na oficiálnej stránke zdroja, **S** = len zo zhrnutia vyhľadávania (oficiálnu stránku sa nepodarilo otvoriť alebo sa nezobrazila).

| Zdroj | Obsah | Licencia | Overenie | Pre appku |
|---|---|---|---|---|
| **USDA FoodData Central** (fdc.nal.usda.gov) | Tisíce všeobecných potravín (surové, varené, základné suroviny), anglicky | Public domain, CC0 1.0. Povolenie netreba, žiada sa uviesť zdroj | **P** (stránka fdc.nal.usda.gov) | Hlavný kandidát na zabudovanú bázu bežných potravín. Treba preložiť názvy do slovenčiny a vybrať ~300 – 500 najčastejších |
| **Open Food Facts** | Balené výrobky s čiarovými kódmi, vrátane slovenských | Databáza ODbL, jednotlivé údaje DbCL, obrázky CC BY-SA. Povinné uvedenie zdroja (odkaz na openfoodfacts.org) a „share alike“ pre odvodené diela | **P** (world.openfoodfacts.org/terms-of-use) | Ďalej cez živé API (appka už tak funguje). Do appky nezabudovávať kópiu, aby sa nespustila povinnosť zdieľať odvodenú databázu |
| **Fineli** (Fínsko, THL) | ~4 000 potravín, názvy fínsky, švédsky, anglicky, CSV | CC BY 4.0, treba uviesť „Finnish Institute for Health and Welfare, Fineli“ | **S** (dve zhrnutia; stránka fineli.fi mi vrátila 403, avoindata.suomi.fi ju uvádza ako otvorené dáta bez textu licencie) | Voliteľný doplnok pre európske potraviny (pečivo, syry). Licenciu overiť pred použitím |
| **Potravinová banka dát (PBD)**, VÚP, pbd-online.sk | Slovenské zloženie potravín | Údaje sú na informatívne použitie, nie na komerčné využitie bez dohody. Kontakt na správcu: pbd.vup@nppc.sk | **S** (zhrnutie vyhľadávania; samotná stránka s podmienkami sa mi nezobrazila, vup.sk potvrdzuje, že PBD je jediné slovenské pracovisko tohto druhu) | Zabudovať nemožno bez povolenia. Možnosť: napísať správcovi, alebo údaje len ručne porovnať na kontrolu |
| **CoFID** (UK) | Britské zloženie potravín | Open Government Licence v3.0 | **S** | Záloha, nízka priorita |
| Frida (Švédsko) | Švédske zloženie potravín | Vlastné podmienky | **S** | Nepoužívať |

## Odporúčaný postup
1. **Zabudovaný základ:** vybrať z USDA FDC (CC0) bežné potraviny, slovenské názvy a porcie doplniť ručne alebo cez AI s kontrolou. Hodnoty potom priamo patria do appky bez licenčných povinností (uviesť zdroj v „O appke“).
2. **Balené produkty:** Open Food Facts živým API, s uvedením zdroja v appke. Appka už má tento tok v starej verzii.
3. **Chýbajúce a vlastné:** ručné zadanie a Gemini odhad (označený ako odhad).
4. **Slovenské hodnoty z PBD:** len ak správca povolí. Inak ich nepoužívať.
5. V appke a na obchodnej stránke jasné upozornenie, že hodnoty sú orientačné.

## Čo ešte treba
- Overiť text licencie Fineli na jeho stránke, ak sa rozhodneme ho použiť.
- Overiť limity a podmienky bezplatnej úrovne Gemini API (nesúvisí s databázou, ale s nákladmi).
- Rozhodnúť, ktorých ~300 potravín bude v základe (napr. podľa tvojich najčastejších jedál).
