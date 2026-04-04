import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatQueueNumber(number, prefix = '') {
  const paddedNumber = String(number).padStart(3, '0');
  return prefix ? `${prefix}-${paddedNumber}` : paddedNumber;
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Spell out a queue number for speech synthesis.
 * Example: "A-001" -> "A, nol nol satu"
 */
function spellQueueNumber(queueNumber) {
  if (!queueNumber) return '';
  
  // Split by hyphen (e.g., "A-001" -> ["A", "001"])
  const parts = queueNumber.split('-');
  
  if (parts.length === 2) {
    const prefix = parts[0];
    const numbers = parts[1];
    
    // Spell out each digit
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
  
  // If no hyphen, just return as is
  return queueNumber;
}

export function speakQueueNumber(queueNumber, counterNumber, counterName = null, onEndCallback = null) {
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const spelledNumber = spellQueueNumber(queueNumber);
    const counterText = counterName 
      ? `loket ${counterNumber}, ${counterName}` 
      : `loket ${counterNumber}`;
    
    const text = `Nomor antrian ${spelledNumber}. Silakan menuju ${counterText}`;
    
    let speakCount = 0;
    const maxSpeakCount = 2; // Ulangi 2 kali
    
    const speak = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1.0; // Volume maksimal 100%
      
      utterance.onend = () => {
        speakCount++;
        if (speakCount < maxSpeakCount) {
          // Ulangi panggilan setelah jeda singkat
          setTimeout(speak, 500);
        } else {
          // Panggil callback setelah semua pengulangan selesai
          if (onEndCallback) {
            onEndCallback();
          }
        }
      };
      
      utterance.onerror = () => {
        // Jika error, tetap panggil callback
        if (onEndCallback) {
          onEndCallback();
        }
      };
      
      window.speechSynthesis.speak(utterance);
    };
    
    speak();
  } else {
    // Jika speech synthesis tidak didukung, tetap panggil callback
    if (onEndCallback) {
      onEndCallback();
    }
  }
}

export function numberToWords(num) {
  const words = [
    '', 'satu', 'dua', 'tiga', 'empat', 'lima', 
    'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh',
    'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas'
  ];
  
  if (num < 16) return words[num];
  if (num < 100) {
    const tens = Math.floor(num / 10);
    const ones = num % 10;
    return `${words[tens]} puluh${ones ? ' ' + words[ones] : ''}`;
  }
  if (num < 1000) {
    const hundreds = Math.floor(num / 100);
    const remainder = num % 100;
    let result = hundreds === 1 ? 'seratus' : `${words[hundreds]} ratus`;
    if (remainder) result += ' ' + numberToWords(remainder);
    return result;
  }
  return String(num);
}