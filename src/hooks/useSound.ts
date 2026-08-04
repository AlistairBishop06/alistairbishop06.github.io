import { useCallback, useEffect, useRef } from 'react';

export type SoundName =
  | 'startup' | 'login' | 'logoff' | 'shutdown'
  | 'click' | 'folder' | 'start' | 'error' | 'critical' | 'warning'
  | 'info' | 'balloon' | 'ding' | 'empty' | 'window'
  | 'minimize' | 'maximize' | 'print'
  | 'hardwareInsert' | 'hardwareRemove' | 'hardwareFail'
  | 'batteryLow' | 'batteryCritical' | 'incoming' | 'outgoing';

interface SoundDefinition { file: string; gain?: number; lifecycle?: boolean }

export const soundManifest: Record<SoundName, SoundDefinition> = {
  startup: { file: 'xpstartup.wav', gain: .78, lifecycle: true },
  login: { file: 'xplogon.wav', gain: .8, lifecycle: true },
  logoff: { file: 'xplogoff.wav', gain: .8, lifecycle: true },
  shutdown: { file: 'xpshutdn.wav', gain: .82, lifecycle: true },
  click: { file: 'xpmenu.wav', gain: .38 },
  start: { file: 'xpmenu.wav', gain: .46 },
  folder: { file: 'xpding.wav', gain: .62 },
  window: { file: 'xprestor.wav', gain: .58 },
  minimize: { file: 'xpmin.wav', gain: .58 },
  maximize: { file: 'xprestor.wav', gain: .58 },
  info: { file: 'xpnotify.wav', gain: .68 },
  balloon: { file: 'xpballn.wav', gain: .58 },
  ding: { file: 'xpdef.wav', gain: .62 },
  warning: { file: 'xpexcl.wav', gain: .72 },
  error: { file: 'xperror.wav', gain: .76 },
  critical: { file: 'xpcrtstp.wav', gain: .8 },
  empty: { file: 'xprecycl.wav', gain: .74 },
  print: { file: 'xpprint.wav', gain: .7 },
  hardwareInsert: { file: 'xphdinst.wav', gain: .66 },
  hardwareRemove: { file: 'xphdrem.wav', gain: .66 },
  hardwareFail: { file: 'xphdfail.wav', gain: .72 },
  batteryLow: { file: 'xpbatlow.wav', gain: .7 },
  batteryCritical: { file: 'xpbatcrt.wav', gain: .78 },
  incoming: { file: 'xpringin.wav', gain: .68 },
  outgoing: { file: 'xprngout.wav', gain: .68 },
};

const soundUrl = (name: SoundName) => `./assets/sounds/${soundManifest[name].file}`;

export function useSound(enabled: boolean, volume: number) {
  const cache = useRef(new Map<SoundName, HTMLAudioElement>());
  const playing = useRef(new Set<HTMLAudioElement>());
  const lifecycle = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Prepare only the first post-interaction cue and the tiny command sound.
    (['click', 'login'] as SoundName[]).forEach(name => {
      const audio = new Audio(soundUrl(name));
      audio.preload = 'auto';
      cache.current.set(name, audio);
    });
    return () => {
      playing.current.forEach(audio => audio.pause());
      playing.current.clear();
      cache.current.clear();
      lifecycle.current = null;
    };
  }, []);

  useEffect(() => {
    playing.current.forEach(audio => {
      if (!enabled || volume <= 0) audio.pause();
      else audio.volume = Math.max(0, Math.min(1, volume * Number(audio.dataset.gain || 1)));
    });
    if (!enabled || volume <= 0) {
      playing.current.clear();
      lifecycle.current = null;
    }
  }, [enabled, volume]);

  return useCallback((name: SoundName) => {
    if (!enabled || volume <= 0) return Promise.resolve(false);
    const definition = soundManifest[name];
    let source = cache.current.get(name);
    if (!source) {
      source = new Audio(soundUrl(name));
      source.preload = definition.lifecycle ? 'auto' : 'metadata';
      cache.current.set(name, source);
    }

    if (definition.lifecycle && lifecycle.current) {
      lifecycle.current.pause();
      playing.current.delete(lifecycle.current);
    }

    const audio = source.cloneNode(true) as HTMLAudioElement;
    audio.dataset.gain = String(definition.gain ?? 1);
    audio.volume = Math.max(0, Math.min(1, volume * (definition.gain ?? 1)));
    const cleanup = () => {
      playing.current.delete(audio);
      if (lifecycle.current === audio) lifecycle.current = null;
    };
    audio.addEventListener('ended', cleanup, { once: true });
    audio.addEventListener('error', cleanup, { once: true });
    playing.current.add(audio);
    if (definition.lifecycle) lifecycle.current = audio;
    return audio.play().then(() => true).catch(() => {
      cleanup();
      return false;
    }); // Browser policy may require a prior visitor gesture.
  }, [enabled, volume]);
}
