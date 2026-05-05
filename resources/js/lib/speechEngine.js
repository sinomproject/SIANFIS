if (window.__AUDIO_ENGINE_LOCK__) {
  console.warn('[Audio] Engine already initialized, skip duplicate');
} else {
  window.__AUDIO_ENGINE_LOCK__ = true;
}

let audioQueue = [];
let processingPromise = null;
let currentAudio = null;

async function processQueue() {
  if (processingPromise) return processingPromise;

  processingPromise = (async () => {
    while (audioQueue.length > 0) {
      const queueNumber = audioQueue.shift();

      const bell = new Audio('/storage/audio/bell.mp3');
      const main = new Audio(`/storage/audio/${queueNumber.toLowerCase()}.mp3`);

      try {
        bell.load();
        main.load();

        console.log('[PLAY]', queueNumber);

        if (currentAudio) {
          try { currentAudio.pause(); currentAudio.currentTime = 0; } catch (e) {}
        }

        currentAudio = bell;
        await bell.play().catch(() => {});

        await new Promise(resolve => {
          bell.onended = resolve;
          setTimeout(resolve, 1000);
        });

        currentAudio = main;
        await main.play().catch(() => {});

        await new Promise(resolve => {
          main.onended = resolve;
          setTimeout(resolve, 4000);
        });

      } catch (e) {
        console.warn('[Audio error]', queueNumber, e);
      }
    }

    currentAudio = null;
    processingPromise = null;
  })();

  return processingPromise;
}

export function playAntrian(queueNumber) {
  if (!queueNumber) return;

  audioQueue.push(queueNumber);

  console.log('[QUEUE]', queueNumber, 'LEN:', audioQueue.length);

  processQueue();
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
