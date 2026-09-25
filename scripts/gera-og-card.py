#!/usr/bin/env python3
"""Gera o card Open Graph (1200x630) do Atlas — executado pelo GitHub Actions e localmente."""
import math, os
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
paper, ink, muted, line = "#FAFAF7", "#16181D", "#6E7278", "#E4E2DB"
accent, fed, ifc, est = "#D42B1F", "#1E40AF", "#0F766E", "#B45309"

def fonte(tamanho, peso="Bold"):
    """Open Sans se disponivel (baixada no CI), senao DejaVu."""
    candidatos = [
        os.path.join("fonts", f"OpenSans-{peso}.ttf"),
        f"/usr/share/fonts/truetype/dejavu/DejaVuSans-{peso}.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    for c in candidatos:
        if os.path.exists(c):
            return ImageFont.truetype(c, tamanho)
    return ImageFont.load_default()

img = Image.new("RGB", (W, H), paper)
d = ImageDraw.Draw(img)

# roda (motivo do site): anel de nos coloridos + raios
cx, cy, R = 940, 300, 205
n = 26
nodes = []
for i in range(n):
    a = -math.pi / 2 + i * 2 * math.pi / n
    nodes.append((cx + R * math.cos(a), cy + R * math.sin(a)))
for (x, y) in nodes:
    d.line([cx, cy, x, y], fill=line, width=2)
d.ellipse([cx - R - 14, cy - R - 14, cx + R + 14, cy + R + 14], outline=line, width=3)
cores = [fed] * 12 + [ifc] * 9 + [est] * 5
for i, (x, y) in enumerate(nodes):
    r = 13 if i % 3 == 0 else 9
    d.ellipse([x - r, y - r, x + r, y + r], fill=cores[i % len(cores)])
d.ellipse([cx - 16, cy - 16, cx + 16, cy + 16], fill=ink)

# titulo
f_t = fonte(56)
d.text((70, 128), "Atlas das", font=f_t, fill=ink)
d.text((70, 200), "Universidades Públicas", font=f_t, fill=ink)
d.text((70, 272), "e dos Institutos Federais", font=f_t, fill=ink)

# subtitulo
f_s = fonte(27, "Regular")
sub = "Quem mantém, supervisiona, avalia e fomenta cada instituição — e com qual norma legal."
lines, cur = [], ""
for w_ in sub.split():
    t = (cur + " " + w_).strip()
    if d.textlength(t, font=f_s) <= 620:
        cur = t
    else:
        lines.append(cur)
        cur = w_
lines.append(cur)
y = 380
for ln in lines:
    d.text((70, y), ln, font=f_s, fill=muted)
    y += 40

# rodape: quadrado vermelho + dominio
d.rectangle([70, 508, 102, 540], fill=accent)
d.text((122, 508), "atlasuniversidadesifs.org", font=fonte(34), fill=ink)

os.makedirs("img", exist_ok=True)
img.save("img/og-card.png", optimize=True)
print("img/og-card.png gerado:", img.size)
