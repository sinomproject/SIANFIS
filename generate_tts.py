import sys
import asyncio
import edge_tts
import os

VOICE = "id-ID-GadisNeural"
RATE  = "-15%"   # 🔥 lebih lambat
VOLUME = "+0%"

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "storage", "app", "public", "audio")

def build_text(kode, loket):
    # 🔥 Tambahkan jeda natural pakai koma
    return f"Nomor antrian {kode}, silakan menuju loket {loket}"

async def generate(text, filename):
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    path = os.path.join(OUTPUT_DIR, filename)

    communicate = edge_tts.Communicate(
        text=text,
        voice=VOICE,
        rate=RATE,
        volume=VOLUME
    )

    await communicate.save(path)
    print(f"[OK] {filename}")

if __name__ == "__main__":
    kode  = sys.argv[1]
    loket = sys.argv[2]

    text = build_text(kode, loket)
    filename = f"{kode}_loket{loket}.mp3"

    asyncio.run(generate(text, filename))