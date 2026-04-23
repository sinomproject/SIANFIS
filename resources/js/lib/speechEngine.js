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

// ── Counter name → audio file mapping ────────────────────────────────────────
// Add entries here for any counter whose name should be spoken as a full phrase
// rather than spelled letter-by-letter.
const COUNTER_MAP = {
  'IP':  'ilmu-pemerintahan.mp3',
  'AP':  'administrasi-publik.mp3',
  'IK1': 'ilmu-komunikasi-1.mp3',
  'IK2': 'ilmu-komunikasi-2.mp3',
  'KTU': 'ktu.mp3',
};

// ── State ─────────────────────────────────────────────────────────────────────
let queue   = [];   // pending playAntrian calls
let playing = false;

// ── Sequence builder ──────────────────────────────────────────────────────────
/**
 * Build ordered clip list for a queue call.
 *
 * Example: kode="CK-001", counterName="IP"
 * → [
 *     BASE + 'nomor-antrian.mp3',
 *     BASE + 'c.mp3',
 *     BASE + 'k.mp3',
 *     BASE + '0.mp3',
 *     BASE + '0.mp3',
 *     BASE + '1.mp3',
 *     BASE + 'menuju-loket.mp3',
 *     BASE + 'i.mp3',
 *     BASE + 'p.mp3',
 *   ]
 *
 * counterName can be any string: "IP", "CS", "TELLER", "1", "12"
 */
function buildSequence(kode, counterName) {
  const sequence = [];

  // 1. Opening phrase
  sequence.push(BASE + 'nomor-antrian.mp3');

  // 2. Split kode into prefix + digits  (e.g. "CK-001" → "CK" + "001")
  const dashIdx = kode.indexOf('-');
  const prefix  = dashIdx !== -1 ? kode.slice(0, dashIdx)  : kode;
  const digits  = dashIdx !== -1 ? kode.slice(dashIdx + 1) : '';

  // 3. Prefix — one clip per character (lowercase)
  prefix.split('').forEach(char => {
    sequence.push(BASE + char.toLowerCase() + '.mp3');
  });

  // 4. Digits — one clip per digit
  digits.split('').forEach(d => {
    sequence.push(BASE + d + '.mp3');
  });

  // 5. Transition + counter name (MAPPED ONLY — no spelling fallback)
  const counterKey = (counterName ?? '').toString().toUpperCase().trim();

  if (!COUNTER_MAP[counterKey]) {
    console.warn('[Speech] Unknown counter, no audio mapped:', counterKey);
    return sequence; // play queue number only, skip loket announcement
  }

  sequence.push(BASE + 'menuju-loket.mp3');
  sequence.push(BASE + COUNTER_MAP[counterKey]);

  console.log('[Speech] Sequence for', kode, '→', counterKey, ':', sequence);
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
const isDigitClip = (src) => /\/[0-9]\.mp3$/.test(src);

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function playSequence(sequence) {
  for (let i = 0; i < sequence.length; i++) {
    await playClip(sequence[i]);

    if (i < sequence.length - 1) {
      const curr = sequence[i];
      const next = sequence[i + 1];
      // Digit → digit: very fast (sounds like reading "nol nol satu")
      // Anything else: short natural pause
      await delay(isDigitClip(curr) && isDigitClip(next) ? 40 : 80);
    }
  }
}

// ── Queue processor ───────────────────────────────────────────────────────────
async function processQueue() {
  if (playing || !queue.length) return;

  playing = true;

  while (queue.length) {
    const { kode, counterName } = queue.shift();
    const sequence = buildSequence(kode, counterName);
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
 * @param {string} kode         Nomor antrian, e.g. "IP-001", "IK1-023"
 * @param {string} counterName  Nama loket dari DB — harus ada di COUNTER_MAP
 *
 * Examples:
 *   playAntrian("IP-001", "IP")
 *   → nomor-antrian → i → p → 0 → 0 → 1 → menuju-loket → ilmu-pemerintahan
 *
 *   playAntrian("IK1-007", "IK1")
 *   → nomor-antrian → i → k → 1 → 0 → 0 → 7 → menuju-loket → ilmu-komunikasi-1
 */
export function playAntrian(kode, counterName) {
  if (!window.AUDIO_UNLOCKED) {
    console.warn('[Speech] Audio belum di-unlock.');
    return;
  }

  console.log('[Speech] Enqueue:', kode, '→', counterName);
  queue.push({ kode, counterName });
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
