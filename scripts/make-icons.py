#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
تولید آیکون‌های PWA دموی «بازارعمده» بدون هیچ وابستگی بیرونی.

خروجی‌ها در public/icons ساخته می‌شوند:
  • icon-192.png
  • icon-512.png
  • maskable-512.png  (پس‌زمینه تمام‌رنگ برای ماسک اندروید)

اجرای دستی (در صورت نیاز به بازتولید):
    python3 scripts/make-icons.py

طرح آیکون: مربع سبز برند با گوشه‌های گرد + سه کارتن سفید با ارتفاع افزایشی
(نماد خرید عمده و رشد فروش) + فلش زردرنگ رو به بالا.
"""

import os
import struct
import zlib

GREEN_TOP = (0x12, 0x85, 0x5F)
GREEN_BOTTOM = (0x0B, 0x4C, 0x37)
WHITE = (0xFF, 0xFF, 0xFF)
AMBER = (0xF9, 0xC2, 0x2E)
TRANSPARENT = (0, 0, 0, 0)


def make_canvas(size):
    return [[TRANSPARENT for _ in range(size)] for _ in range(size)]


def blend(dst, src, alpha):
    if alpha <= 0:
        return dst
    if alpha >= 1:
        return (src[0], src[1], src[2], 255)
    r = int(dst[0] * (1 - alpha) + src[0] * alpha)
    g = int(dst[1] * (1 - alpha) + src[1] * alpha)
    b = int(dst[2] * (1 - alpha) + src[2] * alpha)
    a = int(dst[3] + (255 - dst[3]) * alpha)
    return (r, g, b, a)


def fill_round_rect(canvas, x0, y0, x1, y1, radius, color_at):
    """رسم مستطیل با گوشه‌های گرد؛ color_at(x, y) رنگ یا None برمی‌گرداند."""
    size = len(canvas)
    for y in range(max(0, y0), min(size, y1)):
        for x in range(max(0, x0), min(size, x1)):
            # بررسی گوشه‌ها
            cx = None
            cy = None
            if x < x0 + radius and y < y0 + radius:
                cx, cy = x0 + radius, y0 + radius
            elif x > x1 - radius - 1 and y < y0 + radius:
                cx, cy = x1 - radius - 1, y0 + radius
            elif x < x0 + radius and y > y1 - radius - 1:
                cx, cy = x0 + radius, y1 - radius - 1
            elif x > x1 - radius - 1 and y > y1 - radius - 1:
                cx, cy = x1 - radius - 1, y1 - radius - 1
            if cx is not None:
                dist = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
                if dist > radius + 0.5:
                    continue
                alpha = 1.0 if dist <= radius - 0.5 else max(0.0, radius + 0.5 - dist)
            else:
                alpha = 1.0
            color = color_at(x, y)
            if color is None:
                continue
            canvas[y][x] = blend(canvas[y][x], color, alpha)


def fill_rect(canvas, x0, y0, x1, y1, color):
    size = len(canvas)
    for y in range(max(0, y0), min(size, y1)):
        for x in range(max(0, x0), min(size, x1)):
            canvas[y][x] = blend(canvas[y][x], color, 1.0)


def fill_circle(canvas, cx, cy, radius, color):
    size = len(canvas)
    for y in range(max(0, cy - radius - 1), min(size, cy + radius + 2)):
        for x in range(max(0, cx - radius - 1), min(size, cx + radius + 2)):
            dist = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            if dist > radius + 0.5:
                continue
            canvas[y][x] = blend(canvas[y][x], color, 1.0 if dist <= radius - 0.5 else radius + 0.5 - dist)


def thick_line(canvas, x0, y0, x1, y1, width, color):
    steps = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
    for i in range(steps + 1):
        t = i / steps
        x = int(round(x0 + (x1 - x0) * t))
        y = int(round(y0 + (y1 - y0) * t))
        fill_circle(canvas, x, y, width // 2, color)


def draw_design(size, rounded=True, inset=0.0):
    """رسم طرح آیکون در اندازه دلخواه."""
    canvas = make_canvas(size)
    radius = int(size * 0.23) if rounded else 0
    pad = int(size * inset)
    x0, y0 = pad, pad
    x1, y1 = size - pad, size - pad

    def gradient_at(_x, y):
        t = (y - y0) / max(1, (y1 - y0))
        return (
            int(GREEN_TOP[0] + (GREEN_BOTTOM[0] - GREEN_TOP[0]) * t),
            int(GREEN_TOP[1] + (GREEN_BOTTOM[1] - GREEN_TOP[1]) * t),
            int(GREEN_TOP[2] + (GREEN_BOTTOM[2] - GREEN_TOP[2]) * t),
        )

    fill_round_rect(canvas, x0, y0, x1, y1, radius, gradient_at)

    # مقیاس نسبی برای قرار گرفتن طرح در ناحیه امن
    u = size / 64.0
    def sx(v):
        return int(pad + u * v * (1 - 2 * (pad / size)) if False else pad + (v / 64.0) * (size - 2 * pad))

    base_y = sx(49)
    # سه کارتن با ارتفاع افزایشی (نماد خرید عمده)
    fill_rect(canvas, sx(16), sx(35), sx(25), base_y, WHITE)
    fill_rect(canvas, sx(26.5), sx(28), sx(35.5), base_y, WHITE)
    fill_rect(canvas, sx(37), sx(21), sx(46), base_y, WHITE)
    # خط زیر کارتن‌ها
    thick_line(canvas, sx(13), base_y + int(2 * u), sx(49), base_y + int(2 * u), max(2, int(3 * u)), WHITE)
    # فلش رشد
    thick_line(canvas, sx(40), sx(16), sx(51), sx(8), max(2, int(3 * u)), AMBER)
    thick_line(canvas, sx(44), sx(8), sx(51), sx(8), max(2, int(3 * u)), AMBER)
    thick_line(canvas, sx(51), sx(8), sx(51), sx(15), max(2, int(3 * u)), AMBER)
    return canvas


def write_png(path, canvas):
    size = len(canvas)
    raw = bytearray()
    for row in canvas:
        raw.append(0)  # filter type 0
        for (r, g, b, a) in row:
            raw += bytes((r, g, b, a))

    def chunk(tag, data):
        out = struct.pack('>I', len(data)) + tag + data
        return out + struct.pack('>I', zlib.crc32(tag + data) & 0xFFFFFFFF)

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(bytes(raw), 9))
    png += chunk(b'IEND', b'')

    with open(path, 'wb') as f:
        f.write(png)
    print(f'✓ {path} ({len(png) // 1024} KB, {size}×{size})')


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_dir = os.path.join(root, 'public', 'icons')
    os.makedirs(out_dir, exist_ok=True)

    write_png(os.path.join(out_dir, 'icon-192.png'), draw_design(192))
    write_png(os.path.join(out_dir, 'icon-512.png'), draw_design(512))
    # نسخه maskable: پس‌زمینه تا لبه‌ها کشیده می‌شود و طرح کوچک‌تر (ناحیه امن) رسم می‌شود
    maskable = draw_design(512, rounded=False, inset=0.06)
    write_png(os.path.join(out_dir, 'maskable-512.png'), maskable)


if __name__ == '__main__':
    main()
