"""Slovenské a bežné jedlá ako ODHAD z receptúry.

Zloženie sa počíta zo zložiek (hodnoty USDA z curated.py). Nie je to laboratórny rozbor:
skutočné jedlo sa líši receptom, množstvom tuku aj soli. V appke je preto označené ako odhad.

Záznam: (id, názov, kategória, [(id zložky, gramy), ...], gramy vody/absorbovanej tekutiny, popis porcie)
Gramy zložiek sú hmotnosť v hotovom jedle (jedna porcia). Voda (0 kcal) vyjadruje vodu viazanú pri varení.
"""

SK = "Slovenské jedlá (odhad)"
OTHER = "Hotové jedlá (odhad)"

RECIPES = [
    ("r-bryndzove-halusky", "Bryndzové halušky", SK,
     [("zemiaky-surove", 220), ("muka-psenicna", 80), ("feta", 70), ("slanina", 25)], 60, "1 porcia"),
    ("r-strapacky", "Strapačky s kyslou kapustou", SK,
     [("zemiaky-surove", 180), ("muka-psenicna", 70), ("kysla-kapusta", 100), ("slanina", 30)], 50, "1 porcia"),
    ("r-kapustnica", "Kapustnica", SK,
     [("kysla-kapusta", 120), ("klobasa", 40), ("zemiaky-surove", 40), ("olej-slnecnicovy", 5)], 150, "1 tanier"),
    ("r-rezen-bravcovy", "Bravčový rezeň vyprážaný", SK,
     [("bravcove-kare", 120), ("vajce", 20), ("muka-psenicna", 10), ("rozok", 20), ("olej-slnecnicovy", 15)], 0, "1 rezeň"),
    ("r-rezen-kuraci", "Kurací rezeň vyprážaný", SK,
     [("kuracie-prsia-surove", 120), ("vajce", 20), ("muka-psenicna", 10), ("rozok", 20), ("olej-slnecnicovy", 15)], 0, "1 rezeň"),
    ("r-vyprazany-syr", "Vyprážaný syr", SK,
     [("eidam", 100), ("vajce", 20), ("muka-psenicna", 10), ("rozok", 20), ("olej-slnecnicovy", 12)], 0, "1 ks"),
    ("r-gulas", "Hovädzí guláš", SK,
     [("hovadzie-zadne", 120), ("cibula", 80), ("olej-slnecnicovy", 10), ("pretlak", 15)], 120, "1 porcia"),
    ("r-segedin", "Segedínsky guláš", SK,
     [("bravcove-plece", 120), ("kysla-kapusta", 150), ("smotana-12", 30), ("cibula", 40), ("olej-slnecnicovy", 8)], 40, "1 porcia"),
    ("r-knedla", "Knedľa (varená)", SK,
     [("chlieb-biely", 60), ("muka-psenicna", 40), ("vajce", 15)], 80, "2 plátky"),
    ("r-zemiakove-placky", "Zemiakové placky", SK,
     [("zemiaky-surove", 150), ("vajce", 20), ("muka-psenicna", 20), ("cesnak", 3), ("olej-slnecnicovy", 20)], 0, "2 ks"),
    ("r-zemiakova-kasa", "Zemiaková kaša", SK,
     [("zemiaky-varene", 130), ("mlieko-polotucne", 20), ("maslo", 7)], 0, "1 porcia"),
    ("r-lecho", "Lečo s klobásou", SK,
     [("paprika-cervena", 150), ("paradajka", 100), ("cibula", 40), ("olej-slnecnicovy", 10), ("klobasa", 40)], 0, "1 porcia"),
    ("r-pirohy", "Pirohy s bryndzou (5 ks)", SK,
     [("muka-psenicna", 70), ("zemiaky-varene", 80), ("feta", 40), ("slanina", 15)], 60, "5 ks"),
    ("r-sulance-mak", "Šúľance s makom", SK,
     [("zemiaky-surove", 150), ("muka-psenicna", 50), ("mak", 25), ("cukor", 10), ("maslo", 10)], 40, "1 porcia"),
    ("r-palacinka-dzem", "Palacinka s lekvárom", SK,
     [("palacinka", 80), ("dzem", 20)], 0, "1 ks"),
    ("r-langos", "Langoš so syrom a smotanou", SK,
     [("muka-psenicna", 100), ("olej-slnecnicovy", 25), ("gouda", 40), ("smotana-kysla", 30), ("cesnak", 3)], 50, "1 ks"),
    ("r-ryzoto-kuracie", "Kuracie rizoto so zeleninou", OTHER,
     [("ryza-varena", 180), ("kuracie-prsia-pecene", 80), ("olej-slnecnicovy", 8), ("mrkva", 30), ("hrasok", 30)], 0, "1 porcia"),
    ("r-bolonske", "Špagety bolonské", OTHER,
     [("cestoviny-varene", 200), ("hovadzie-mlete", 80), ("pretlak", 30), ("cibula", 30), ("olej-slnecnicovy", 8)], 40, "1 porcia"),
    ("r-plnena-paprika", "Plnená paprika s paradajkovou omáčkou", SK,
     [("paprika-cervena", 120), ("bravcove-mlete", 100), ("ryza-surova", 25), ("pretlak", 30)], 150, "2 ks"),
    ("r-hotdog", "Hot dog (párok v rožku)", OTHER,
     [("rozok", 55), ("parky", 45), ("horcica", 5), ("ketchup", 10)], 0, "1 ks"),
    ("r-obloz-sunka-syr", "Obložený chlieb so šunkou a syrom", OTHER,
     [("chlieb-biely", 60), ("maslo", 8), ("sunka", 40), ("eidam", 25), ("paradajka", 30)], 0, "1 ks"),
    ("r-omeleta", "Omeleta (3 vajcia)", OTHER,
     [("vajce", 150), ("mlieko-polotucne", 30), ("maslo", 8)], 0, "1 porcia"),
    ("r-musli-jogurt", "Müsli s bielym jogurtom", OTHER,
     [("musli", 50), ("jogurt-biely", 150)], 0, "1 miska"),
    ("r-grecky-salat", "Grécky šalát", OTHER,
     [("paradajka", 100), ("uhorka", 80), ("paprika-zelena", 50), ("feta", 50), ("olivy", 20), ("olej-olivovy", 10)], 0, "1 porcia"),
]
