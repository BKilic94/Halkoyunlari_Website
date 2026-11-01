"""Erzeugt data/map.js (Türkei-Karte als SVG-Pfade) aus Natural-Earth-Daten (gemeinfrei).

Aufruf im Ordner lexikon:  python tools/build_map.py <ordner-mit-natural-earth-geojson>
Benötigt: ne_10m_admin_1_states_provinces.geojson, ne_10m_admin_0_countries.geojson, ne_10m_lakes.geojson
"""
import json
import math
import os
import sys

SRC = sys.argv[1] if len(sys.argv) > 1 else "."
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "map.js")

LON0, LON1, LAT0, LAT1 = 24.4, 45.6, 34.45, 42.6
K = math.cos(math.radians(39))
W = 1000.0
S = W / ((LON1 - LON0) * K)
H = round((LAT1 - LAT0) * S)
CLIP = (LON0 - 0.6, LAT0 - 0.6, LON1 + 0.6, LAT1 + 0.6)
TOL = 0.32          # Vereinfachung in viewBox-Einheiten
MIN_ISLAND = 2.0    # kleinere Inseln (Fläche in viewBox-Einheiten²) entfallen

NAME_FIX = {"TR-34": "İstanbul", "TR-30": "Hakkari"}

NEIGHBORS = {  # adm0_a3 -> Beschriftung
    "GRC": None, "BGR": None, "GEO": None, "ARM": None, "AZE": None, "IRN": None,
    "IRQ": None, "SYR": None, "CYP": None, "CYN": None, "CNM": None, "ESB": None, "WSB": None,
    "LBN": None, "ROU": None, "RUS": None, "UKR": None, "MKD": None, "ISR": None, "JOR": None,
}
PLAIN = {"CYP", "CYN", "CNM", "ESB", "WSB"}  # ohne Binnengrenzen dargestellt


def load(name):
    with open(os.path.join(SRC, name), encoding="utf-8") as f:
        return json.load(f)["features"]


def polys(geom):
    if geom["type"] == "Polygon":
        return [geom["coordinates"]]
    if geom["type"] == "MultiPolygon":
        return geom["coordinates"]
    return []


def clip_ring(ring, box):
    x0, y0, x1, y1 = box
    pts = [tuple(p[:2]) for p in ring]
    if pts and pts[0] == pts[-1]:
        pts = pts[:-1]
    for edge in range(4):
        if not pts:
            break
        def inside(p):
            return (p[0] >= x0, p[1] >= y0, p[0] <= x1, p[1] <= y1)[edge]
        def cut(a, b):
            if edge in (0, 2):
                x = (x0, None, x1)[edge]
                t = (x - a[0]) / (b[0] - a[0])
                return (x, a[1] + t * (b[1] - a[1]))
            y = (None, y0, None, y1)[edge]
            t = (y - a[1]) / (b[1] - a[1])
            return (a[0] + t * (b[0] - a[0]), y)
        out = []
        for i, cur in enumerate(pts):
            prev = pts[i - 1]
            if inside(cur):
                if not inside(prev):
                    out.append(cut(prev, cur))
                out.append(cur)
            elif inside(prev):
                out.append(cut(prev, cur))
        pts = out
    return pts if len(pts) >= 3 else None


def proj(p):
    return ((p[0] - LON0) * K * S, (LAT1 - p[1]) * S)


def area(pts):
    a = 0.0
    for i in range(len(pts)):
        x1, y1 = pts[i - 1]
        x2, y2 = pts[i]
        a += x1 * y2 - x2 * y1
    return abs(a) / 2


def dp(pts, a, b, keep):
    stack = [(a, b)]
    while stack:
        i, j = stack.pop()
        if j <= i + 1:
            continue
        (ax, ay), (bx, by) = pts[i], pts[j]
        dx, dy = bx - ax, by - ay
        ln = math.hypot(dx, dy)
        best, idx = -1.0, -1
        for k in range(i + 1, j):
            px, py = pts[k]
            d = abs(dy * (px - ax) - dx * (py - ay)) / ln if ln else math.hypot(px - ax, py - ay)
            if d > best:
                best, idx = d, k
        if best > TOL:
            keep[idx] = True
            stack.append((i, idx))
            stack.append((idx, j))


# ---------- Merkmale sammeln ----------
features = []  # dict(id, kind, polys=[[ring(lonlat pts)]])

for f in load("ne_10m_admin_1_states_provinces.geojson"):
    p = f["properties"]
    if p.get("adm0_a3") != "TUR":
        continue
    iso = p["iso_3166_2"]
    rings = [[clip_ring(r, CLIP) for r in poly] for poly in polys(f["geometry"])]
    features.append({"id": iso, "kind": "prov", "name": NAME_FIX.get(iso, p["name_en"]),
                     "label": (p["longitude"], p["latitude"]), "polys": rings})

for f in load("ne_10m_admin_0_countries.geojson"):
    p = f["properties"]
    a3 = p.get("ADM0_A3") or p.get("adm0_a3")
    if a3 not in NEIGHBORS:
        continue
    rings = [[clip_ring(r, CLIP) for r in poly] for poly in polys(f["geometry"])]
    rings = [[r for r in poly if r] for poly in rings]
    rings = [poly for poly in rings if poly]
    if rings:
        features.append({"id": a3, "kind": "country", "polys": rings})

lakes = []
for f in load("ne_10m_lakes.geojson"):
    rings = [[clip_ring(r, (LON0, LAT0, LON1, LAT1)) for r in poly] for poly in polys(f["geometry"])]
    rings = [[r for r in poly if r] for poly in rings]
    rings = [poly for poly in rings if poly]
    if rings:
        lakes.append({"id": "lake", "kind": "lake", "name": f["properties"].get("name"), "polys": rings})

# ---------- Topologie: gemeinsame Kanten gleich vereinfachen ----------
owners = {}
for ft in features:
    for poly in ft["polys"]:
        for ring in poly:
            if not ring:
                continue
            for pt in ring:
                owners.setdefault(pt, set()).add(ft["id"])


def simplify_ring(ring, shared):
    n = len(ring)
    xy = [proj(p) for p in ring]
    keep = [False] * n
    if shared:
        own = [frozenset(owners.get(p, ())) for p in ring]
        for i in range(n):
            if len(own[i]) >= 3 or own[i] != own[i - 1] or own[i] != own[(i + 1) % n]:
                keep[i] = True
    if not any(keep):
        keep[0] = True
        far = max(range(n), key=lambda k: (xy[k][0] - xy[0][0]) ** 2 + (xy[k][1] - xy[0][1]) ** 2)
        keep[far] = True
    fixed = [i for i in range(n) if keep[i]]
    ext = xy + xy
    keep2 = keep + keep
    for a, b in zip(fixed, fixed[1:] + [fixed[0] + n]):
        dp(ext, a, b, keep2)
    out = [xy[i] for i in range(n) if keep2[i] or keep2[i + n]]
    return out


def is_island(ring):
    return all(len(owners.get(p, ())) <= 1 for p in ring)


def process(ft, shared):
    res = []
    for poly in ft["polys"]:
        for ring in poly:
            if not ring:
                continue
            pts = simplify_ring(ring, shared)
            if len(pts) < 3:
                continue
            if area(pts) < MIN_ISLAND and (not shared or is_island(ring)):
                continue
            res.append([(round(x * 10), round(y * 10)) for x, y in pts])
    return res


def num(v):
    s = "%g" % (v / 10)
    if s.startswith("0."):
        s = s[1:]
    elif s.startswith("-0."):
        s = "-" + s[2:]
    return s


def path(rings):
    parts = []
    for r in rings:
        dedup = [r[0]] + [p for i, p in enumerate(r[1:], 1) if p != r[i - 1]]
        if len(dedup) < 3:
            continue
        s = "M" + num(dedup[0][0]) + " " + num(dedup[0][1]) + "l"
        coords = []
        for (x0, y0), (x1, y1) in zip(dedup, dedup[1:]):
            coords.append(num(x1 - x0) + " " + num(y1 - y0))
        parts.append(s + " ".join(coords).replace(" -", "-") + "z")
    return "".join(parts)


provinces, outline_edges = [], {}
for ft in features:
    if ft["kind"] != "prov":
        continue
    rings = process(ft, True)
    for r in rings:
        for a, b in zip(r, r[1:] + r[:1]):
            if a == b:
                continue
            key = (min(a, b), max(a, b))
            outline_edges[key] = outline_edges.get(key, 0) + 1
    lx, ly = proj(ft["label"])
    provinces.append({"id": ft["id"], "name": ft["name"], "d": path(rings),
                      "x": round(lx, 1), "y": round(ly, 1)})
provinces.sort(key=lambda p: p["id"])

# Außengrenze der Türkei: Kanten, die nur zu einer Provinz gehören
adj = {}
for (a, b), c in outline_edges.items():
    if c == 1:
        adj.setdefault(a, []).append(b)
        adj.setdefault(b, []).append(a)
outline_rings = []
seen = set()
for start in list(adj):
    for nxt in adj[start]:
        if (start, nxt) in seen:
            continue
        ring = [start]
        prev, cur = start, nxt
        seen.add((start, nxt)); seen.add((nxt, start))
        while cur != start:
            ring.append(cur)
            cands = [q for q in adj[cur] if (cur, q) not in seen]
            if not cands:
                break
            prev, cur = cur, cands[0]
            seen.add((prev, cur)); seen.add((cur, prev))
        if len(ring) >= 3:
            outline_rings.append(ring)

countries = {}
for ft in features:
    if ft["kind"] != "country":
        continue
    rings = process(ft, True)
    key = "plain" if ft["id"] in PLAIN else "land"
    countries.setdefault(key, []).extend(rings)

lake_rings = []
for lk in lakes:
    lake_rings.extend(process(lk, False))

data = {
    "w": int(W), "h": H,
    "proj": {"lon0": LON0, "lat1": LAT1, "kx": round(K * S, 5), "ky": round(S, 5)},
    "provinces": provinces,
    "outline": path(outline_rings),
    "land": path(countries.get("land", [])),
    "landPlain": path(countries.get("plain", [])),
    "lakes": path(lake_rings),
}

js = ("/* Automatisch erzeugt von tools/build_map.py – nicht von Hand bearbeiten.\n"
      "   Kartendaten: Natural Earth (gemeinfrei), naturalearthdata.com */\n"
      "window.HD = window.HD || {};\nHD.mapData = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")
with open(OUT, "w", encoding="utf-8", newline="\n") as f:
    f.write(js)
print("provinces", len(provinces), "outline rings", len(outline_rings), "bytes", len(js.encode("utf-8")), "H", H)
