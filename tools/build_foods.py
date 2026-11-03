"""Zostaví app/foods.json zo zoznamu curated.py (USDA SR Legacy, CC0) a recipes.py (odhady receptúr).

Spustenie:  python3 tools/build_foods.py
Vstup:      tools/data/sr.zip  (FoodData_Central_sr_legacy_food_csv_2018-04.zip z fdc.nal.usda.gov)
Výstup:     docs/foods.json
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from curated import CURATED  # noqa: E402
from recipes import RECIPES  # noqa: E402
from usda import load, per100, resolve  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
ZIP = os.path.join(HERE, "data", "sr.zip")
OUT = os.path.join(HERE, "..", "docs", "foods.json")
KEYS = ["k", "p", "c", "f", "fib", "sug", "salt"]


def main():
    foods, nutr = load(ZIP)
    items, by_id, problems = [], {}, []

    for cid, name, cat, query, portions in CURATED:
        hits = resolve(foods, query)
        if not hits:
            problems.append(f"Nenájdené: {cid} ({query})")
            continue
        fdc_id, desc = hits[0]
        v = per100(nutr, fdc_id)
        if v["k"] <= 0 and cid not in ("kava", "caj"):
            problems.append(f"Nulové kalórie: {cid} ({desc})")
        item = {"id": cid, "n": name, "cat": cat, **v, "por": [[l, g] for l, g in portions], "src": "usda", "ref": fdc_id}
        items.append(item)
        by_id[cid] = item

    for rid, name, cat, ingredients, water, portion_label in RECIPES:
        total = float(water)
        acc = {k: 0.0 for k in KEYS}
        for ing_id, grams in ingredients:
            if ing_id not in by_id:
                problems.append(f"Receptúra {rid}: chýba zložka {ing_id}")
                break
            total += grams
            for k in KEYS:
                acc[k] += by_id[ing_id][k] * grams / 100.0
        else:
            v = {k: round(acc[k] / total * 100.0, 1 if k != "salt" else 2) for k in KEYS}
            items.append({"id": rid, "n": name, "cat": cat, **v,
                          "por": [[portion_label, round(total)], ["100 g", 100]], "src": "recipe", "est": 1})

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"version": 1, "source": "USDA FoodData Central, SR Legacy (CC0 1.0)", "items": items}, f, ensure_ascii=False, separators=(",", ":"))
    print(f"Hotovo: {len(items)} potravín -> {os.path.abspath(OUT)} ({os.path.getsize(OUT) // 1024} KB)")
    for p in problems:
        print("POZOR:", p)


if __name__ == "__main__":
    main()
