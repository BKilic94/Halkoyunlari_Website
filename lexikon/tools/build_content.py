"""Uebernimmt die Fliesstexte freigegebener Kapitel woertlich aus der Quell-Markdown-Datei
und erzeugt data/content.js. Bilder werden nach assets/img/buch kopiert.

Aufruf (im Ordner lexikon/):  python tools/build_content.py
Neue Kapitel werden erst nach Pruefung in CHAPTERS eingetragen.
"""
import json
import re
import shutil
import struct

from extract_structure import ROOT, SOURCE, build, parse_toc

TARGET = ROOT / "data" / "content.js"
IMG_DIR = ROOT / "assets" / "img" / "buch"
CHAPTERS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19"]
# Grosse Kapitel abschnittsweise: Kapiteltext plus die freigegebenen Unterkapitel
PARTS = {"20": ["20.1", "20.2", "20.3", "20.4", "20.5", "20.6", "20.7", "20.8", "20.9", "20.10", "20.11", "20.12", "20.13", "20.14"]}

ANCHOR = re.compile(r'<a id="(_Toc\d+)"></a>')
IMAGE = re.compile(r"(!\[[^\]]*\]\()bilder/([^)\s]+)\)")
LINKED_IMAGE = re.compile(r"\[(!\[[^\]]*\]\([^)\s]+\))\]\(https?://[^)\s]+\)")
TOC_LINK = re.compile(r"\]\(#(_Toc\d+)\)")
# Inhaltslisten des Buches entfallen: die Website hat eigene Navigation ("Bu maddede", Karten)
BOOK_TOC = re.compile(r"(?:\*\*)?(?:İçindekiler|İÇİNDEKİLER|İÇİNDEKLER)(?:\*\*)?[ \t]*\n\s*\n"
                      r"(?:[ \t]*- \[[^\]]*\]\(#(?:node:[\d.]+|_Toc\d+)\)[ \t]*(?:\n|$))+")

# Gestaltungswuensche des Autors: (Abschnitt, Original, Ersatz). "::: arrow" = links Liste, Pfeil, rechts Text.
ARA_TURLER = ["A- Bengiler", "B- Mengiler", "C- Seymen Oyunları", "D- Teke Oyunları",
              "E- Yallılar", "F- Horalar", "G- Güvendeler"]
ARA_TEXT = "Bengiler, Mengiler ve Seymenler Zeybeklerin etkisinde kalan lokal oyunlardır."
PATCHES = [
    ("14",
     ARA_TEXT + "\n\n" + "\n\n".join(ARA_TURLER),
     "::: arrow\n" + "\n".join(ARA_TURLER) + "\n>>>\n" + ARA_TEXT + "\n:::"),
    # Word-Gliederungsnummer vor einem Literatureintrag
    ("20.1.5", "##### 1.1.1.1.1 BAYKURT, Şerif", "BAYKURT, Şerif"),
    # Bild auf der Yöreler-Seite entfernt (Nutzerwunsch)
    ("20", "![](assets/img/buch/image45.png)", ""),
]

# Inhalte, die in der Quelle im falschen Abschnitt stehen: (von, Text, nach) – wird am Anfang von "nach" eingefügt
MOVES = [
    ("20.2.6", "![](assets/img/buch/image89.png)", "20.2.7"),
    ("20.4.12", "![](assets/img/buch/image154.png)\n\n![](assets/img/buch/image155.png)\n\n"
                "![](assets/img/buch/image156.png)", "20.5"),
    ("20.5.12", "![Ein Bild, das Text, Stadt, Straße, Autobahn enthält.  Automatisch generierte Beschreibung]"
                "(assets/img/buch/image203.jpeg)", "20.6"),
    ("20.6.11", "![](assets/img/buch/image242.png)", "20.7"),
    ("20.8.8", "![](assets/img/buch/image320.png)", "20.9"),
]


def apply_patches(content):
    for src, text, dst in MOVES:
        if src not in content:
            continue
        if content[src].count(text) != 1:
            raise SystemExit(f"Verschiebung {src} -> {dst} passt nicht mehr zur Quelle")
        content[src] = content[src].replace(text, "").strip("\n")
        if dst in content:
            content[dst] = (text + "\n\n" + content[dst]).strip("\n")
    for number, old, new in PATCHES:
        if number not in content:
            continue
        if content[number].count(old) != 1:
            raise SystemExit(f"Gestaltungsvorgabe fuer {number} passt nicht mehr zur Quelle")
        content[number] = content[number].replace(old, new)


def walk(nodes):
    for n in nodes:
        yield n
        yield from walk(n["children"])


def image_size(path):
    data = path.read_bytes()
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return struct.unpack(">II", data[16:24])
    i = 2
    while i < len(data):
        marker, length = data[i + 1], struct.unpack(">H", data[i + 2:i + 4])[0]
        if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
            h, w = struct.unpack(">HH", data[i + 5:i + 9])
            return w, h
        i += 2 + length
    raise ValueError(f"Bildgroesse unbekannt: {path}")


def copy_images(body, images):
    """Kopiert die Bilder nach assets/img/buch und passt die Pfade an."""
    def repl(m):
        name = m[2]
        src = SOURCE.parent / "bilder" / name
        IMG_DIR.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, IMG_DIR / name)
        rel = "assets/img/buch/" + name
        images[rel] = list(image_size(src))
        return m[1] + rel + ")"
    return IMAGE.sub(repl, body)


def heading_lines(lines, anchors):
    """Zeilennummer der Ueberschrift je Inhaltsverzeichnis-Anker (oder der Ankerzeile davor)."""
    found = {}
    for i, line in enumerate(lines):
        anchor_only = not ANCHOR.sub("", line).strip()
        if not (line.startswith("#") or anchor_only):
            continue
        for a in ANCHOR.findall(line):
            if a in anchors and a not in found:
                found[a] = i
    return found


def anchor_targets(lines, starts, nodes):
    """Alle _Toc-Anker einer Ueberschrift (auch aus Ankerzeilen davor) -> Abschnittsnummer."""
    by_line = {starts[n["source"]["anchor"]]: n["number"] for n in nodes if n["source"]["anchor"] in starts}
    targets, pending = {}, []
    for i, line in enumerate(lines):
        found = ANCHOR.findall(line)
        if i in by_line:
            for a in pending + found:
                targets[a] = by_line[i]
            pending = []
        elif found and not ANCHOR.sub("", line).strip():
            pending += found
        elif line.strip():
            pending = []
    return targets


def clean(body, targets):
    # Buchstaben, die bei der PDF-Umwandlung vertauscht wurden; "udaġan" (Yakutisch) bleibt
    body = re.sub(r"(?<![a-zçğıöşüâîû])ġ", "Ş", body).replace("Ģ", "ş").replace("Ġ", "İ")
    body = LINKED_IMAGE.sub(r"\1", body)
    body = TOC_LINK.sub(lambda m: "](#node:" + targets[m[1]] + ")" if m[1] in targets else m[0], body)
    body = BOOK_TOC.sub("", body)
    body = "\n".join(l for l in body.split("\n") if not (ANCHOR.search(l) and not ANCHOR.sub("", l).strip()))
    return ANCHOR.sub("", body).strip("\n")


def included(number):
    top = number.split(".")[0]
    if top in CHAPTERS:
        return True
    return top in PARTS and (number == top or any(number == p or number.startswith(p + ".") for p in PARTS[top]))


def main():
    lines = SOURCE.read_text(encoding="utf-8-sig").splitlines()
    chapters = build(parse_toc(lines))
    nodes = list(walk(chapters))
    starts = heading_lines(lines, {n["source"]["anchor"] for n in nodes})
    targets = anchor_targets(lines, starts, nodes)
    toc = next(i for i, l in enumerate(lines) if l.strip() == "# İçindekiler")
    toc_end = next(i for i, l in enumerate(lines) if l.startswith("# ") and i > toc)
    order = sorted(v for v in starts.values() if v >= toc_end)

    content, images, missing = {}, {}, []
    for n in nodes:
        if not included(n["number"]):
            continue
        start = starts.get(n["source"]["anchor"])
        if start is None:
            missing.append(n["number"])
            continue
        nxt = next((s for s in order if s > start), len(lines))
        part = lines[start + 1:nxt]
        if not lines[start].startswith("#"):
            # Anker steht vor der Ueberschrift: die Ueberschrift selbst zeigt die Website schon an
            h = next(i for i, l in enumerate(part) if l.startswith("#"))
            part = part[:h] + part[h + 1:]
        body = clean("\n".join(part), targets)
        # Leere Abschnitte bleiben leer (statt Platzhalter)
        content[n["number"]] = copy_images(body, images) if body.strip() else ""
    apply_patches(content)

    TARGET.write_text(
        "/* Automatisch erzeugt von tools/build_content.py – nicht manuell bearbeiten.\n"
        "   Woertliche Texte aus dunden-bugune-halkdanslari.md (Markdown). */\n"
        "window.HD = window.HD || {};\n"
        "HD.content = " + json.dumps({"tr": content, "en": {}, "images": images}, ensure_ascii=False, indent=1) + ";\n",
        encoding="utf-8",
    )
    parts = ", ".join(p for ps in PARTS.values() for p in ps)
    print(f"{len(content)} Texte, {len(images)} Bilder geschrieben nach {TARGET} (Kapitel {', '.join(CHAPTERS)}; Teile {parts})")
    for m in missing:
        print("Ueberschrift nicht gefunden:", m)


if __name__ == "__main__":
    main()
