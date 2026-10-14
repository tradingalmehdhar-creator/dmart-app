#!/usr/bin/env python3
"""
Generate clean, two-color D-Mart PWA icon assets:
- Palette: #059669 (Emerald Green) and #ffffff (White)
- Feature: Large uppercase letter 'D' with the word 'mart' overlapping its edge (half inside, half outside)
Outputs:
- public/icon.svg
- public/favicon.svg
- public/favicon.ico
- public/icon-192x192.png
- public/icon-512x512.png
- public/icon-maskable-512x512.png
- public/apple-touch-icon.png (180x180)
- public/pwa-192x192.png
- public/pwa-512x512.png
- public/pwa-maskable-512x512.png
"""

import math
import os
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

def clamp(val, min_val=0.0, max_val=1.0):
    return max(min_val, min(max_val, val))

# Color definitions (strictly two colors)
COLOR_GREEN = (5, 150, 105)   # #059669
COLOR_WHITE = (255, 255, 255) # #ffffff

def is_inside_d(x, y):
    """Returns True if point (x, y) on 512x512 canvas is inside the large uppercase 'D'."""
    # Outer D shape
    # Left spine: x in [96, 220], y in [80, 432]
    # Right curved arc: center (220, 256). Radius in x is 160 (apex at x=380), radius in y is 176 (y in [80, 432]).
    in_outer = False
    if 96 <= x <= 220 and 80 <= y <= 432:
        in_outer = True
    elif x > 220 and 80 <= y <= 432:
        dx = x - 220.0
        dy = (y - 256.0) * (160.0 / 176.0)
        if dx * dx + dy * dy <= 160.0 * 160.0:
            in_outer = True

    if not in_outer:
        return False

    # Inner cutout (counter) of D
    # Left: x >= 176, y in [156, 356]
    # Right inner arc: center (220, 256), radius in x is 88 (apex at x=308), radius in y is 100
    in_inner = False
    if 176 <= x <= 220 and 156 <= y <= 356:
        in_inner = True
    elif x > 220 and 156 <= y <= 356:
        dx = x - 220.0
        dy = (y - 256.0) * (88.0 / 100.0)
        if dx * dx + dy * dy <= 88.0 * 88.0:
            in_inner = True

    return in_outer and not in_inner

def pill_dist(x, y, px, py, pw, ph, radius):
    """Signed distance to pill / capsule centered at px, py with width pw, height ph."""
    cx = px + pw / 2.0
    cy = py + ph / 2.0
    dx = abs(x - cx) - (pw / 2.0 - radius)
    dy = abs(y - cy) - (ph / 2.0 - radius)
    if dx > 0 and dy > 0:
        return math.hypot(dx, dy) - radius
    return max(dx, dy) - radius

# Bitmap font representation for 'm', 'a', 'r', 't'
# Rendered inside the pill badge centered at x=380, y=256
def is_inside_text_mart(x, y):
    """Checks if point (x, y) falls inside the vector glyphs of 'mart'."""
    # Badge is x in [270, 490], y in [218, 294]
    # Text baseline ~274, x-height ~40px (y from 232 to 272), ascenders (t) up to y=224
    if not (280 <= x <= 480 and 222 <= y <= 276):
        return False

    # Glyph boundaries:
    # 'm': x in [292, 344], y in [234, 272] (inside D)
    if 292 <= x <= 344 and 234 <= y <= 272:
        # 'm' has 3 vertical stems and 2 rounded top arches
        # stem 1: 292..300
        # stem 2: 314..322
        # stem 3: 336..344
        # top bar: y in [234, 242]
        if (292 <= x <= 300) or (314 <= x <= 322) or (336 <= x <= 344):
            return True
        if 234 <= y <= 242 and (292 <= x <= 344):
            return True
        return False

    # 'a': x in [354, 394], y in [234, 272] (straddles the x=380 edge: half inside 354..380, half outside 380..394)
    if 354 <= x <= 394 and 234 <= y <= 272:
        # 'a' has a right stem: 386..394, y in [234, 272]
        # outer circle/oval: center (372, 253), rx=18, ry=19
        # inner cutout: center (372, 253), rx=10, ry=11
        if 386 <= x <= 394:
            return True
        dx = (x - 372.0)
        dy = (y - 253.0)
        dist_outer = (dx / 18.0) ** 2 + (dy / 19.0) ** 2
        dist_inner = (dx / 10.0) ** 2 + (dy / 11.0) ** 2
        if dist_outer <= 1.0 and dist_inner >= 1.0:
            return True
        return False

    # 'r': x in [404, 434], y in [234, 272] (outside D)
    if 404 <= x <= 434 and 234 <= y <= 272:
        # vertical stem: 404..412, y in [234, 272]
        if 404 <= x <= 412:
            return True
        # right arch: y in [234, 244], x in [412, 434]
        if 234 <= y <= 244 and 412 <= x <= 434:
            return True
        return False

    # 't': x in [442, 468], y in [224, 272] (outside D)
    if 442 <= x <= 468 and 224 <= y <= 272:
        # vertical stem: 447..455, y in [224, 268]
        if 447 <= x <= 455 and 224 <= y <= 268:
            return True
        # crossbar: y in [234, 242], x in [442, 466]
        if 234 <= y <= 242 and 442 <= x <= 466:
            return True
        # bottom curve: y in [264, 272], x in [447, 468]
        if 264 <= y <= 272 and 447 <= x <= 468:
            return True
        return False

    return False

def render_icon(target_size, is_maskable=False):
    """Renders clean two-color D-Mart icon with 4x4 supersampling anti-aliasing."""
    width = target_size
    height = target_size
    pixels = bytearray(width * height * 4)

    # Scale and center
    # Canvas base coordinate is 512x512
    scale = 0.76 if is_maskable else 1.0
    corner_radius = 0.0 if is_maskable else (target_size * 0.22)

    # Pill badge coordinates on 512 base:
    # x in [270, 490], y in [218, 294], width=220, height=76, radius=38
    # Edge of D is at x=380, so 110px inside, 110px outside
    pill_x = 270.0
    pill_y = 218.0
    pill_w = 220.0
    pill_h = 76.0
    pill_r = 38.0
    pill_stroke = 7.0

    # 4x4 supersampling grid offsets
    sub_offsets = [
        (0.125, 0.125), (0.375, 0.125), (0.625, 0.125), (0.875, 0.125),
        (0.125, 0.375), (0.375, 0.375), (0.625, 0.375), (0.875, 0.375),
        (0.125, 0.625), (0.375, 0.625), (0.625, 0.625), (0.875, 0.625),
        (0.125, 0.875), (0.375, 0.875), (0.625, 0.875), (0.875, 0.875),
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

                # Background round-rect test
                if is_maskable:
                    bg_hit = True
                else:
                    # Distance to rounded rect boundary
                    cx = target_size / 2.0
                    cy = target_size / 2.0
                    dx = abs(sx - cx) - (target_size / 2.0 - corner_radius)
                    dy = abs(sy - cy) - (target_size / 2.0 - corner_radius)
                    dist = math.hypot(max(dx, 0.0), max(dy, 0.0)) - corner_radius if (dx > 0 and dy > 0) else max(dx, dy) - corner_radius
                    bg_hit = (dist <= 0.0)

                if not bg_hit:
                    continue  # Transparent outside icon boundary

                # Default color is D-Mart emerald green
                r, g, b = COLOR_GREEN

                # Map to 512x512 base coordinates
                base_x = (sx - width / 2.0) / scale + 256.0
                base_y = (sy - height / 2.0) / scale + 256.0

                # 1. Test uppercase 'D' (white)
                if is_inside_d(base_x, base_y):
                    r, g, b = COLOR_WHITE

                # 2. Test pill badge overlapping the edge of 'D'
                # Pill center is at x=380, y=256
                # Left half (x < 380) is inside D; Right half (x >= 380) is outside D
                p_dist = pill_dist(base_x, base_y, pill_x, pill_y, pill_w, pill_h, pill_r)
                if p_dist <= 0.0:
                    # Inside pill
                    if p_dist >= -pill_stroke:
                        # White outline stroke around the pill
                        r, g, b = COLOR_WHITE
                    else:
                        # Inner fill of pill: Green background
                        r, g, b = COLOR_GREEN

                        # Check if text "mart" is present here (white)
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

def create_svg():
    return '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- Clean Two-Color Vector Icon: Emerald Green (#059669) & Pure White (#ffffff) -->
  <rect width="512" height="512" rx="112" fill="#059669"/>

  <!-- Large Uppercase Letter "D" -->
  <path d="M 96 80 L 220 80 C 320 80 380 150 380 256 C 380 362 320 432 220 432 L 96 432 Z M 176 156 L 176 356 L 220 356 C 280 356 308 316 308 256 C 308 196 280 156 220 156 Z" fill="#ffffff"/>

  <!-- "mart" Pill Badge Overlapping Edge of "D" (Half Inside x:270..380, Half Outside x:380..490) -->
  <rect x="270" y="218" width="220" height="76" rx="38" fill="#059669" stroke="#ffffff" stroke-width="8"/>

  <!-- "mart" Text Centered Exactly on the Edge (x=380, y=256) -->
  <text x="380" y="273" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="52" font-weight="900" fill="#ffffff" text-anchor="middle" letter-spacing="-1">mart</text>
</svg>
'''

def main():
    target_dir = os.path.join(os.path.dirname(__file__), '..', 'public')
    os.makedirs(target_dir, exist_ok=True)

    # 1. Write SVG vector icon files
    svg_content = create_svg()
    for svg_name in ['icon.svg', 'favicon.svg']:
        svg_path = os.path.join(target_dir, svg_name)
        with open(svg_path, 'w', encoding='utf-8') as f:
            f.write(svg_content)
        print(f"Generated {svg_name} ({len(svg_content)} bytes)")

    # 2. Render high-resolution PNG icon files
    tasks = [
        ('icon-192x192.png', 192, False),
        ('icon-512x512.png', 512, False),
        ('icon-maskable-512x512.png', 512, True),
        ('apple-touch-icon.png', 180, False),
        ('pwa-192x192.png', 192, False),
        ('pwa-512x512.png', 512, False),
        ('pwa-maskable-512x512.png', 512, True),
    ]

    for fname, size, is_maskable in tasks:
        out_path = os.path.join(target_dir, fname)
        print(f"Rendering {fname} ({size}x{size}, maskable={is_maskable})...")
        png_data = render_icon(size, is_maskable=is_maskable)
        with open(out_path, 'wb') as f:
            f.write(png_data)
        print(f"Saved {fname} ({len(png_data)} bytes)")

    # 3. Generate favicon.ico (multi-resolution / 48x48)
    fav_png = render_icon(48, is_maskable=False)
    ico_data = encode_ico(fav_png, 48, 48)
    ico_path = os.path.join(target_dir, 'favicon.ico')
    with open(ico_path, 'wb') as f:
        f.write(ico_data)
    print(f"Generated favicon.ico ({len(ico_data)} bytes)")

if __name__ == '__main__':
    main()
