// AUDIO FX (procedural Web Audio)
// Lightweight SFX with no external assets.

(function () {
  const AudioFX = {
    ctx: null,
    master: null,
    enabled: false,
    moving: false,
    moveIntensity: 0,
    stepT: 0,
    crackleT: 0,
    tickT: 0,
    noiseBuf: null,

    init() {
      if (this.enabled) return true;
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.8;

      // Gentle compressor to keep "clicky" sounds audible without clipping.
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.knee.value = 24;
      comp.ratio.value = 2.0;
      comp.attack.value = 0.01;
      comp.release.value = 0.12;

      this.master.connect(comp);
      comp.connect(this.ctx.destination);
      this.noiseBuf = this._makeNoiseBuffer(1.0);
      this.enabled = true;

      // Some browsers start suspended until a gesture; resume best-effort.
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return true;
    },

    setMoving(on, intensity = 1) {
      this.moving = !!on;
      this.moveIntensity = Math.max(0, Math.min(1, intensity || 0));
    },

    tick(dt) {
      if (!this.enabled || !this.ctx) return;
      if (this.ctx.state === 'suspended') return;

      // Footsteps
      const targetStepInterval = 0.55 - this.moveIntensity * 0.18; // faster when "sprinting"
      if (this.moving) {
        this.stepT -= dt;
        if (this.stepT <= 0) {
          this.stepT = targetStepInterval * (0.92 + Math.random() * 0.22);
          this._footstep();
        }
      } else {
        this.stepT = Math.min(this.stepT, 0.08);
      }

      // Candle crackle (only if candles exist)
      const hasCandles = (typeof propInstances !== 'undefined')
        && Array.isArray(propInstances)
        && propInstances.some(p => {
          const g = p?.group;
          if (!g) return false;
          if (g.userData?.propKind === 'candle') return true;
          let found = false;
          try {
            g.traverse?.(child => {
              if (found) return;
              if (child?.isPointLight && child.userData?.candleFlame) found = true;
            });
          } catch (_) {}
          return found;
        });
      if (hasCandles) {
        this.crackleT -= dt;
        if (this.crackleT <= 0) {
          // Frequent, subtle crackles.
          this.crackleT = 0.06 + Math.random() * 0.22;
          this._candleCrackle();
        }
      } else {
        this.crackleT = 0.6;
      }

      // Clock tick (only if clock exists)
      const hasClock = (typeof propInstances !== 'undefined')
        && Array.isArray(propInstances)
        && propInstances.some(p => p?.group?.userData?.propKind === 'clock');
      if (hasClock) {
        this.tickT -= dt;
        if (this.tickT <= 0) {
          this.tickT += 1.0;
          this._clockTick();
        }
      } else {
        this.tickT = 1.0;
      }
    },

    play(kind) {
      if (!this.enabled || !this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});

      switch (kind) {
        case 'pickup':   return this._pickup();
        case 'open':     return this._bookOpen();
        case 'close':    return this._bookClose();
        case 'page':     return this._pageFlip();
        case 'checkout': return this._checkout();
        case 'return':   return this._returnBook();
        default: return;
      }
    },

    // ---------- primitives ----------
    _now() { return this.ctx.currentTime; },

    _makeNoiseBuffer(seconds) {
      const sr = this.ctx.sampleRate;
      const len = Math.max(1, Math.floor(sr * seconds));
      const buf = this.ctx.createBuffer(1, len, sr);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1);
      return buf;
    },

    _noiseSource(duration = 0.2, gain = 0.2) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const g = this.ctx.createGain();
      g.gain.value = gain;
      src.connect(g);
      src.start(this._now());
      src.stop(this._now() + duration);
      return { src, out: g };
    },

    _envGain(value, a, d) {
      const g = this.ctx.createGain();
      const t = this._now();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0001, value), t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
      return g;
    },

    _filter(type, freq, q = 0.7) {
      const f = this.ctx.createBiquadFilter();
      f.type = type;
      f.frequency.value = freq;
      f.Q.value = q;
      return f;
    },

    _connectToMaster(node, gain = 1) {
      const g = this.ctx.createGain();
      g.gain.value = gain;
      node.connect(g);
      g.connect(this.master);
      return g;
    },

    _pluck(freq = 180, dur = 0.08, vol = 0.08) {
      const t = this._now();
      const o = this.ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.setValueAtTime(freq, t);
      o.frequency.exponentialRampToValueAtTime(freq * 0.72, t + dur);
      const eg = this._envGain(vol, 0.002, dur);
      o.connect(eg);
      this._connectToMaster(eg, 1);
      o.start(t);
      o.stop(t + dur + 0.02);
    },

    // ---------- sounds ----------
    _footstep() {
      // Wooden thump + soft scuff
      const t = this._now();
      const intensity = 0.55 + this.moveIntensity * 0.65;
      this._pluck(130 + Math.random() * 18, 0.09, 0.07 * intensity);

      const { out } = this._noiseSource(0.07, 0.25 * intensity);
      const lp = this._filter('lowpass', 820, 0.8);
      const hp = this._filter('highpass', 90, 0.7);
      const eg = this._envGain(0.35 * intensity, 0.002, 0.07);
      out.connect(lp);
      lp.connect(hp);
      hp.connect(eg);
      this._connectToMaster(eg, 0.22);

      // tiny random delay to feel organic
      try { eg.gain.setValueAtTime(eg.gain.value, t + Math.random() * 0.006); } catch (_) {}
    },

    _pageFlip() {
      const { out } = this._noiseSource(0.16, 0.18);
      const bp = this._filter('bandpass', 1100, 0.9);
      const eg = this._envGain(0.25, 0.004, 0.18);
      out.connect(bp);
      bp.connect(eg);
      this._connectToMaster(eg, 0.22);
    },

    _pickup() {
      this._pluck(165 + Math.random() * 18, 0.09, 0.07);
      const { out } = this._noiseSource(0.09, 0.14);
      const lp = this._filter('lowpass', 1200, 0.8);
      const eg = this._envGain(0.3, 0.002, 0.09);
      out.connect(lp);
      lp.connect(eg);
      this._connectToMaster(eg, 0.22);
    },

    _bookOpen() {
      this._pluck(145, 0.12, 0.06);
      const { out } = this._noiseSource(0.22, 0.22);
      const bp = this._filter('bandpass', 900, 0.6);
      const eg = this._envGain(0.35, 0.006, 0.22);
      out.connect(bp);
      bp.connect(eg);
      this._connectToMaster(eg, 0.25);
    },

    _bookClose() {
      this._pluck(110, 0.13, 0.08);
      const { out } = this._noiseSource(0.08, 0.18);
      const lp = this._filter('lowpass', 700, 0.8);
      const eg = this._envGain(0.28, 0.002, 0.08);
      out.connect(lp);
      lp.connect(eg);
      this._connectToMaster(eg, 0.22);
    },

    _checkout() {
      // small chime
      const t = this._now();
      const o1 = this.ctx.createOscillator();
      const o2 = this.ctx.createOscillator();
      o1.type = 'sine'; o2.type = 'sine';
      o1.frequency.setValueAtTime(880, t);
      o2.frequency.setValueAtTime(1320, t);
      const eg = this._envGain(0.06, 0.002, 0.28);
      o1.connect(eg); o2.connect(eg);
      this._connectToMaster(eg, 1);
      o1.start(t); o2.start(t);
      o1.stop(t + 0.35); o2.stop(t + 0.35);
    },

    _returnBook() {
      const { out } = this._noiseSource(0.12, 0.18);
      const lp = this._filter('lowpass', 600, 0.8);
      const eg = this._envGain(0.28, 0.002, 0.12);
      out.connect(lp);
      lp.connect(eg);
      this._connectToMaster(eg, 0.2);
      this._pluck(125, 0.1, 0.05);
    },

    _candleCrackle() {
      const { out } = this._noiseSource(0.03 + Math.random() * 0.06, 0.28);
      const hp = this._filter('highpass', 900 + Math.random() * 2200, 0.85);
      const bp = this._filter('bandpass', 2200 + Math.random() * 1000, 0.7);
      const eg = this._envGain(0.35, 0.001, 0.07);
      out.connect(hp);
      hp.connect(bp);
      bp.connect(eg);
      this._connectToMaster(eg, 0.22);

      // Occasional tiny "pop" to read as crackle on small speakers.
      if (Math.random() < 0.35) {
        this._pluck(380 + Math.random() * 140, 0.03, 0.012);
      }
    },

    _clockTick() {
      const t = this._now();
      // Clicky "tick" from filtered noise + tiny body thump.
      const { out } = this._noiseSource(0.02, 0.35);
      const bp = this._filter('bandpass', 2800, 0.9);
      const eg = this.ctx.createGain();
      eg.gain.setValueAtTime(0.0001, t);
      eg.gain.linearRampToValueAtTime(0.12, t + 0.004);
      eg.gain.linearRampToValueAtTime(0.0001, t + 0.05);
      out.connect(bp);
      bp.connect(eg);
      this._connectToMaster(eg, 0.55);

      // subtle "tock" body
      this._pluck(210 + Math.random() * 10, 0.06, 0.022);
    },
  };

  window.AudioFX = AudioFX;
})();
