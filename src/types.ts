export interface Track {
  id: string;
  title: string;
  reciter: string;
  year?: string;
  duration?: string;
  description?: string;
  audioUrl?: string;
  youtubeId?: string;
}

export interface Quote {
  id: number;
  arabic?: string;
  urdu: string;
  english: string;
  poetOrSource: string;
  tag?: string;
}

export interface MemoryItem {
  id: string;
  title: string;
  period: string;
  iconName: string;
  summary: string;
  detailedMemory: string;
  quote?: string;
  sensoryDetail: string; // e.g. "Scent of Kewra & Fresh Rose Petals"
  audioTone?: 'chime' | 'cassette' | 'spritz' | 'tasbeeh';
}

export interface PetalParticle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  color: string;
}

export interface TimelineEvent {
  id: string;
  yearCE: string;
  yearHijri?: string;
  title: string;
  arabicTitle?: string;
  location: string;
  category: 'birth' | 'prophethood' | 'migration' | 'event' | 'legacy';
  description: string;
  significance: string;
  iconName: string;
}
