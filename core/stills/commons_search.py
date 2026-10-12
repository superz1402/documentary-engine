#!/usr/bin/env python3
"""Wikimedia Commons search: find freely-licensed images (with license + artist metadata).

Usage: python3 commons_search.py "<query>" <limit> <out.json> [--download DIR]
Writes JSON list of {title, url, thumb, width, height, license, artist, desc_url}.
With --download, fetches originals into DIR (slugified names) and adds "file" field.
"""
import json
import re
import sys
import urllib.parse
import urllib.request

API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "DocumentaryAgentKit/1.0 (https://github.com/superz1402/documentary-agent-kit; superz1402@users.noreply.github.com) curl/8"}


def _get(url, timeout=40):
    """Fetch JSON via curl subprocess (urllib UA gets 403 rate-limited by Commons)."""
    import subprocess
    r = subprocess.run(
        ["curl", "-s", "--max-time", str(timeout), "-A", UA["User-Agent"], url],
        capture_output=True, text=True, timeout=timeout + 10,
    )
    return json.loads(r.stdout)


def search(query, limit=20):
    params = {
        "action": "query",
        "generator": "search",
        "gsrsearch": query,
        "gsrnamespace": "6",
        "gsrlimit": str(limit),
        "prop": "imageinfo",
        "iiprop": "url|size|extmetadata",
        "iiurlwidth": "1600",
        "format": "json",
    }
    url = API + "?" + urllib.parse.urlencode(params)
    data = _get(url)
    pages = (data.get("query") or {}).get("pages") or {}
    out = []
    for p in pages.values():
        ii = (p.get("imageinfo") or [{}])[0]
        em = ii.get("extmetadata") or {}
        lic = (em.get("LicenseShortName") or {}).get("value", "Unknown")
        artist = re.sub(r"<[^>]+>", "", (em.get("Artist") or {}).get("value", "")).strip()
        out.append({
            "title": p.get("title", ""),
            "url": ii.get("url", ""),
            "thumb": ii.get("thumburl", ""),
            "width": ii.get("width", 0),
            "height": ii.get("height", 0),
            "license": lic,
            "artist": artist[:120],
            "desc_url": ii.get("descriptionurl", ""),
        })
    out.sort(key=lambda x: -x["width"])
    return out


def slug(t):
    return re.sub(r"[^A-Za-z0-9._-]+", "_", t.replace("File:", ""))[:80]


def download(items, outdir):
    import os
    os.makedirs(outdir, exist_ok=True)
    for it in items:
        if it.get("file"):
            continue
        dest = os.path.join(outdir, slug(it["title"]))
        try:
            req = urllib.request.Request(it["url"], headers=UA)
            with urllib.request.urlopen(req, timeout=60) as r, open(dest, "wb") as f:
                f.write(r.read())
            it["file"] = dest
        except Exception as e:  # noqa: BLE001
            it["error"] = str(e)[:200]
    return items


if __name__ == "__main__":
    q, limit, out = sys.argv[1], int(sys.argv[2]), sys.argv[3]
    dl = None
    if "--download" in sys.argv:
        dl = sys.argv[sys.argv.index("--download") + 1]
    items = search(q, limit)
    if dl:
        items = download(items, dl)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=1)
    for it in items:
        print(f"{it['width']}x{it['height']} [{it['license']}] {it['title']} :: {it['artist'][:60]}")
