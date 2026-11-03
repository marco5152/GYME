"""Pomocné funkcie na čítanie USDA FoodData Central SR Legacy (CC0)."""
import csv
import io
import zipfile

PREFIX = "FoodData_Central_sr_legacy_food_csv_2018-04/"
NUTRIENTS = {"1008": "k", "1003": "p", "1004": "f", "1005": "c", "1079": "fib", "2000": "sug", "1093": "na"}


def load(zip_path):
    z = zipfile.ZipFile(zip_path)

    def rd(name):
        return csv.DictReader(io.TextIOWrapper(z.open(PREFIX + name), encoding="utf-8"))

    foods = {r["fdc_id"]: r["description"] for r in rd("food.csv")}
    nutr = {}
    for r in rd("food_nutrient.csv"):
        key = NUTRIENTS.get(r["nutrient_id"])
        if key and r["amount"] != "":
            nutr.setdefault(r["fdc_id"], {})[key] = float(r["amount"])
    return foods, nutr


def resolve(foods, query):
    """Vráti zoznam (fdc_id, popis) zhôd, najkratší popis prvý."""
    pos, neg = [], []
    for part in query.split(";"):
        part = part.strip().lower()
        (neg if part.startswith("!") else pos).append(part.lstrip("!").strip())
    hits = [(i, d) for i, d in foods.items()
            if all(p in d.lower() for p in pos) and not any(n in d.lower() for n in neg)]
    return sorted(hits, key=lambda x: (len(x[1]), x[1]))


def per100(nutr, fdc_id):
    n = nutr.get(fdc_id, {})
    salt = round(n.get("na", 0) * 2.5 / 1000, 2)  # soľ (g) = sodík (mg) × 2,5 / 1000
    return {
        "k": round(n.get("k", 0), 1), "p": round(n.get("p", 0), 1), "c": round(n.get("c", 0), 1),
        "f": round(n.get("f", 0), 1), "fib": round(n.get("fib", 0), 1), "sug": round(n.get("sug", 0), 1), "salt": salt,
    }
