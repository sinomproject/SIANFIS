let audioQueue = [];
let isPlaying = false;

function processQueue() {
  if (isPlaying || audioQueue.length === 0) return;

  isPlaying = true;

  const queueNumber = audioQueue.shift();

  const bell = new Audio('/storage/audio/bell.mp3');
  const main = new Audio(`/storage/audio/${queueNumber.toLowerCase()}.mp3`);

  bell.load();
  main.load();

  console.log('[PLAY]', queueNumber);

  // play bell
  bell.play().catch(() => {});

  // play main setelah bell
  setTimeout(() => {
    main.play().catch(() => {
      console.warn('[Audio error]', queueNumber);
    });
  }, 700);

  // delay antar antrian (ANTI TABRAKAN)
  setTimeout(() => {
    isPlaying = false;
    processQueue();
  }, 3000);
}

export function playAntrian(queueNumber) {
  if (!queueNumber) return;

  audioQueue.push(queueNumber);

  console.log('[QUEUE]', queueNumber, 'LEN:', audioQueue.length);

  if (!isPlaying) {
    processQueue();
  }
}

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
      "VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==";
    await silent.play().catch(() => {});

    window.AUDIO_UNLOCKED = true;
    console.log("[Speech] Audio unlocked.");
    return true;
  } catch (err) {
    console.error("[Speech] Unlock failed:", err);
    return false;
  }
}

export async function initSpeechEngine() {
  console.log("[Speech] Per-queue MP3 engine ready.");
}
