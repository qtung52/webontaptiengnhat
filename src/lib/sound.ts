/**
 * Web Speech API ja-JP và Web Audio API sound synthesizer
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

let cachedVoices: SpeechSynthesisVoice[] = [];
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

export function speakJapanese(text: string, rate: number = 0.9): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Trình duyệt không hỗ trợ Web Speech API.');
    return;
  }

  try {
    // Đảm bảo không bị treo ở trạng thái pause
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.cancel(); // Dừng câu trước đó nếu đang đọc

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = Math.max(0.5, Math.min(1.5, rate));
    utterance.pitch = 1.0;

    // Tìm giọng đọc tiếng Nhật ưu tiên giọng tự nhiên
    const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices();
    const jaVoice = voices.find(
      v => v.lang.startsWith('ja') || v.lang.includes('JP') || v.name.includes('Japan')
    );
    if (jaVoice) {
      utterance.voice = jaVoice;
    }

    window.speechSynthesis.speak(utterance);

    // Kích hoạt resume phòng trường hợp browser chặn background
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch (error) {
    console.error('Lỗi phát âm Web Speech API:', error);
  }
}

export function playChime(type: 'correct' | 'wrong' | 'complete' | 'click'): void {
  // Âm thanh gõ đúng / sai đã được tắt hoàn toàn theo yêu cầu người dùng
  if (type === 'correct' || type === 'wrong') {
    return;
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    if (type === 'complete') {
      // Hợp âm chiến thắng khi hoàn tất bộ bài
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'triangle';
        o.frequency.setValueAtTime(freq, now + idx * 0.08);
        g.gain.setValueAtTime(0.18, now + idx * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
        o.start(now + idx * 0.08);
        o.stop(now + idx * 0.08 + 0.4);
      });
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch (e) {
    console.debug('Lỗi phát âm thanh hiệu ứng:', e);
  }
}
