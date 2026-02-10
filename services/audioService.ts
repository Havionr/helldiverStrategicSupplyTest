
export class AudioService {
  private ctx: AudioContext | null = null;
  private gain: GainNode | null = null;

  constructor() {
    // Lazy init
  }

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gain = this.ctx.createGain();
      this.gain.connect(this.ctx.destination);
    }
  }

  playTone(freq: number, type: OscillatorType = 'square', duration: number = 0.1) {
    this.init();
    if (!this.ctx || !this.gain) return;

    const osc = this.ctx.createOscillator();
    const now = this.ctx.currentTime;
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    
    const noteGain = this.ctx.createGain();
    noteGain.connect(this.ctx.destination);
    
    // Envelope
    noteGain.gain.setValueAtTime(0.1, now);
    noteGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(noteGain);
    osc.start(now);
    osc.stop(now + duration);
  }

  playInput() {
    this.playTone(800, 'sawtooth', 0.05);
  }

  playError() {
    this.playTone(150, 'sawtooth', 0.3);
  }

  playSuccess() {
    this.init();
    if (!this.ctx) return;
    // Play a quick arpeggio
    const now = this.ctx.currentTime;
    [1200, 1500, 2000].forEach((freq, i) => {
       const osc = this.ctx!.createOscillator();
       const g = this.ctx!.createGain();
       osc.frequency.value = freq;
       osc.type = 'square';
       g.gain.setValueAtTime(0.1, now + i * 0.05);
       g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.1);
       osc.connect(g);
       g.connect(this.ctx!.destination);
       osc.start(now + i * 0.05);
       osc.stop(now + i * 0.05 + 0.1);
    });
  }
}

export const audioService = new AudioService();
