/**
 * speechEngine.js — Sequence-based MP3 queue audio
 *
 * Plays individual audio clips in order:
 *   nomor-antrian.mp3 → I.mp3 → P.mp3 → 0.mp3 → 0.mp3 → 1.mp3
 *   → menuju-loket.mp3 → loket-1.mp3
 *
 * Works for ANY prefix: A, IP, CK, AP, etc.
 * No merged file required.
 */

const BASE = '/storage/audio/';

// ── State ─────────────────────────────────────────────────────────────────────
let queue   = [];   // pending playAntrian calls
let playing = false;

// ── Sequence builder ──────────────────────────────────────────────────────────
/**
 * Build ordered clip list for a queue call.
 *
 * Example: kode="IP-001", loket=1
 * → [
 *     BASE + 'nomor-antrian.mp3',
 *     BASE + 'i.mp3',
 *     BASE + 'p.mp3',
 *     BASE + '0.mp3',
 *     BASE + '0.mp3',
 *     BASE + '1.mp3',
 *     BASE + 'menuju-loket.mp3',
 *     BASE + 'loket-1.mp3',
 *   ]
 */
function buildSequence(kode, loket) {
  const sequence = [];

  // 1. Opening phrase
  sequence.push(BASE + 'nomor-antrian.mp3');

  // 2. Split kode into prefix + digits
  const dashIdx = kode.indexOf('-');
  const prefix  = dashIdx !== -1 ? kode.slice(0, dashIdx)  : kode;
  const digits  = dashIdx !== -1 ? kode.slice(dashIdx + 1) : '';

  // 3. Prefix — one clip per character (lowercase filename)
  prefix.split('').forEach(char => {
    sequence.push(BASE + char.toLowerCase() + '.mp3');
  });

  // 4. Digits — one clip per digit
  digits.split('').forEach(d => {
    sequence.push(BASE + d + '.mp3');
  });

  // 5. Transition phrase
  sequence.push(BASE + 'menuju-loket.mp3');

  // 6. Loket number
  sequence.push(BASE + 'loket-' + loket + '.mp3');

  console.log('[Speech] Sequence for', kode, 'loket', loket, ':', sequence);
  return sequence;
}

// ── Single clip player ────────────────────────────────────────────────────────
function playClip(src) {
  return new Promise((resolve) => {
    const audio = new Audio(src);
    audio.volume = 1.0;

    audio.onended = resolve;

    audio.onerror = () => {
      console.warn('[Speech] File not found, skipping:', src);
      resolve();
    };

    audio.play().catch((err) => {
      console.warn('[Speech] play() rejected:', src, err);
      resolve();
    });
  });
}

// ── Sequence player ───────────────────────────────────────────────────────────
async function playSequence(sequence) {
  for (let i = 0; i < sequence.length; i++) {
    await playClip(sequence[i]);

    // 150ms gap between clips (skip after last)
    if (i < sequence.length - 1) {
      await new Promise(r => setTimeout(r, 150));
    }
  }
}

// ── Queue processor ───────────────────────────────────────────────────────────
async function processQueue() {
  if (playing || !queue.length) return;

  playing = true;

  while (queue.length) {
    const { kode, loket } = queue.shift();
    const sequence = buildSequence(kode, loket);
    await playSequence(sequence);

    // Gap between repeated calls
    if (queue.length) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  playing = false;
}

// ── Public API ────────────────────────────────────────────────────────────────
/**
 * Antrekan dan putar audio antrian via sequence clip.
 *
 * @param {string}        kode   e.g. "IP-001", "A-023", "CK-007"
 * @param {string|number} loket  e.g. 1, "2"
 *
 * Example:
 *   playAntrian("IP-001", 1)
 *   → nomor-antrian → i → p → 0 → 0 → 1 → menuju-loket → loket-1
 */
export function playAntrian(kode, loket) {
  if (!window.AUDIO_UNLOCKED) {
    console.warn('[Speech] Audio belum di-unlock.');
    return;
  }

  console.log('[Speech] Enqueue:', kode, 'loket', loket);
  queue.push({ kode, loket });
  processQueue();
}

// ── Unlock ────────────────────────────────────────────────────────────────────
export async function unlockAudioSystem() {
  console.log('[Speech] Unlocking audio...');

  try {
    const silent = new Audio();
    silent.src = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADhAC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAA4T6y8vkAAAAAAAAAAAAAAAAAAAAAP/7kGQAD/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kGQAP/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==";
    await silent.play().catch(() => {});

    window.AUDIO_UNLOCKED = true;
    console.log('[Speech] Audio unlocked');
    return true;
  } catch (err) {
    console.error('[Speech] Unlock failed:', err);
    return false;
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
export async function initSpeechEngine() {
  console.log('[Speech] Sequence-based MP3 engine ready');
}
