import urllib.request, os
base = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/"
files = ["ne_10m_admin_1_states_provinces.geojson", "ne_10m_admin_0_countries.geojson"]
out = os.path.dirname(os.path.abspath(__file__))
for f in files:
    p = os.path.join(out, f)
    if os.path.exists(p) and os.path.getsize(p) > 1000:
        print("exists", f, os.path.getsize(p)); continue
    urllib.request.urlretrieve(base + f, p)
    print("ok", f, os.path.getsize(p))
