import os
import asyncio
import edge_tts

# ── Config ──────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(SCRIPT_DIR, 'storage', 'app', 'public', 'audio')

VOICE = "id-ID-GadisNeural"   # suara perempuan Indonesia
RATE  = "-5%"                 # sedikit lebih lambat (natural)

# ── Konfigurasi antrian — sesuaikan dengan layanan yang ada ─────────────────
# Prefix layanan (huruf kapital, bisa multi-huruf: 'CK', 'AP', dll)
PREFIXES      = ['A', 'B', 'C', 'CK', 'AP']
NUMBER_RANGE  = range(1, 100)   # 001 – 099  (sesuaikan kebutuhan)
LOKETS        = range(1, 11)    # loket 1 – 10

# ── Helpers ─────────────────────────────────────────────────────────────────
DIGIT_WORDS = ['nol','satu','dua','tiga','empat','lima','enam','tujuh','delapan','sembilan']
LOKET_WORDS = ['','satu','dua','tiga','empat','lima','enam','tujuh','delapan','sembilan','sepuluh']

def spell_number(n, zero_pad=3):
    """001 → 'nol nol satu'"""
    return ' '.join(DIGIT_WORDS[int(d)] for d in str(n).zfill(zero_pad))

def spell_prefix(prefix):
    """'CK' → 'C K'  |  'A' → 'A'"""
    return ' '.join(list(prefix.upper()))

def make_sentence(prefix, number, loket):
    """Full natural sentence for edge_tts."""
    return (
        f"Nomor antrian {spell_prefix(prefix)}, "
        f"{spell_number(number)}, "
        f"silakan menuju loket {LOKET_WORDS[loket]}"
    )

def make_filename(prefix, number, loket):
    """'A', 1, 1 → 'a-001_loket1.mp3'"""
    code = f"{prefix.lower()}-{number:03d}"
    return f"{code}_loket{loket}.mp3"

# ── Build full catalogue ─────────────────────────────────────────────────────
def build_catalogue():
    entries = []
    for prefix in PREFIXES:
        for number in NUMBER_RANGE:
            for loket in LOKETS:
                filename = make_filename(prefix, number, loket)
                sentence = make_sentence(prefix, number, loket)
                entries.append((filename, sentence))
    return entries

# ── Generate ─────────────────────────────────────────────────────────────────
async def generate():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    catalogue = build_catalogue()

    print(f"[DIR]   {OUTPUT_DIR}")
    print(f"[VOICE] {VOICE}")
    print(f"[TOTAL] {len(catalogue)} files\n")

    success = 0
    skipped = 0

    for filename, text in catalogue:
        path = os.path.join(OUTPUT_DIR, filename)

        # Skip jika sudah ada (re-run aman)
        if os.path.exists(path) and os.path.getsize(path) > 0:
            skipped += 1
            continue

        try:
            communicate = edge_tts.Communicate(text=text, voice=VOICE, rate=RATE)
            await communicate.save(path)
            print(f"[OK]  {filename}  → \"{text}\"")
            success += 1
        except Exception as e:
            print(f"[ERR] {filename}  → {e}")

    print("\n" + "═"*56)
    print(f"  Generated : {success}")
    print(f"  Skipped   : {skipped}  (already exist)")
    print(f"  Total     : {len(catalogue)}")
    print(f"  Output    : {OUTPUT_DIR}")
    print("═"*56)
    print("\nNext steps:")
    print("  php artisan storage:link")
    print("  http://localhost/storage/audio/a-001_loket1.mp3")

if __name__ == "__main__":
    asyncio.run(generate())
