/**
 * 크리스탈 효과음 (Web Audio 합성, 음원 파일 불필요)
 *  - playCrystal({ pitch, chord }) : 종소리 같은 짧은 '팅'
 *  - 사용자 설정(켜기/끄기)은 localStorage 에 저장
 */
const KEY = 'sayme-mandalart-sound';
let ctx = null;

export function isSoundEnabled() {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setSoundEnabled(on) {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch {
    /* ignore */
  }
}

function getContext() {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function ring(ac, baseFreq, at, { gain = 0.22, decay = 1.1 } = {}) {
  const master = ac.createGain();
  master.gain.setValueAtTime(0.0001, at);
  master.gain.exponentialRampToValueAtTime(gain, at + 0.006);
  master.gain.exponentialRampToValueAtTime(0.0001, at + decay);
  master.connect(ac.destination);

  // 유리/종 특유의 비조화 배음
  const partials = [
    [1, 1],
    [2.76, 0.32],
    [5.4, 0.12],
    [8.9, 0.05],
  ];
  for (const [ratio, amp] of partials) {
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * ratio, at);
    // 아주 살짝 위로 미끄러지며 시작 → 유리를 튕긴 느낌
    osc.frequency.exponentialRampToValueAtTime(baseFreq * ratio * 1.004, at + 0.08);
    const g = ac.createGain();
    g.gain.setValueAtTime(amp, at);
    g.gain.exponentialRampToValueAtTime(amp * 0.05, at + decay * (ratio > 5 ? 0.35 : 0.8));
    osc.connect(g);
    g.connect(master);
    osc.start(at);
    osc.stop(at + decay + 0.05);
  }

  // 반짝임: 짧은 고역 노이즈
  const len = Math.floor(ac.sampleRate * 0.05);
  const buffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const noise = ac.createBufferSource();
  noise.buffer = buffer;
  const hp = ac.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 6000;
  const ng = ac.createGain();
  ng.gain.setValueAtTime(gain * 0.25, at);
  ng.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
  noise.connect(hp);
  hp.connect(ng);
  ng.connect(master);
  noise.start(at);
}

/**
 * @param {object} opts
 * @param {number} opts.pitch  1 = C6 기준. 0.8~1.5 권장
 * @param {boolean} opts.chord 중심 블록 등 강조용 3음 화음
 */
export function playCrystal({ pitch = 1, chord = false } = {}) {
  if (!isSoundEnabled()) return;
  const ac = getContext();
  if (!ac) return;
  const now = ac.currentTime;
  const jitter = 1 + (Math.random() - 0.5) * 0.05;
  const base = 1046.5 * pitch * jitter; // C6
  ring(ac, base, now);
  if (chord) {
    ring(ac, base * 1.25, now + 0.06, { gain: 0.16, decay: 1.3 }); // 장3도
    ring(ac, base * 1.5, now + 0.12, { gain: 0.14, decay: 1.5 }); // 완전5도
  }
}
