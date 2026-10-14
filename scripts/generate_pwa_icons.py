#!/usr/bin/env python3
"""
Generate high-resolution D-Mart PWA icon assets with the new two-color vector design:
- A large, bold uppercase letter "D"
- The word "mart" written in a smaller font overlapping the edge/side of the "D" (half inside, half outside)
- Two distinct colors: Primary Brand Green (#059669 / #047857) + Contrasting Dark Charcoal (#0f172a) / White (#ffffff)
- Generates:
    - icon-192x192.png
    - icon-512x512.png
    - icon-maskable-512x512.png
    - apple-touch-icon.png (180x180)
    - pwa-192x192.png
    - pwa-512x512.png
    - pwa-maskable-512x512.png
"""
import os
import subprocess

FONT_PATH = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
PUBLIC_DIR = os.path.join(os.path.dirname(__file__), "..", "public")

def generate_standard_icon_512(out_path):
    """
    Renders 512x512 standard icon with rounded squircle, large bold D,
    and dark charcoal pill badge with white "mart" overlapping the edge.
    D outer edge at y=256 is x=340.
    Pill is x=255..425 (width 170): 85px inside D, 85px outside D.
    Text "mart" is centered at x=340, y=256.
    """
    cmd = [
        "convert", "-size", "512x512", "xc:none",
        # Primary Brand Green squircle background
        "-fill", "#059669", "-draw", "roundrectangle 0,0,512,512,112,112",
        "-stroke", "#10b981", "-strokewidth", "4", "-fill", "none",
        "-draw", "roundrectangle 8,8,504,504,104,104",
        "-stroke", "none",
        # Drop shadow layer
        "(", "-size", "512x512", "xc:none",
        "-fill", "#022c22",
        "-draw", "path \"M 80,116 L 195,116 C 295,116 340,171 340,262 C 340,353 295,408 195,408 L 80,408 Z M 150,184 L 190,184 C 248,184 275,214 275,262 C 275,310 248,340 190,340 L 150,340 Z\"",
        "-draw", "roundrectangle 255,222,425,302,40,40",
        "-blur", "0x8",
        ")",
        "-compose", "over", "-composite",
        # Large bold uppercase letter "D" in pure crisp white
        "-fill", "#ffffff",
        "-draw", "path \"M 80,110 L 195,110 C 295,110 340,165 340,256 C 340,347 295,402 195,402 L 80,402 Z M 150,178 L 190,178 C 248,178 275,208 275,256 C 275,304 248,334 190,334 L 150,334 Z\"",
        # Dark charcoal pill overlapping the edge (half inside D, half outside D)
        "-fill", "#0f172a", "-stroke", "#ffffff", "-strokewidth", "6",
        "-draw", "roundrectangle 255,216,425,296,40,40",
        # Smaller font "mart" written across the center
        "-stroke", "none", "-fill", "#ffffff", "-font", FONT_PATH, "-pointsize", "56",
        "-gravity", "northwest", "-annotate", "+278+223", "mart",
        out_path
    ]
    subprocess.run(cmd, check=True)

def generate_maskable_icon_512(out_path):
    """
    Renders 512x512 maskable icon:
    Full-bleed square emerald background (#059669),
    with emblem scaled by 72% into the Android safe-zone circle (diameter 410px).
    """
    cmd = [
        "convert",
        "-size", "512x512", "canvas:#059669",
        "(",
        "-size", "512x512", "xc:none",
        "-fill", "#ffffff",
        "-draw", "path \"M 80,110 L 195,110 C 295,110 340,165 340,256 C 340,347 295,402 195,402 L 80,402 Z M 150,178 L 190,178 C 248,178 275,208 275,256 C 275,304 248,334 190,334 L 150,334 Z\"",
        "-fill", "#0f172a", "-stroke", "#ffffff", "-strokewidth", "6",
        "-draw", "roundrectangle 255,216,425,296,40,40",
        "-stroke", "none", "-fill", "#ffffff", "-font", FONT_PATH, "-pointsize", "56",
        "-gravity", "northwest", "-annotate", "+278+223", "mart",
        "-resize", "72%",
        ")",
        "-gravity", "center", "-composite",
        out_path
    ]
    subprocess.run(cmd, check=True)

def resize_icon(src_path, out_path, size):
    """Resize high-res icon to target size with Lanczos resampling."""
    cmd = [
        "convert", src_path,
        "-filter", "Lanczos",
        "-resize", f"{size}x{size}",
        out_path
    ]
    subprocess.run(cmd, check=True)

def main():
    os.makedirs(PUBLIC_DIR, exist_ok=True)

    std_512 = os.path.join(PUBLIC_DIR, "icon-512x512.png")
    mask_512 = os.path.join(PUBLIC_DIR, "icon-maskable-512x512.png")
    std_192 = os.path.join(PUBLIC_DIR, "icon-192x192.png")
    apple_touch = os.path.join(PUBLIC_DIR, "apple-touch-icon.png")

    print("1. Generating icon-512x512.png...")
    generate_standard_icon_512(std_512)

    print("2. Generating icon-maskable-512x512.png...")
    generate_maskable_icon_512(mask_512)

    print("3. Generating icon-192x192.png...")
    resize_icon(std_512, std_192, 192)

    print("4. Generating apple-touch-icon.png (180x180)...")
    resize_icon(std_512, apple_touch, 180)

    # Sync aliases for PWA manifest
    pwa_512 = os.path.join(PUBLIC_DIR, "pwa-512x512.png")
    pwa_192 = os.path.join(PUBLIC_DIR, "pwa-192x192.png")
    pwa_mask = os.path.join(PUBLIC_DIR, "pwa-maskable-512x512.png")

    import shutil
    shutil.copyfile(std_512, pwa_512)
    shutil.copyfile(std_192, pwa_192)
    shutil.copyfile(mask_512, pwa_mask)

    print("All PWA PNG icons generated successfully!")

if __name__ == "__main__":
    main()
