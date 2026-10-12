#!/usr/bin/env python3
"""Fetch still plates declared in films/<film>/stills.json from Wikimedia Commons.

Contract (imgagent-style: verified bytes, honest negatives):
  - input   films/<film>/stills.json  -> {"plates":[{id, file, aspect, caption, use, query}...]}
  - output  films/<film>/stills/raw/<id>.jpg   (1600px thumb, bytes validated)
            films/<film>/stills/credits.json   (auto ledger: source, license, artist, query)
  - exit 0 only if EVERY plate downloaded + validated; failures are listed loudly.

Only PD / CC0 / CC BY / CC BY-SA licenses pass. Fair-use or unknown licenses abort.

Usage: python3 fetch_stills.py <film-dir> [--force]
"""
import json, os, re, subprocess, sys, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
UA = "DocumentaryEngine-stills/1.0 (https://github.com/superz1402; superz1402@users.noreply.github.com) curl/8"
API = "https://commons.wikimedia.org/w/api.php"
OK_LIC = re.compile(r"^(public domain|cc0|cc by(-sa)?( [1-4](\.\d)?)?|attribution)", re.I)
MIN_BYTES, MIN_W = 40_000, 640


def curl_json(url):
    r = subprocess.run(["curl", "-s", "--max-time", "60", "-A", UA, url],
                       capture_output=True, text=True, timeout=90)
    return json.loads(r.stdout)


def imageinfo(title):
    q = urllib.parse.urlencode({
        "action": "query", "titles": title, "prop": "imageinfo",
        "iiprop": "url|size|extmetadata", "iiurlwidth": "1600", "format": "json"})
    data = curl_json(f"{API}?{q}")
    for p in (data.get("query") or {}).get("pages", {}).values():
        ii = (p.get("imageinfo") or [{}])[0]
        em = ii.get("extmetadata") or {}
        strip = lambda k: re.sub(r"<[^>]+>", "", (em.get(k) or {}).get("value", "")).strip()
        return {"title": p.get("title"), "url": ii.get("url"), "thumb": ii.get("thumburl") or ii.get("url"),
                "width": ii.get("width", 0), "height": ii.get("height", 0),
                "license": strip("LicenseShortName"), "artist": strip("Artist")[:120],
                "credit": strip("Credit")[:160], "desc_url": ii.get("descriptionurl", "")}
    return None


def download(url, dest):
    r = subprocess.run(["curl", "-sL", "--max-time", "120", "-A", UA, "-o", dest, url],
                       timeout=150)
    return r.returncode == 0 and os.path.exists(dest)


def validate(path):
    if os.path.getsize(path) < MIN_BYTES:
        return f"too small ({os.path.getsize(path)}B)"
    with open(path, "rb") as f:
        head = f.read(24)
    if not (head[:3] == b"\xff\xd8\xff" or head[:8] == b"\x89PNG\r\n\x1a\n"):
        return "not a JPEG/PNG (magic bytes)"
    try:
        from PIL import Image
        with Image.open(path) as im:
            if im.width < MIN_W:
                return f"width {im.width} < {MIN_W}"
    except ImportError:
        pass
    return None


def main():
    film = sys.argv[1].rstrip("/")
    force = "--force" in sys.argv
    manifest = json.load(open(f"{film}/stills.json", encoding="utf-8"))
    raw_dir, out_json = f"{film}/stills/raw", f"{film}/stills/credits.json"
    os.makedirs(raw_dir, exist_ok=True)
    ledger, failures = [], []
    for plate in manifest["plates"]:
        pid = plate["id"]
        dest = f"{raw_dir}/{pid}.jpg"
        info = imageinfo(plate["file"])
        if not info or not info.get("url"):
            failures.append(f"{pid}: no Commons imageinfo for {plate['file']}"); continue
        if not OK_LIC.match(info["license"]):
            failures.append(f"{pid}: license '{info['license']}' not embeddable"); continue
        ok, why = os.path.exists(dest) and not force, None
        if not ok:
            if not download(info["thumb"], dest):
                failures.append(f"{pid}: download failed"); continue
            why = validate(dest)
            if why:
                failures.append(f"{pid}: invalid — {why}"); continue
        ledger.append({**{k: plate.get(k) for k in ("id", "use", "caption", "query")},
                       "source_title": info["title"], "source_page": info["desc_url"],
                       "source_url": info["url"], "license": info["license"],
                       "artist": info["artist"], "credit": info["credit"],
                       "local": os.path.relpath(dest, film), "validated": True})
        print(f"OK  {pid:16s} [{info['license']}] {info['width']}x{info['height']} {info['title']}")
    json.dump({"project": os.path.basename(film), "generator": "core/stills/fetch_stills.py",
               "note": "All plates from Wikimedia Commons with license metadata; on-screen tags + film description carry attribution.",
               "plates": ledger}, open(out_json, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    if failures:
        print("\nFAILURES:"); [print(" -", f) for f in failures]
        sys.exit(1)
    print(f"\n{len(ledger)} plates fetched+validated -> {out_json}")


if __name__ == "__main__":
    main()
