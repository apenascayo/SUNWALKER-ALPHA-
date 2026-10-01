#!/usr/bin/env python3
"""Extract the four protagonist sprite sheets from the supplied 1536x1024 reference image.

Usage:
  python tools/extract_player_sprites.py reference.png public/game/assets
"""
from pathlib import Path
from collections import deque
from PIL import Image
import sys

PANELS = {
    "sword": ([48,139,232,325,416,507,598,693,786], [114,194,271,351,430,509]),
    "sheath": ([853,939,1022,1107,1193,1276,1359,1441,1523], [114,195,273,354,435,509]),
    "trabuco": ([48,137,227,317,408,497,593,693,789], [629,701,775,848,922,998]),
    "idle": ([848,932,1016,1101,1186,1270,1354,1438,1523], [635,726,816,907,998]),
}
ROWS = {"sword":5, "sheath":5, "trabuco":5, "idle":4}
CELL = 48

def clean_frame(crop):
    rgba = crop.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    bg = set()
    for y in range(h):
        for x in range(w):
            r,g,b,_ = px[x,y]
            mx,mn = max(r,g,b),min(r,g,b)
            sat = (mx-mn)/max(mx,1)
            if sat < 0.25 and mx > 0.28:
                bg.add((x,y))

    q = deque()
    for x in range(w):
        for y in (0,h-1):
            if (x,y) in bg: q.append((x,y))
    for y in range(h):
        for x in (0,w-1):
            if (x,y) in bg: q.append((x,y))
    seen = set(q)
    while q:
        x,y = q.popleft()
        r,g,b,_ = px[x,y]
        px[x,y] = (r,g,b,0)
        for nx,ny in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)):
            if 0 <= nx < w and 0 <= ny < h and (nx,ny) in bg and (nx,ny) not in seen:
                seen.add((nx,ny)); q.append((nx,ny))

    box = rgba.getbbox()
    if box: rgba = rgba.crop(box)
    scale = min(44/rgba.width, 44/rgba.height)
    rgba = rgba.resize((max(1,round(rgba.width*scale)), max(1,round(rgba.height*scale))), Image.Resampling.LANCZOS)
    out = Image.new("RGBA",(CELL,CELL),(0,0,0,0))
    out.alpha_composite(rgba,((CELL-rgba.width)//2,(CELL-rgba.height)//2))
    return out

def main():
    if len(sys.argv) != 3:
        raise SystemExit("Uso: python tools/extract_player_sprites.py reference.png public/game/assets")
    source = Image.open(sys.argv[1]).convert("RGBA")
    out_dir = Path(sys.argv[2]); out_dir.mkdir(parents=True,exist_ok=True)
    for name,(xs,ys) in PANELS.items():
        sheet = Image.new("RGBA",(CELL*8,CELL*ROWS[name]),(0,0,0,0))
        for row in range(ROWS[name]):
            for col in range(8):
                crop = source.crop((xs[col]+6,ys[row]+6,xs[col+1]-6,ys[row+1]-6))
                sheet.alpha_composite(clean_frame(crop),(col*CELL,row*CELL))
        sheet.save(out_dir/f"player_{name}.png",optimize=True)
        print("created", f"player_{name}.png")

if __name__ == "__main__":
    main()
