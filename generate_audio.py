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

# ── Static audio files (counter names + core phrases) ────────────────────────
STATIC_CATALOGUE = [
    # Core sequence phrases
    ('nomor-antrian.mp3',     'Nomor antrian'),
    ('menuju-loket.mp3',      'menuju loket'),
    # Digits 0–9
    ('0.mp3', 'nol'),   ('1.mp3', 'satu'),  ('2.mp3', 'dua'),
    ('3.mp3', 'tiga'),  ('4.mp3', 'empat'), ('5.mp3', 'lima'),
    ('6.mp3', 'enam'),  ('7.mp3', 'tujuh'), ('8.mp3', 'delapan'),
    ('9.mp3', 'sembilan'),
    # Single-letter prefixes a–z
    *[(f'{c}.mp3', c.upper()) for c in 'abcdefghijklmnopqrstuvwxyz'],
    # Counter name — full spoken phrase (matches COUNTER_MAP in speechEngine.js)
    ('ilmu-pemerintahan.mp3',  'Ilmu Pemerintahan'),
    ('administrasi-publik.mp3','Administrasi Publik'),
    ('ilmu-komunikasi-1.mp3',  'Ilmu Komunikasi satu'),
    ('ilmu-komunikasi-2.mp3',  'Ilmu Komunikasi dua'),
    ('ktu.mp3',                'K T U'),
]

# ── Build full catalogue ─────────────────────────────────────────────────────
def build_catalogue():
    entries = list(STATIC_CATALOGUE)
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
