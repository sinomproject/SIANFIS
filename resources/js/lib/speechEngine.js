/**
 * speechEngine.js — Serial MP3 audio engine for SIANFIS.
 *
 * Playback flow per call:
 *   1. bell.mp3
 *   2. {queue_number}.mp3  (after 700ms delay)
 *   3. Lock released after 2600ms → next item in queue
 */

let audioQueue = [];
let isPlaying  = false;

function processQueue() {
  if (isPlaying || audioQueue.length === 0) return;

  isPlaying = true;

  const queueNumber = audioQueue.shift();

  const bell = new Audio('/storage/audio/bell.mp3');
  const main = new Audio(`/storage/audio/${queueNumber.toLowerCase()}.mp3`);

  bell.load();
  main.load();

  console.log('[AUDIO START]', queueNumber);

  // play bell
  bell.play().catch(() => {});

  // play main after fixed delay
  setTimeout(() => {
    main.play().catch(() => {
      console.warn('[Audio] main gagal:', queueNumber);
    });
  }, 700);

  // release lock and advance queue
  setTimeout(() => {
    console.log('[AUDIO END]', queueNumber);
    isPlaying = false;
    processQueue();
  }, 2600);
}

export function playAntrian(queueNumber) {
  if (!queueNumber) return;

  // prevent duplicate burst (same number queued back-to-back)
  if (audioQueue[audioQueue.length - 1] === queueNumber) return;

  audioQueue.push(queueNumber);
  console.log('[QUEUE ADD]', queueNumber, 'LEN:', audioQueue.length);

  if (!isPlaying) {
    processQueue();
  }
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
