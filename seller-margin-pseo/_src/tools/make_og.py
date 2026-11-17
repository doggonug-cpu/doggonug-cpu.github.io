#!/usr/bin/env python3
"""og.png(1200x630) 소셜 카드 이미지를 만듭니다. 필요할 때만 실행하세요."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

SRC = Path(__file__).resolve().parent.parent
OUT = SRC / "assets" / "og.png"
FONT = Path("/workspace/fonts/NotoSansKR-Regular.ttf")
FALLBACK = Path("/usr/share/fonts/pickle-hwp/NotoSansCJKkr-Regular.otf")


def font(size: int) -> ImageFont.FreeTypeFont:
    path = FONT if FONT.exists() else FALLBACK
    return ImageFont.truetype(str(path), size)


W, H = 1200, 630
img = Image.new("RGB", (W, H), "#0b1220")
d = ImageDraw.Draw(img)

# 배경 격자
for x in range(0, W, 60):
    d.line([(x, 0), (x, H)], fill="#101a2c", width=1)
for y in range(0, H, 60):
    d.line([(0, y), (W, y)], fill="#101a2c", width=1)

# 강조 막대
d.rounded_rectangle([80, 96, 96, 236], radius=8, fill="#34d399")
d.text((128, 92), "셀러·프리랜서 마진 계산기", font=font(30), fill="#94a3b8")

d.text((128, 150), "마진계산기", font=font(84), fill="#f8fafc")

lines = ["판매 채널 21곳의 수수료·부가세·광고비·반품을 넣어",
         "건당 순수익과 손익분기 판매가를 바로 계산합니다."]
y = 286
for line in lines:
    d.text((128, y), line, font=font(32), fill="#cbd5e1")
    y += 46

chips = ["스마트스토어", "쿠팡", "배달앱", "크몽·숨고", "자사몰"]
x = 128
for chip in chips:
    w = d.textlength(chip, font=font(24)) + 36
    d.rounded_rectangle([x, 420, x + w, 468], radius=24, outline="#334155", width=2, fill="#111c30")
    d.text((x + 18, 430), chip, font=font(24), fill="#a7f3d0")
    x += w + 14

d.text((128, 546), "요율은 각 플랫폼 공개 자료 기준 · 계산은 브라우저에서만", font=font(22), fill="#64748b")

img.save(OUT, "PNG", optimize=True)
print(f"저장: {OUT} ({OUT.stat().st_size // 1024}KB)")
