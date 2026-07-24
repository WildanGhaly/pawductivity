// Focus soundscape playback. Loops a bundled ambient asset with expo-audio so it
// works fully offline (nothing is streamed). id 0 means silence.
// Kept imperative and module-level so playback survives re-renders of the Focus screen.
import { soundscapes } from '../assets/registry';

let player: any = null;
let activeId = 0;

function createPlayer(source: any) {
  // Required lazily so a missing/unsupported native module can never crash the screen.
  const { createAudioPlayer } = require('expo-audio');
  return createAudioPlayer(source);
}

export function getActiveSoundscape(): number {
  return activeId;
}

export function stopSoundscape(): void {
  if (player) {
    try {
      player.pause();
      player.remove();
    } catch {
      // player already torn down
    }
  }
  player = null;
  activeId = 0;
}

export function playSoundscape(id: number, volume = 0.6): void {
  if (id === activeId) return;
  stopSoundscape();
  if (!id) return;
  const source = soundscapes[id];
  if (!source) return;
  try {
    player = createPlayer(source);
    player.loop = true;
    player.volume = volume;
    player.play();
    activeId = id;
  } catch (e) {
    console.warn('[soundscape] playback unavailable:', e);
    player = null;
    activeId = 0;
  }
}
