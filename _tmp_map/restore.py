import difflib, os, shutil, datetime
H = os.path.expandvars(r"%APPDATA%\Code\User\History")
L = r"d:\Webseite\dunden-bugune-halkdanslari\lexikon"
BK = r"d:\Webseite\dunden-bugune-halkdanslari\_tmp_map\backup_" + datetime.datetime.now().strftime("%H%M%S")


def rd(p):
    with open(p, encoding="utf-8", newline="") as f:
        return f.read().splitlines(keepends=True)


def merge3(base, a, b):
    ea = [o for o in difflib.SequenceMatcher(None, base, a, autojunk=False).get_opcodes() if o[0] != "equal"]
    eb = [o for o in difflib.SequenceMatcher(None, base, b, autojunk=False).get_opcodes() if o[0] != "equal"]
    edits = [(o[1], o[2], a[o[3]:o[4]]) for o in ea] + [(o[1], o[2], b[o[3]:o[4]]) for o in eb]
    edits.sort(key=lambda e: (e[0], e[1]))
    for x, y in zip(edits, edits[1:]):
        if y[0] < x[1] or (y[0] == x[0] and y[1] == x[1]):
            raise SystemExit("conflict at base line %d" % y[0])
    out, pos = [], 0
    for s, e, rep in edits:
        out += base[pos:s] + rep
        pos = e
    return out + base[pos:]


jobs = [
    (r"assets\js\views.js", r"4587642e\7m8I.js", r"4587642e\ZG6V.js", r"4587642e\O2Lk.js"),
    (r"assets\css\main.css", r"-522dc2a5\YyBD.css", r"-522dc2a5\1XuH.css", r"-522dc2a5\zwlG.css"),
]
os.makedirs(BK)
results = {}
for rel, base, a, b in jobs:
    results[rel] = merge3(rd(os.path.join(H, base)), rd(os.path.join(H, a)), rd(os.path.join(H, b)))
for rel in [j[0] for j in jobs] + [r"data\site.js", "index.html"]:
    dst = os.path.join(BK, rel.replace("\\", "_"))
    shutil.copy2(os.path.join(L, rel), dst)
for rel, lines in results.items():
    with open(os.path.join(L, rel), "w", encoding="utf-8", newline="") as f:
        f.write("".join(lines))
shutil.copyfile(os.path.join(H, r"7a055a16\GrDJ.js"), os.path.join(L, r"data\site.js"))
shutil.copyfile(os.path.join(H, r"4bd01032\jQRA.html"), os.path.join(L, "index.html"))
print("OK", BK)
