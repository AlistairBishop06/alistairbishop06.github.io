import { useCallback, useRef } from 'react';

export type SoundName = 'startup' | 'click' | 'folder' | 'start' | 'error' | 'info' | 'empty' | 'window' | 'shutdown';

const tones: Record<SoundName, Array<[number, number, number]>> = {
  startup: [[392, .11, 0], [523, .14, .09], [659, .22, .2]],
  click: [[760, .035, 0]],
  folder: [[520, .055, 0], [660, .06, .045]],
  start: [[440, .05, 0], [587, .08, .04]],
  error: [[180, .11, 0], [140, .18, .12]],
  info: [[660, .09, 0], [880, .16, .09]],
  empty: [[420, .07, 0], [310, .1, .08], [210, .14, .17]],
  window: [[580, .055, 0]],
  shutdown: [[659, .12, 0], [523, .14, .1], [392, .24, .22]],
};

export function useSound(enabled: boolean, volume: number) {
  const context = useRef<AudioContext | null>(null);
  return useCallback((name: SoundName) => {
    if (!enabled || volume <= 0) return;
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    context.current ??= new AudioContextClass();
    const ctx = context.current;
    void ctx.resume();
    tones[name].forEach(([frequency, duration, delay]) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = name === 'error' ? 'square' : 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, ctx.currentTime + delay);
      gain.gain.linearRampToValueAtTime(volume * .08, ctx.currentTime + delay + .008);
      gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + delay + duration);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(ctx.currentTime + delay);
      oscillator.stop(ctx.currentTime + delay + duration + .02);
    });
  }, [enabled, volume]);
}
