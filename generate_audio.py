#!/usr/bin/env python3
"""
generate_audio.py — Per-queue audio generator for SIANFIS.

Generates ONE MP3 per queue number per counter (500 files total).
Files are skipped if they already exist (safe to re-run).

Usage:
    python generate_audio.py              # skip existing files
    python generate_audio.py --force      # regenerate all

Output  (storage/app/public/audio/):
    ip-001.mp3 … ip-100.mp3
    ap-001.mp3 … ap-100.mp3
    ik1-001.mp3 … ik1-100.mp3
    ik2-001.mp3 … ik2-100.mp3
    ktu-001.mp3 … ktu-100.mp3

Requirement:
    pip install edge-tts

After generation:
    php artisan storage:link
"""

import os
import sys
import asyncio
import edge_tts

# ── Config ─────────────────────────────────────────────────────────────────────

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR  = os.path.join(SCRIPT_DIR, "storage", "app", "public", "audio")

VOICE = "id-ID-GadisNeural"
RATE  = "-10%"

COUNTERS = [
    ("IP",  "Ilmu Pemerintahan"),
    ("AP",  "Administrasi Publik"),
    ("IK1", "Ilmu Komunikasi 1"),
    ("IK2", "Ilmu Komunikasi 2"),
    ("KTU", "KTU"),
]

# ── Generator ──────────────────────────────────────────────────────────────────

async def generate_one(code: str, name: str, num: str, force: bool) -> bool:
    filename = f"{code.lower()}-{num}.mp3"
    path     = os.path.join(OUTPUT_DIR, filename)

    if not force and os.path.exists(path) and os.path.getsize(path) > 0:
        return False  # skipped

    text = f"Nomor antrian {code} {num}, silakan menuju loket {name}"

    try:
        communicate = edge_tts.Communicate(text=text, voice=VOICE, rate=RATE)
        await communicate.save(path)
        print(f"  [OK]  {filename}")
        return True
    except Exception as exc:
        print(f"  [ERR] {filename}  → {exc}")
        return False


async def generate_counter(code: str, name: str, force: bool) -> dict:
    print(f"\n[{code}]  {name}")
    generated = skipped = errors = 0

    for n in range(1, 101):
        num = str(n).zfill(3)
        result = await generate_one(code, name, num, force)
        if result is True:
            generated += 1
        elif result is False:
            skipped += 1
        else:
            errors += 1

    print(f"  → generated: {generated}  skipped: {skipped}  errors: {errors}")
    return {"generated": generated, "skipped": skipped, "errors": errors}


# ── Main ───────────────────────────────────────────────────────────────────────

async def main() -> None:
    force = "--force" in sys.argv

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    bar = "═" * 56
    print(bar)
    print("  SIANFIS — Per-Queue Audio Generator")
    print(f"  Output : {OUTPUT_DIR}")
    print(f"  Voice  : {VOICE}   Rate: {RATE}")
    print(f"  Files  : {len(COUNTERS)} counters × 100 numbers = 500 files")
    print(f"  Mode   : {'FORCE — regenerate all' if force else 'skip existing files'}")
    print(bar)

    total_generated = total_skipped = total_errors = 0

    for code, name in COUNTERS:
        result = await generate_counter(code, name, force)
        total_generated += result["generated"]
        total_skipped   += result["skipped"]
        total_errors    += result["errors"]

    print(f"\n{bar}")
    print(f"  Generated : {total_generated}")
    print(f"  Skipped   : {total_skipped}  (already exist)")
    print(f"  Errors    : {total_errors}")
    print(f"  Total     : {total_generated + total_skipped + total_errors} / 500")
    print(f"\n  Next steps:")
    print(f"    php artisan storage:link")
    print(f"    http://localhost/storage/audio/ip-001.mp3")
    print(bar)

    if total_errors:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
