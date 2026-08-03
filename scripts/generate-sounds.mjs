import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const sampleRate = 44100;
const outputDir = fileURLToPath(new URL('../public/assets/sounds/', import.meta.url));
mkdirSync(outputDir, { recursive: true });

const fade = (time, duration, attack = 0.012, release = 0.18) =>
  Math.min(1, time / attack) * Math.min(1, (duration - time) / release);

const bell = (frequency, time, start, duration, gain = 1) => {
  const local = time - start;
  if (local < 0 || local > duration) return 0;
  const decay = Math.exp(-4.2 * local / duration) * fade(local, duration, 0.006, duration * .3);
  return gain * decay * (
    Math.sin(2 * Math.PI * frequency * local) +
    .34 * Math.sin(2 * Math.PI * frequency * 2.01 * local) +
    .15 * Math.sin(2 * Math.PI * frequency * 3.98 * local)
  );
};

const pad = (frequencies, time, start, duration, gain = 1) => {
  const local = time - start;
  if (local < 0 || local > duration) return 0;
  const envelope = fade(local, duration, .16, .55);
  return gain * envelope * frequencies.reduce((sum, frequency, index) =>
    sum + Math.sin(2 * Math.PI * frequency * local + index * .35) / frequencies.length, 0);
};

const chirp = (from, to, time, start, duration, gain = 1) => {
  const local = time - start;
  if (local < 0 || local > duration) return 0;
  const phase = 2 * Math.PI * (from * local + (to - from) * local * local / (2 * duration));
  return gain * Math.sin(phase) * fade(local, duration, .006, duration * .65);
};

const noise = (index) => {
  const value = Math.sin(index * 12.9898 + 78.233) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
};

function writeWav(filename, duration, sample) {
  const length = Math.ceil(duration * sampleRate);
  const dataSize = length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0); buffer.writeUInt32LE(36 + dataSize, 4); buffer.write('WAVE', 8);
  buffer.write('fmt ', 12); buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22); buffer.writeUInt32LE(sampleRate, 24); buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34); buffer.write('data', 36); buffer.writeUInt32LE(dataSize, 40);
  for (let index = 0; index < length; index += 1) {
    const time = index / sampleRate;
    const value = Math.tanh(sample(time, index) * .78);
    buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, value)) * 32767), 44 + index * 2);
  }
  writeFileSync(join(outputDir, filename), buffer);
}

writeWav('startup.wav', 2.9, (t) =>
  pad([146.83, 220, 293.66], t, 0, 2.9, .25) +
  bell(293.66, t, .05, 1.5, .32) + bell(369.99, t, .28, 1.6, .3) +
  bell(440, t, .55, 1.7, .28) + bell(587.33, t, .84, 1.9, .27));

writeWav('login.wav', 2.55, (t) =>
  pad([196, 261.63, 329.63, 392], t, .05, 2.45, .26) +
  bell(392, t, .02, 1.15, .28) + bell(523.25, t, .22, 1.35, .3) +
  bell(659.25, t, .47, 1.45, .28) + bell(783.99, t, .73, 1.65, .25));

writeWav('shutdown.wav', 2.45, (t) =>
  pad([146.83, 196, 246.94], t, .05, 2.35, .24) +
  bell(659.25, t, .04, 1.2, .27) + bell(523.25, t, .27, 1.3, .29) +
  bell(392, t, .56, 1.45, .3) + bell(293.66, t, .85, 1.5, .24));

writeWav('folder-open.wav', .34, (t) => bell(523.25, t, 0, .25, .38) + bell(698.46, t, .075, .26, .34));
writeWav('start-menu.wav', .42, (t) => bell(440, t, 0, .34, .32) + bell(659.25, t, .09, .31, .34));
writeWav('information.wav', .68, (t) => bell(659.25, t, 0, .5, .36) + bell(880, t, .15, .52, .32));
writeWav('error.wav', .62, (t) => bell(196, t, 0, .31, .48) + bell(155.56, t, .27, .35, .52));
writeWav('window-open.wav', .28, (t) => chirp(420, 720, t, 0, .2, .25) + bell(720, t, .09, .19, .18));
writeWav('minimize.wav', .31, (t) => chirp(920, 360, t, 0, .28, .32));
writeWav('maximize.wav', .31, (t) => chirp(360, 920, t, 0, .28, .32));
writeWav('recycle-empty.wav', .78, (t, i) => {
  const rustle = t < .52 ? noise(i) * Math.exp(-4 * t) * .23 : 0;
  return rustle + chirp(520, 120, t, .14, .55, .36) + bell(210, t, .42, .34, .22);
});

console.log('Generated original Portfolio XP sound scheme in public/assets/sounds/.');
