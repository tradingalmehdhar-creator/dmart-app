#!/usr/bin/env python3
"""
Force generate and overwrite all D-Mart app icon files and SVG logos:
- favicon.ico
- apple-touch-icon.png
- icon-192.png & icon-192x192.png
- icon-512.png & icon-512x512.png
- icon-maskable-512.png & icon-maskable-512x512.png
- public/icon.svg, public/favicon.svg, public/logo.svg
- src/logo.svg, src/icon.svg
"""

import math
import os
import shutil
import struct
import zlib

def encode_png(width, height, pixel_buffer):
    """Encodes RGBA pixel buffer into standard PNG format."""
    raw_rows = bytearray()
    row_bytes = width * 4
    for y in range(height):
        raw_rows.append(0)  # Filter type 0: None
        start = y * row_bytes
        raw_rows.extend(pixel_buffer[start:start + row_bytes])

    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff)

    header = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0))
    idat = chunk(b'IDAT', zlib.compress(bytes(raw_rows), 9))
    iend = chunk(b'IEND', b'')
    return header + ihdr + idat + iend

def encode_ico(png_data, width, height):
    """Encodes PNG into standard Windows ICO file format."""
    header = struct.pack('<HHH', 0, 1, 1)  # reserved 0, type 1 (icon), 1 image
    w_byte = width if width < 256 else 0
    h_byte = height if height < 256 else 0
    entry = struct.pack(
        '<BBBBHHII',
        w_byte,
        h_byte,
        0,     # colors
        0,     # reserved
        1,     # color planes
        32,    # bits per pixel
        len(png_data),
        22     # offset (6 header + 16 entry = 22)
    )
    return header + entry + png_data

# Brand palette: clean two-color
COLOR_GREEN = (5, 150, 105)   # #059669
COLOR_WHITE = (255, 255, 255) # #ffffff

def is_inside_d(x, y):
    """Check if (x,y) on 512x512 base is inside uppercase 'D'."""
    # Outer D:
    # Spine: x in [88, 220], y in [80, 432]
    # Curve: center (220, 256), rx=156, ry=176 (apex at x=376)
    in_outer = False
    if 88 <= x <= 220 and 80 <= y <= 432:
        in_outer = True
    elif x > 220 and 80 <= y <= 432:
        dx = x - 220.0
        dy = (y - 256.0) * (156.0 / 176.0)
        if dx * dx + dy * dy <= 156.0 * 156.0:
            in_outer = True

    if not in_outer:
        return False

    # Inner cutout (counter):
    # Left: x in [168, 220], y in [156, 356]
    # Curve: center (220, 256), rx=76, ry=100 (apex at x=296)
    in_inner = False
    if 168 <= x <= 220 and 156 <= y <= 356:
        in_inner = True
    elif x > 220 and 156 <= y <= 356:
        dx = x - 220.0
        dy = (y - 256.0) * (76.0 / 100.0)
        if dx * dx + dy * dy <= 76.0 * 76.0:
            in_inner = True

    return in_outer and not in_inner

def pill_dist(x, y, px, py, pw, ph, radius):
    cx = px + pw / 2.0
    cy = py + ph / 2.0
    dx = abs(x - cx) - (pw / 2.0 - radius)
    dy = abs(y - cy) - (ph / 2.0 - radius)
    if dx > 0 and dy > 0:
        return math.hypot(dx, dy) - radius
    return max(dx, dy) - radius

def is_inside_text_mart(x, y):
    """Vectorized glyph layout for lowercase 'mart' centered at x=376, y=256."""
    if not (284 <= x <= 468 and 224 <= y <= 276):
        return False

    # 'm': x in [292, 344], y in [234, 272] (inside D)
    if 292 <= x <= 344 and 234 <= y <= 272:
        if (292 <= x <= 300) or (314 <= x <= 322) or (336 <= x <= 344):
            return True
        if 234 <= y <= 242:
            return True
        return False

    # 'a': x in [354, 394], y in [234, 272] (straddles the x=376 edge)
    if 354 <= x <= 394 and 234 <= y <= 272:
        if 386 <= x <= 394:
            return True
        dx = (x - 372.0)
        dy = (y - 253.0)
        if (dx / 18.0) ** 2 + (dy / 19.0) ** 2 <= 1.0 and (dx / 10.0) ** 2 + (dy / 11.0) ** 2 >= 1.0:
            return True
        return False

    # 'r': x in [404, 434], y in [234, 272] (outside D)
    if 404 <= x <= 434 and 234 <= y <= 272:
        if 404 <= x <= 412:
            return True
        if 234 <= y <= 244 and 412 <= x <= 434:
            return True
        return False

    # 't': x in [442, 468], y in [224, 272] (outside D)
    if 442 <= x <= 468 and 224 <= y <= 272:
        if 447 <= x <= 455 and 224 <= y <= 268:
            return True
        if 234 <= y <= 242 and 442 <= x <= 466:
            return True
        if 264 <= y <= 272 and 447 <= x <= 468:
            return True
        return False

    return False

def render_icon(target_size, is_maskable=False):
    width = target_size
    height = target_size
    pixels = bytearray(width * height * 4)

    scale = 0.76 if is_maskable else 1.0
    corner_radius = 0.0 if is_maskable else (target_size * 0.22)

    # Pill badge coordinates: center is x=376, y=256
    pill_x = 264.0
    pill_y = 214.0
    pill_w = 224.0
    pill_h = 84.0
    pill_r = 42.0
    pill_stroke = 7.0

    # 2x2 supersampling for fast, high-quality anti-aliasing
    sub_offsets = [
        (0.25, 0.25), (0.75, 0.25),
        (0.25, 0.75), (0.75, 0.75),
    ]
    num_samples = len(sub_offsets)

    for py in range(height):
        for px in range(width):
            total_r = 0
            total_g = 0
            total_b = 0
            total_a = 0

            for ox, oy in sub_offsets:
                sx = px + ox
                sy = py + oy

                if is_maskable:
                    bg_hit = True
                else:
                    cx = target_size / 2.0
                    cy = target_size / 2.0
                    dx = abs(sx - cx) - (target_size / 2.0 - corner_radius)
                    dy = abs(sy - cy) - (target_size / 2.0 - corner_radius)
                    dist = math.hypot(max(dx, 0.0), max(dy, 0.0)) - corner_radius if (dx > 0 and dy > 0) else max(dx, dy) - corner_radius
                    bg_hit = (dist <= 0.0)

                if not bg_hit:
                    continue

                r, g, b = COLOR_GREEN

                base_x = (sx - width / 2.0) / scale + 256.0
                base_y = (sy - height / 2.0) / scale + 256.0

                if is_inside_d(base_x, base_y):
                    r, g, b = COLOR_WHITE

                p_dist = pill_dist(base_x, base_y, pill_x, pill_y, pill_w, pill_h, pill_r)
                if p_dist <= 0.0:
                    if p_dist >= -pill_stroke:
                        r, g, b = COLOR_WHITE
                    else:
                        r, g, b = COLOR_GREEN
                        if is_inside_text_mart(base_x, base_y):
                            r, g, b = COLOR_WHITE

                total_r += r
                total_g += g
                total_b += b
                total_a += 255

            idx = (py * width + px) * 4
            pixels[idx] = total_r // num_samples
            pixels[idx + 1] = total_g // num_samples
            pixels[idx + 2] = total_b // num_samples
            pixels[idx + 3] = total_a // num_samples

    return encode_png(width, height, pixels)

def create_svg_content():
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- D-Mart Two-Color Vector Icon: Emerald Green (#059669) & Pure White (#ffffff) -->
  <rect width="512" height="512" rx="112" fill="#059669"/>

  <!-- Large Uppercase Letter "D" -->
  <path d="M 88 80 L 220 80 C 320 80 376 150 376 256 C 376 362 320 432 220 432 L 88 432 Z M 168 156 L 168 356 L 220 356 C 280 356 296 316 296 256 C 296 196 280 156 220 156 Z" fill="#ffffff"/>

  <!-- "mart" Pill Badge Overlapping Edge of "D" (Half Inside x:264..376, Half Outside x:376..488) -->
  <rect x="264" y="214" width="224" height="84" rx="42" fill="#059669" stroke="#ffffff" stroke-width="8"/>

  <!-- "mart" Text Centered on the Edge (x=376, y=256) -->
  <text x="376" y="274" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="56" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="-1">mart</text>
</svg>
'''

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    pub_dir = os.path.join(base_dir, 'public')
    src_dir = os.path.join(base_dir, 'src')
    os.makedirs(pub_dir, exist_ok=True)
    os.makedirs(src_dir, exist_ok=True)

    # 1. Update SVG logos in public/ and src/
    svg_data = create_svg_content()
    svg_targets = [
        os.path.join(pub_dir, 'icon.svg'),
        os.path.join(pub_dir, 'favicon.svg'),
        os.path.join(pub_dir, 'logo.svg'),
        os.path.join(src_dir, 'logo.svg'),
        os.path.join(src_dir, 'icon.svg'),
    ]
    for target in svg_targets:
        with open(target, 'w', encoding='utf-8') as f:
            f.write(svg_data)
        print(f"Generated SVG: {os.path.relpath(target, base_dir)}")

    # 2. Render PNG icons in public/
    png_192 = render_icon(192, is_maskable=False)
    png_512 = render_icon(512, is_maskable=False)
    png_maskable_512 = render_icon(512, is_maskable=True)
    png_apple = render_icon(180, is_maskable=False)
    png_fav = render_icon(48, is_maskable=False)
    ico_data = encode_ico(png_fav, 48, 48)

    # Map outputs
    files_to_write = {
        'icon-192.png': png_192,
        'icon-192x192.png': png_192,
        'pwa-192.png': png_192,
        'pwa-192x192.png': png_192,
        'icon-512.png': png_512,
        'icon-512x512.png': png_512,
        'pwa-512.png': png_512,
        'pwa-512x512.png': png_512,
        'icon-maskable-512.png': png_maskable_512,
        'icon-maskable-512x512.png': png_maskable_512,
        'apple-touch-icon.png': png_apple,
        'favicon.ico': ico_data,
    }

    for fname, data in files_to_write.items():
        filepath = os.path.join(pub_dir, fname)
        with open(filepath, 'wb') as f:
            f.write(data)
        print(f"Wrote {fname} ({len(data)} bytes)")

    print("All icon files successfully generated!")

if __name__ == '__main__':
    main()
