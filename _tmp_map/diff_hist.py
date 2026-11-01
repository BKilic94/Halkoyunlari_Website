import difflib, os
H = os.path.expandvars(r"%APPDATA%\Code\User\History")
pairs = {
    "index_lost(2236->2241)": (r"4bd01032\GyGz.html", r"4bd01032\BQLU.html"),
    "index_legal(2241->2242)": (r"4bd01032\BQLU.html", r"4bd01032\jQRA.html"),
    "views_lost": (r"4587642e\ZG6V.js", r"4587642e\7m8I.js"),
    "views_legal": (r"4587642e\7m8I.js", r"4587642e\O2Lk.js"),
    "css_lost": (r"-522dc2a5\1XuH.css", r"-522dc2a5\YyBD.css"),
    "css_legal": (r"-522dc2a5\YyBD.css", r"-522dc2a5\zwlG.css"),
}
out = open(r"d:\Webseite\dunden-bugune-halkdanslari\_tmp_map\diffs.txt", "w", encoding="utf-8")
for name, (a, b) in pairs.items():
    A = open(os.path.join(H, a), encoding="utf-8").read().splitlines()
    B = open(os.path.join(H, b), encoding="utf-8").read().splitlines()
    out.write("=" * 20 + name + "\n")
    for l in difflib.unified_diff(A, B, lineterm="", n=1):
        out.write(l[:300] + "\n")
out.close()
