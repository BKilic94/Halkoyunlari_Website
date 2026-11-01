import json, os
d = os.path.dirname(os.path.abspath(__file__))
g = json.load(open(os.path.join(d, "ne_10m_admin_1_states_provinces.geojson"), encoding="utf-8"))
tr = [f for f in g["features"] if f["properties"].get("adm0_a3") == "TUR"]
out = [str(len(tr))]
out.append(", ".join(sorted(tr[0]["properties"].keys())))
for f in tr:
    p = f["properties"]
    out.append(" | ".join(str(p.get(k)) for k in ("name", "name_tr", "name_en", "iso_3166_2", "region", "geometry")) + " | " + f["geometry"]["type"])
open(os.path.join(d, "inspect_out.txt"), "w", encoding="utf-8").write("\n".join(out))
