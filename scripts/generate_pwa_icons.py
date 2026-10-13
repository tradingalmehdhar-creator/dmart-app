#!/usr/bin/env python3
"""
Generate crisp, high-resolution D-Mart PWA icon assets:
- icon-192x192.png
- icon-512x512.png
- icon-maskable-512x512.png
- apple-touch-icon.png (180x180)
- pwa-192x192.png
- pwa-512x512.png
"""
import math
import os
import struct
import zlib

def encode_png(width, height, pixel_buffer):
    """Encodes RGBA pixel buffer into standard PNG byte string."""
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

def clamp(val, min_val=0.0, max_val=1.0):
    return max(min_val, min(max_val, val))

def blend(fg, bg, alpha):
    """Alpha blend fg (RGBA 0-255) over bg (RGBA 0-255)"""
    a = fg[3] / 255.0 * alpha
    out_a = a + (bg[3] / 255.0) * (1.0 - a)
    if out_a <= 0.001:
        return (0, 0, 0, 0)
    r = int((fg[0] * a + bg[0] * (bg[3] / 255.0) * (1.0 - a)) / out_a)
    g = int((fg[1] * a + bg[1] * (bg[3] / 255.0) * (1.0 - a)) / out_a)
    b = int((fg[2] * a + bg[2] * (bg[3] / 255.0) * (1.0 - a)) / out_a)
    return (clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255), int(out_a * 255))

def rounded_rect_dist(x, y, w, h, rx, ry, rw, rh, radius):
    """Signed distance to rounded rectangle. Negative inside, positive outside."""
    cx = rx + rw / 2.0
    cy = ry + rh / 2.0
    dx = abs(x - cx) - (rw / 2.0 - radius)
    dy = abs(y - cy) - (rh / 2.0 - radius)
    if dx > 0 and dy > 0:
        return math.hypot(dx, dy) - radius
    return max(dx, dy) - radius

def render_dmart_icon(size, is_maskable=False):
    width = size
    height = size
    pixels = bytearray(width * height * 4)

    # Scale factor for emblem
    scale = 0.65 if is_maskable else 0.82
    center_x = width / 2.0
    center_y = height / 2.0

    # Background round rect parameters
    corner_radius = size * 0.22 if not is_maskable else 0.0

    # Precalculate gradient colors
    top_color = (16, 185, 129)     # #10b981 vibrant emerald
    bottom_color = (4, 120, 87)    # #047857 deep emerald

    for y in range(height):
        v = y / float(height - 1)
        # Background gradient
        bg_r = int(top_color[0] + (bottom_color[0] - top_color[0]) * v)
        bg_g = int(top_color[1] + (bottom_color[1] - top_color[1]) * v)
        bg_b = int(top_color[2] + (bottom_color[2] - top_color[2]) * v)

        for x in range(width):
            # Calculate distance to icon boundary
            if is_maskable:
                # Full bleed square
                bg_alpha = 1.0
            else:
                dist = rounded_rect_dist(x, y, width, height, 0, 0, width, height, corner_radius)
                # Anti-aliasing border
                if dist <= -0.5:
                    bg_alpha = 1.0
                elif dist >= 0.5:
                    bg_alpha = 0.0
                else:
                    bg_alpha = clamp(0.5 - dist)

            if bg_alpha <= 0.0:
                idx = (y * width + x) * 4
                pixels[idx:idx+4] = (0, 0, 0, 0)
                continue

            current_pixel = (bg_r, bg_g, bg_b, int(bg_alpha * 255))

            # Transform into normalized emblem space: [-1, 1] relative to center
            ex = (x - center_x) / (center_x * scale)
            ey = (y - center_y) / (center_y * scale)

            # Draw "D" emblem:
            # Outer boundary of D:
            # Flat left back from ex = -0.6 to -0.2
            # Semicircular bulge from ex = -0.2 to +0.65
            # Top at ey = -0.7, bottom at ey = +0.7
            emblem_alpha = 0.0
            shadow_alpha = 0.0

            # Distance field for 'D' outer shape:
            def d_outer_dist(px, py):
                # Vertical spine on left: px in [-0.62, 0.0], py in [-0.7, 0.7]
                # Right curved loop: center at (0.0, 0.0), radius 0.7
                if py < -0.7 or py > 0.7:
                    # distance to top/bottom caps
                    clamped_y = clamp(py, -0.7, 0.7)
                    dy_cap = abs(py - clamped_y)
                    if px < 0.0:
                        clamped_x = clamp(px, -0.62, 0.0)
                        return math.hypot(px - clamped_x, dy_cap)
                    else:
                        rad = math.hypot(px, clamped_y)
                        if rad > 0.7:
                            return math.hypot(rad - 0.7, dy_cap)
                        return dy_cap
                if px <= 0.0:
                    dx_left = -0.62 - px
                    return max(dx_left, abs(py) - 0.7)
                else:
                    rad = math.hypot(px, py)
                    return rad - 0.7

            def d_inner_dist(px, py):
                # Cutout inside D:
                # Vertical spine left: px = -0.22, right loop center at (0.0, 0.0) with radius 0.38
                # Top/bottom caps at py = -0.38 to +0.38
                if py < -0.38 or py > 0.38:
                    clamped_y = clamp(py, -0.38, 0.38)
                    dy_cap = abs(py - clamped_y)
                    if px < 0.0:
                        clamped_x = clamp(px, -0.22, 0.0)
                        return math.hypot(px - clamped_x, dy_cap)
                    else:
                        rad = math.hypot(px, clamped_y)
                        return math.hypot(rad - 0.38, dy_cap)
                if px <= 0.0:
                    dx_left = -0.22 - px
                    return max(dx_left, abs(py) - 0.38)
                else:
                    rad = math.hypot(px, py)
                    return rad - 0.38

            # Pixel distance in scaled emblem space
            # 1 unit in emblem space = (center_x * scale) pixels
            pixel_scale = center_x * scale
            outer_dist_px = d_outer_dist(ex, ey) * pixel_scale
            inner_dist_px = d_inner_dist(ex, ey) * pixel_scale

            # Outside D outer or inside D inner:
            # We want outer_dist_px <= 0 and inner_dist_px >= 0
            if outer_dist_px < 1.0 and inner_dist_px > -1.0:
                cov_outer = clamp(0.5 - outer_dist_px)
                cov_inner = clamp(0.5 + inner_dist_px)
                emblem_alpha = min(cov_outer, cov_inner)

            # Drop shadow for emblem (offset by ex, ey + 0.06):
            sh_outer = d_outer_dist(ex, ey - 0.05) * pixel_scale
            sh_inner = d_inner_dist(ex, ey - 0.05) * pixel_scale
            if sh_outer < 2.0 and sh_inner > -2.0:
                cov_sh_outer = clamp(1.0 - sh_outer / 2.0)
                cov_sh_inner = clamp(1.0 + sh_inner / 2.0)
                shadow_alpha = min(cov_sh_outer, cov_sh_inner) * 0.25

            # Fresh grocery leaf motif at top-right (ex around 0.45, ey around -0.65)
            # Two crossed oval leaves in bright lime/yellow (#a3e635)
            leaf_alpha = 0.0
            lx = ex - 0.42
            ly = ey + 0.62
            # Leaf angle ~ 35 degrees
            rad_l1 = math.hypot(lx * 1.5 - ly, ly * 1.5 + lx)
            if rad_l1 < 0.22:
                leaf_dist = (rad_l1 - 0.22) * pixel_scale
                leaf_alpha = clamp(0.5 - leaf_dist)

            # Apply shadow first
            if shadow_alpha > 0.0 and emblem_alpha < 0.99:
                current_pixel = blend((0, 40, 25, 255), current_pixel, shadow_alpha)

            # Apply white D monogram
            if emblem_alpha > 0.0:
                current_pixel = blend((255, 255, 255, 255), current_pixel, emblem_alpha)

            # Apply green grocery leaf
            if leaf_alpha > 0.0:
                current_pixel = blend((163, 230, 53, 255), current_pixel, leaf_alpha)

            idx = (y * width + x) * 4
            pixels[idx] = current_pixel[0]
            pixels[idx+1] = current_pixel[1]
            pixels[idx+2] = current_pixel[2]
            pixels[idx+3] = current_pixel[3]

    return encode_png(width, height, pixels)

def main():
    target_dir = os.path.join(os.path.dirname(__file__), '..', 'public')
    os.makedirs(target_dir, exist_ok=True)

    icons = [
        ('icon-192x192.png', 192, False),
        ('icon-512x512.png', 512, False),
        ('icon-maskable-512x512.png', 512, True),
        ('apple-touch-icon.png', 180, False),
        ('pwa-192x192.png', 192, False),
        ('pwa-512x512.png', 512, False),
        ('pwa-maskable-512x512.png', 512, True),
    ]

    for fname, size, is_maskable in icons:
        out_path = os.path.join(target_dir, fname)
        print(f"Generating {fname} ({size}x{size}, maskable={is_maskable})...")
        png_data = render_dmart_icon(size, is_maskable=is_maskable)
        with open(out_path, 'wb') as f:
            f.write(png_data)
        print(f"Saved {fname} ({len(png_data)} bytes)")

if __name__ == '__main__':
    main()
