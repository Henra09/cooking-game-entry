// WebAudio sound effects: all synthesized, no asset files. A tiny step sequencer
// plays the kitchen theme so the game has music without any downloads.
export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicTimer = null;
    this.step = 0;
  }

  ensure() {
    if (this.ctx) return this.ctx;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      this.ctx = null;
    }
    return this.ctx;
  }

  resume() {
    const ctx = this.ensure();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  tone(freq, dur, type = 'square', vol = 0.15, when = 0) {
    const ctx = this.ensure();
    if (!ctx || this.muted) return;
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  noise(dur, vol = 0.12) {
    const ctx = this.ensure();
    if (!ctx || this.muted) return;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    g.gain.value = vol;
    src.buffer = buf;
    src.connect(g).connect(ctx.destination);
    src.start();
  }

  pick()  { this.tone(660, 0.08, 'square', 0.12); }
  put()   { this.tone(440, 0.08, 'square', 0.10); }
  swap()  { this.tone(520, 0.06); this.tone(700, 0.06, 'square', 0.10, 0.06); }
  chop()  { this.noise(0.09, 0.2); this.tone(180, 0.05, 'triangle', 0.18); }
  sizzle() { this.noise(0.5, 0.06); }
  serve() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.12, 'square', 0.14, i * 0.09)); }
  wrong() { this.tone(220, 0.25, 'sawtooth', 0.16); this.tone(170, 0.3, 'sawtooth', 0.14, 0.12); }
  deny()  { this.tone(150, 0.12, 'sawtooth', 0.12); }
  levelUp() { [392, 523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.14, 'triangle', 0.15, i * 0.1)); }
  gameOver() { [400, 330, 260, 180].forEach((f, i) => this.tone(f, 0.3, 'sawtooth', 0.14, i * 0.22)); }
  tick()  { this.tone(880, 0.04, 'square', 0.07); }

  // Music: a bouncy 8-step loop, two voices.
  startMusic() {
    if (this.musicTimer || !this.ensure()) return;
    const melody = [392, 392, 440, 494, 440, 392, 330, 392];
    const bass   = [131, 131, 165, 165, 175, 175, 131, 131];
    this.musicTimer = setInterval(() => {
      if (this.muted) { this.step = (this.step + 1) % 8; return; }
      const s = this.step % 8;
      this.tone(melody[s], 0.12, 'square', 0.05);
      this.tone(bass[s], 0.16, 'triangle', 0.08);
      if (s % 4 === 0) this.noise(0.03, 0.03);
      this.step = (this.step + 1) % 8;
    }, 190);
  }

  stopMusic() {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }
}
