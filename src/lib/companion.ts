/**
 * Rules-based companion mood + animation direction (the FE-only MVP "Lottie director").
 * Deterministic, on-device, no AI. An optional Phase-2 Claude layer can replace this.
 */
export type Mood = 'happy' | 'content' | 'sad' | 'sick';

export interface MoodInfo {
  mood: Mood;
  label: string;
  emoji: string;
  /** Lottie playback speed — a happier pet is livelier. */
  speed: number;
}

export function moodFor(health: number): MoodInfo {
  if (health >= 80) return { mood: 'happy', label: 'Happy', emoji: '😸', speed: 1.15 };
  if (health >= 50) return { mood: 'content', label: 'Content', emoji: '🙂', speed: 1.0 };
  if (health >= 20) return { mood: 'sad', label: 'A bit down', emoji: '😿', speed: 0.7 };
  return { mood: 'sick', label: 'Needs care', emoji: '🤒', speed: 0.5 };
}

/** A short prompt the companion "says" based on state. */
export function companionLine(health: number, openQuests: number): string {
  if (health < 20) return 'I’m not feeling great… a snack would help!';
  if (openQuests === 0) return 'All quests done — you’re amazing!';
  if (health >= 80) return `Let’s crush ${openQuests} quest${openQuests > 1 ? 's' : ''} today!`;
  return 'Ready when you are.';
}
