import os, json, datetime
root = os.path.expandvars(r"%APPDATA%\Code\User\History")
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
    if "halkdanslari" in res:
        es = j.get("entries", [])
        last = es[-3:]
        out.append(res.split("halkdanslari")[-1] + " :: " + " | ".join(
            datetime.datetime.fromtimestamp(e["timestamp"] / 1000).strftime("%m-%d %H:%M:%S") + " " + str(os.path.getsize(os.path.join(root, d, e["id"]))) + " " + d + "\\" + e["id"] + " " + e.get("source", "")
            for e in last))
with open(r"d:\Webseite\dunden-bugune-halkdanslari\_tmp_map\hist_all.txt", "w", encoding="utf-8") as fh:
    fh.write("\n".join(sorted(out)))
