import os, json, datetime
root = os.path.expandvars(r"%APPDATA%\Code\User\History")
targets = ("lexikon/index.html", "lexikon/assets/js/views.js", "lexikon/assets/css/main.css", "lexikon/data/site.js", "lexikon/assets/js/app.js")
out = []
for d in os.listdir(root):
    p = os.path.join(root, d, "entries.json")
    if not os.path.exists(p):
        continue
    try:
        j = json.load(open(p, encoding="utf-8"))
    except Exception:
        continue
    res = j.get("resource", "")
    if "halkdanslari" in res and any(res.endswith(t) for t in targets):
        for e in j.get("entries", []):
            f = os.path.join(root, d, e["id"])
            ts = datetime.datetime.fromtimestamp(e["timestamp"] / 1000)
            out.append((res.split("halkdanslari")[-1], ts.isoformat(timespec="seconds"), os.path.getsize(f) if os.path.exists(f) else -1, f))
out.sort()
base = r"d:\Webseite\dunden-bugune-halkdanslari\lexikon"
with open(r"d:\Webseite\dunden-bugune-halkdanslari\_tmp_map\hist.txt", "w", encoding="utf-8") as fh:
    for rel in ("index.html", r"assets\js\views.js", r"assets\css\main.css", r"data\site.js", r"assets\js\app.js"):
        p = os.path.join(base, rel)
        fh.write("CURRENT %s %s %d\n" % (rel, datetime.datetime.fromtimestamp(os.path.getmtime(p)).isoformat(timespec="seconds"), os.path.getsize(p)))
    for r in out:
        fh.write("%s\t%s\t%d\t%s\n" % r)
