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

// ── Global audio queue (serial playback, no overlap) ─────────────────────────
let audioQueue = [];
let isPlaying  = false;

// ── Queue processor (event-based, not async/await) ───────────────────────────

function processQueue() {
  if (isPlaying || audioQueue.length === 0) return;

  isPlaying = true;
  const queueNumber = audioQueue.shift();

  const bell = new Audio('/storage/audio/bell.mp3');
  const main = new Audio(`/storage/audio/${queueNumber.toLowerCase()}.mp3`);

  let started = false;

  const playMain = () => {
    if (started) return;
    started = true;

    main.play().catch(() => {
      isPlaying = false;
      processQueue();
    });
  };

  // bell selesai → lanjut main
  bell.onended = playMain;

  // fallback kalau bell gagal / tidak trigger
  setTimeout(playMain, 800);

  // selesai main → lanjut queue berikutnya
  main.onended = () => {
    setTimeout(() => {
      isPlaying = false;
      processQueue();
    }, 300);
  };

  main.onerror = () => {
    isPlaying = false;
    processQueue();
  };

  // mulai bell
  bell.play().catch(() => {
    playMain();
  });
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Queue a queue-call announcement.
 * Safe to call from multiple counters simultaneously — all are queued and
 * played serially without overlap or loss.
 *
 * @param {string} queueNumber  e.g. "IP-042", "IK1-007", "KTU-001"
 */
export function playAntrian(queueNumber) {
  if (!window.AUDIO_UNLOCKED) {
    console.warn("[Speech] Audio not unlocked yet.");
    return;
  }

  console.log("[Speech] Enqueue:", queueNumber);
  audioQueue.push(queueNumber);
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
