#!/usr/bin/env python3
"""Prep still plates for the film engine: cover-crop -> duotone -> grain -> vignette.

Input  films/<film>/stills/raw/<id>.jpg   (from fetch_stills.py)
Output films/<film>/stills/<id>.jpg       (cold Nordic archival plates, deterministic)

Every plate ends up in the film's ice-dossier palette (shadows #0F1A26, mids steel-blue,
highlights paper-white) so real photographs sit inside the drawn world without clashing.

Usage: python3 prep_plates.py <film-dir> [--force]
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
STOPS = [(15, 26, 38), (110, 134, 154), (237, 239, 240)]   # shadow / mid / highlight


def lut():
    """256-entry per-channel duotone LUT from the 3 colour stops."""
    xs = [0, 132, 255]
    table = [[], [], []]
    for c in range(3):
        for i in range(256):
            if i <= xs[1]:
                u = i / xs[1]
                v = STOPS[0][c] + (STOPS[1][c] - STOPS[0][c]) * u
            else:
                u = (i - xs[1]) / (255 - xs[1])
                v = STOPS[1][c] + (STOPS[2][c] - STOPS[1][c]) * u
            table[c].append(int(round(v)))
    return table


def cover_crop(im, aspect):
    tw, th = aspect
    w, h = im.size
    target = tw / th
    cur = w / h
    if cur > target:                      # too wide -> crop width
        nw = int(round(h * target))
        x0 = (w - nw) // 2
        im = im.crop((x0, 0, x0 + nw, h))
    else:                                 # too tall -> crop height (bias slightly up: skies/faces)
        nh = int(round(w / target))
        y0 = int((h - nh) * 0.42)
        im = im.crop((0, y0, w, y0 + nh))
    return im


def main():
    film = sys.argv[1].rstrip("/")
    force = "--force" in sys.argv
    manifest = json.load(open(f"{film}/stills.json", encoding="utf-8"))
    table = lut()
    rng = np.random.default_rng(1970)
    for plate in manifest["plates"]:
        pid, aspect = plate["id"], plate["aspect"]
        src, dst = f"{film}/stills/raw/{pid}.jpg", f"{film}/stills/{pid}.jpg"
        if os.path.exists(dst) and not force:
            print(f"skip {pid}"); continue
        im = Image.open(src)
        im = cover_crop(im, aspect)
        w = 1200
        im = im.resize((w, int(round(w * aspect[1] / aspect[0]))), Image.LANCZOS)
        g = ImageOps.autocontrast(im.convert("L"), cutoff=1)
        # duotone via per-channel LUT applied to the luma channel
        r = g.point(table[0]); gg = g.point(table[1]); b = g.point(table[2])
        out = Image.merge("RGB", (r, gg, b))
        a = np.asarray(out).astype(np.float32)
        # grain
        a += rng.normal(0.0, 5.5, a.shape).astype(np.float32)
        # vignette
        hh, ww = a.shape[:2]
        yy, xx = np.mgrid[0:hh, 0:ww]
        cx, cy = ww / 2, hh / 2
        d = np.sqrt(((xx - cx) / cx) ** 2 + ((yy - cy) / cy) ** 2) / np.sqrt(2)
        a *= (1.0 - 0.18 * np.clip(d, 0, 1) ** 2)[:, :, None]
        out = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
        out.save(dst, quality=87, progressive=True)
        print(f"OK   {pid:16s} {out.size[0]}x{out.size[1]}")


if __name__ == "__main__":
    main()
