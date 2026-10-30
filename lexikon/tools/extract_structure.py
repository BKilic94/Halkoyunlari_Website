"""Liest NUR das Inhaltsverzeichnis der Quell-Markdown-Datei und erzeugt data/structure.js.

Aufruf (im Ordner lexikon/):  python tools/extract_structure.py
Fliesstexte, Tabellen und Bilder werden bewusst nicht uebernommen.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT.parent / "dunden-bugune-halkdanslari.md"
TARGET = ROOT / "data" / "structure.js"

TOC_LINE = re.compile(r"^(?P<indent>\s*)- \[(?P<text>.+)\]\(#(?P<anchor>[^)]+)\)\s*$")
NUMBERED = re.compile(r"^(?P<num>\d+(?:\.\d+)*)\.?\s+(?P<title>.+)$")
SMALL_WORDS = {"ve", "ile", "de", "da", "ya", "veya", "ki"}
ASCII_MAP = str.maketrans("çğıöşüâîûÇĞİÖŞÜÂÎÛ", "cgiosuaiuCGIOSUAIU")


def tr_lower(s: str) -> str:
    return s.replace("I", "ı").replace("İ", "i").lower()


def tr_upper_first(word: str) -> str:
    for i, ch in enumerate(word):
        if ch.isalpha():
            up = {"i": "İ", "ı": "I"}.get(ch, ch.upper())
            return word[:i] + up + word[i + 1:]
        if ch in "’'":
            return word  # Suffix nach Apostroph bleibt klein
    return word


def tidy(title: str) -> str:
    t = re.sub(r"\s+", " ", title).strip()
    t = re.sub(r"\(\s+", "(", t)
    t = re.sub(r"\s+\)", ")", t)
    t = re.sub(r"\s+’", "’", t)
    t = re.sub(r"\s*[:;,]$", "", t)
    letters = [c for c in t if c.isalpha()]
    upper = sum(1 for c in letters if c.isupper())
    if letters and upper / len(letters) > 0.7:
        words = tr_lower(t).split(" ")
        t = " ".join(
            w if (i > 0 and w in SMALL_WORDS) else tr_upper_first(w)
            for i, w in enumerate(words)
        )
    return t


def slugify(text: str) -> str:
    s = text.translate(ASCII_MAP).lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def parse_toc(lines):
    start = next(i for i, l in enumerate(lines) if l.strip() == "# İçindekiler")
    items = []
    for line in lines[start + 1:]:
        if line.startswith("# "):
            break
        m = TOC_LINE.match(line)
        if m:
            items.append((len(m["indent"]) // 2 + 1, m["text"], m["anchor"]))
    return items


def build(items):
    roots, stack, counters = [], [], []
    used_slugs = set()
    for level, text, anchor in items:
        m = NUMBERED.match(text.strip())
        source_num, raw_title = (m["num"], m["title"]) if m else ("", text)
        counters = counters[:level]
        while len(counters) < level:
            counters.append(0)
        counters[level - 1] += 1
        number = ".".join(str(c) for c in counters)
        title = tidy(raw_title)
        node = {
            "number": number,
            "slug": "",
            "level": level,
            "title": {"tr": title, "en": None},
            "source": {"number": source_num, "title": raw_title.strip(), "anchor": anchor},
            "children": [],
        }
        base = slugify(title) or "bolum-" + number.replace(".", "-")
        if level <= 2:
            slug = base
            while slug in used_slugs:
                slug = base + "-" + number.replace(".", "-")
            used_slugs.add(slug)
        else:
            slug = base  # Abschnitts-Anker, eindeutig innerhalb der Elternseite
            siblings = {c["slug"] for c in stack[-1]["children"]} if stack else set()
            if slug in siblings:
                slug = base + "-" + number.replace(".", "-")
        node["slug"] = slug
        stack = stack[: level - 1]
        (stack[-1]["children"] if stack else roots).append(node)
        stack.append(node)
    return roots


def main():
    lines = SOURCE.read_text(encoding="utf-8-sig").splitlines()
    chapters = build(parse_toc(lines))
    data = {
        "book": {"title": {"tr": "Dünden Bugüne Halk Dansları", "en": None}, "author": "Niyazi Kılıç"},
        "chapters": chapters,
    }
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    TARGET.write_text(
        "/* Automatisch erzeugt von tools/extract_structure.py – nicht manuell bearbeiten. */\n"
        "window.HD = window.HD || {};\n"
        "HD.structure = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n",
        encoding="utf-8",
    )
    renumbered, count = [], 0

    def walk(nodes):
        nonlocal count
        for n in nodes:
            count += 1
            if n["source"]["number"] and n["source"]["number"] != n["number"]:
                renumbered.append(f'{n["source"]["number"]} -> {n["number"]} {n["title"]["tr"]}')
            walk(n["children"])

    walk(chapters)
    print(f"{count} Ueberschriften geschrieben nach {TARGET}")
    for r in renumbered:
        print("Nummer korrigiert:", r)


if __name__ == "__main__":
    main()
