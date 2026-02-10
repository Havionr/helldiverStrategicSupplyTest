export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Stratagem {
  id: string;
  name: string;
  code: Direction[];
  type: 'Offensive' | 'Defensive' | 'Supply' | 'Mission';
  icon?: string; // Optional URL or emoji for simplicity
}

export interface GameStats {
  correctInputs: number;
  totalInputs: number;
  completedStratagems: number;
  failedStratagems: number; // Resetting counts as a fail
  startTime: number | null;
  endTime: number | null;
}

export interface AudioContextType {
  ctx: AudioContext | null;
  gain: GainNode | null;
}
