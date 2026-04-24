/**
 * speechEngine.js — Per-queue MP3 audio engine for SIANFIS.
 *
 * Playback flow for each queue call:
 *   1. Play ding.mp3
 *   2. Play {code.lower}-{number}.mp3
 *      e.g. "IP-042" → ding.mp3 → ip-042.mp3
 *
 * Files live at: /storage/audio/
 */

const BASE = "/storage/audio/";

// ── Pending calls while audio is already playing ──────────────────────────────
let callQueue = [];
let playing   = false;

// ── Play a single audio file, resolving when it ends (or on error) ────────────

function playFile(src) {
  return new Promise((resolve) => {
    const audio = new Audio(src);
    audio.volume  = 1.0;
    audio.onended = resolve;
    audio.onerror = () => {
      console.warn("[Speech] File not found, skipping:", src);
      resolve();
    };
    audio.play().catch((err) => {
      console.warn("[Speech] play() rejected:", src, err);
      resolve();
    });
  });
}

// ── Play one announcement: ding → queue audio ─────────────────────────────────

async function playCall(kode) {
  // "IP-042" → "ip-042.mp3"
  const filename = kode.toLowerCase() + ".mp3";

  await playFile(`${BASE}bell.mp3`);
  await playFile(`${BASE}${filename}`);
}

// ── Queue processor ───────────────────────────────────────────────────────────

async function processQueue() {
  if (playing || !callQueue.length) return;

  playing = true;

  while (callQueue.length) {
    const { kode } = callQueue.shift();
    await playCall(kode);

    if (callQueue.length) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  playing = false;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Queue a queue-call announcement.
 *
 * @param {string} kode  Queue number as formatted by the backend,
 *                       e.g. "IP-042", "IK1-007", "KTU-001"
 */
export function playAntrian(kode) {
  if (!window.AUDIO_UNLOCKED) {
    console.warn("[Speech] Audio not unlocked yet.");
    return;
  }

  console.log("[Speech] Enqueue:", kode);
  callQueue.push({ kode });
  processQueue();
}

// ── Audio unlock ──────────────────────────────────────────────────────────────

export async function unlockAudioSystem() {
  console.log("[Speech] Unlocking audio...");

  try {
    const silent = new Audio();
    silent.src =
      "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA" +
      "//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADhAC7u7u7u7u7u7u7" +
      "u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8A" +
      "AAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAA4T6y8vkAAAAAAAAAAAAAAAAAAAAAAP/7kGQAD/AAAGk" +
      "AAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV" +
      "VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==";
    await silent.play().catch(() => {});

    window.AUDIO_UNLOCKED = true;
    console.log("[Speech] Audio unlocked.");
    return true;
  } catch (err) {
    console.error("[Speech] Unlock failed:", err);
    return false;
  }
}

// ── Init (no-op, kept for API compatibility) ──────────────────────────────────

export async function initSpeechEngine() {
  console.log("[Speech] Per-queue MP3 engine ready.");
}
