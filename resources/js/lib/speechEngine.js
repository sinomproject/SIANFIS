import { publicApi } from '@/services/api';

let speechQueue = [];
let speaking = false;
let audioSettings = null;
let voiceReady = false;
let selectedVoice = null;

function spellQueueNumber(queueNumber) {
  if (!queueNumber) return '';

  const parts = queueNumber.split('-');

  if (parts.length === 2) {
    const prefix = parts[0];
    const numbers = parts[1];

    const digitWords = {
      '0': 'nol',
      '1': 'satu',
      '2': 'dua',
      '3': 'tiga',
      '4': 'empat',
      '5': 'lima',
      '6': 'enam',
      '7': 'tujuh',
      '8': 'delapan',
      '9': 'sembilan'
    };

    const spelledNumbers = numbers.split('').map(d => digitWords[d] || d).join(' ');

    return `${prefix}, ${spelledNumbers}`;
  }

  return queueNumber;
}

function initVoices() {
  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices();

    selectedVoice =
      voices.find(v => v.lang === 'id-ID') ||
      voices.find(v => v.name.includes('Indonesia')) ||
      voices[0];

    voiceReady = true;
    console.log('[Speech] Voice loaded:', selectedVoice?.name || 'default');
  };

  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

async function loadAudioSettings() {
  try {
    const response = await publicApi.getAudioSettings();
    audioSettings = response.data.data;
    console.log('[Speech] Audio settings loaded:', audioSettings);
  } catch (err) {
    console.error('[Speech] Failed to load audio settings:', err);
    audioSettings = {
      voice_volume: '1.0',
      voice_rate: '0.9',
      voice_pitch: '1.0',
      voice_repeat: '2',
      voice_language: 'id-ID',
      voice_template: 'Nomor antrian {nomor_antrian}. Silakan menuju loket {nomor_loket}'
    };
  }
}

export async function unlockAudioSystem() {
  console.log('[Speech] Unlocking audio system with user gesture...');

  try {
    // Unlock HTML5 Audio
    const audio = new Audio();
    audio.src = "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADhAC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAA4T6y8vkAAAAAAAAAAAAAAAAAAAAAP/7kGQAD/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7kGQAP/AAAGkAAAAIAAANIAAAAQAAAaQAAAAgAAA0gAAABFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVQ==";
    await audio.play().catch(() => {});

    // Unlock SpeechSynthesis
    const test = new SpeechSynthesisUtterance(" ");
    test.volume = 0;
    window.speechSynthesis.speak(test);
    window.speechSynthesis.cancel();

    window.AUDIO_UNLOCKED = true;
    console.log('[Speech] Audio system unlocked successfully');

    return true;
  } catch (err) {
    console.error('[Speech] Failed to unlock audio:', err);
    return false;
  }
}

export async function initSpeechEngine() {
  console.log('[Speech] Initializing speech engine...');

  initVoices();
  await loadAudioSettings();

  // Handle visibility change
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      console.log('[Speech] Page visible, resuming speech');
      window.speechSynthesis.resume();
    }
  });

  console.log('[Speech] Speech engine ready');
}

export function enqueueSpeech(payload) {
  console.log('[Display] New Queue Detected:', payload);

  speechQueue.push(payload);
  processQueue();
}

function processQueue() {
  if (!window.AUDIO_UNLOCKED) {
    console.warn('[Speech] Audio not unlocked yet, waiting for user interaction');
    return;
  }

  if (speaking) {
    console.log('[Speech] Already speaking, queued');
    return;
  }

  if (!speechQueue.length) {
    return;
  }

  speaking = true;

  const item = speechQueue.shift();

  setTimeout(() => {
    speak(item);
  }, 200);
}

function speak(data) {
  if (!window.AUDIO_UNLOCKED) {
    console.warn('[Speech] Waiting for audio unlock...');
    speaking = false;
    return;
  }

  console.log('[Speech] Canceling any previous speech');
  window.speechSynthesis.cancel();

  if (data.warmup) {
    console.log('[Speech] Warmup');
    const warmup = new SpeechSynthesisUtterance(' ');
    warmup.volume = 0;
    warmup.onend = () => {
      speaking = false;
      processQueue();
    };
    warmup.onerror = () => {
      speaking = false;
      processQueue();
    };
    window.speechSynthesis.speak(warmup);
    return;
  }

  if (!voiceReady || !audioSettings) {
    console.warn('[Speech] Not ready yet, voiceReady:', voiceReady, 'audioSettings:', !!audioSettings);
    speaking = false;
    processQueue();
    return;
  }

  console.log('[Speech] Building sentence...');

  const spelledNumber = spellQueueNumber(data.number);

  let text = audioSettings.voice_template || 'Nomor antrian {nomor_antrian}. Silakan menuju loket {nomor_loket}';
  text = text.replace('{nomor_antrian}', spelledNumber);
  text = text.replace('{nomor_loket}', data.counter || '');
  text = text.replace('{nama_loket}', data.counterName || '');
  text = text.replace('{nama_layanan}', data.service || '');

  console.log('[Speech] Text:', text);

  const repeatCount = parseInt(audioSettings.voice_repeat) || 2;
  let currentRepeat = 0;

  const speakOnce = () => {
    console.log('[Speech] Playing... (repeat', currentRepeat + 1, '/', repeatCount + ')');

    const utter = new SpeechSynthesisUtterance(text);

    utter.voice = selectedVoice;
    utter.lang = audioSettings.voice_language || 'id-ID';
    utter.rate = parseFloat(audioSettings.voice_rate) || 0.9;
    utter.pitch = parseFloat(audioSettings.voice_pitch) || 1.0;
    utter.volume = parseFloat(audioSettings.voice_volume) || 1.0;

    utter.onstart = () => {
      console.log('[Speech] Started speaking');
    };

    utter.onend = () => {
      console.log('[Speech] Finished speaking');
      currentRepeat++;
      if (currentRepeat < repeatCount) {
        setTimeout(speakOnce, 500);
      } else {
        console.log('[Speech] All repeats done');
        speaking = false;
        processQueue();
      }
    };

    utter.onerror = (event) => {
      console.error('[Speech] Error:', event.error);
      if (event.error === 'not-allowed') {
        console.error('[Speech] CRITICAL: Audio not unlocked! User must interact with page first.');
        window.AUDIO_UNLOCKED = false;
      }
      speaking = false;
      processQueue();
    };

    setTimeout(() => {
      window.speechSynthesis.speak(utter);
    }, 200);
  };

  speakOnce();
}

// Auto-process queue when audio is unlocked
window.addEventListener('audioUnlocked', () => {
  console.log('[Speech] Audio unlocked event received, processing queue');
  processQueue();
});
