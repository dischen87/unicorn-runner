export const UNICORN = {
  startX: 100,
  groundY: 320,
  jumpVelocity: -450,
  doubleJumpVelocity: -380,
} as const;

export const SPEED = {
  initial: 200,
  max: 600,
  increment: 0.5,
} as const;

export const HEARTS = {
  start: 3,
  max: 5,
} as const;

export const POINTS = {
  perSecond: 1,
  perObstacle: 10,
  perHeart: 25,
  perStar: 50,
} as const;

export const COMBO = {
  threshold: 3,
  multiplier: 2,
  duration: 5000,
} as const;

export const SPAWN = {
  obstacleMinGap: 500,
  heartInterval: [15000, 30000] as const,
  starInterval: [8000, 15000] as const,
  rainbowInterval: [45000, 75000] as const,
  beanInterval: [20000, 40000] as const,
} as const;

export type MilestoneReward =
  | 'heart'
  | 'heart+rainbow'
  | 'heart+theme'
  | 'heart+golden';

export interface Milestone {
  score: number;
  reward: MilestoneReward;
}

export const MILESTONES: readonly Milestone[] = [
  { score: 100, reward: 'heart' },
  { score: 500, reward: 'heart+rainbow' },
  { score: 1000, reward: 'heart' },
  { score: 2500, reward: 'heart+theme' },
  { score: 5000, reward: 'heart+golden' },
] as const;

export interface DifficultyLevel {
  scoreThreshold: number;
  speedMultiplier: number;
  obstacleTypes: string[];
}

export const DIFFICULTY: readonly DifficultyLevel[] = [
  { scoreThreshold: 0, speedMultiplier: 1.0, obstacleTypes: ['brokkoli', 'homework'] },
  { scoreThreshold: 100, speedMultiplier: 1.2, obstacleTypes: ['brokkoli', 'homework', 'mami'] },
  { scoreThreshold: 300, speedMultiplier: 1.4, obstacleTypes: ['brokkoli', 'homework', 'mami', 'papa'] },
  { scoreThreshold: 600, speedMultiplier: 1.6, obstacleTypes: ['mami', 'papa', 'brokkoli', 'bedtime'] },
  { scoreThreshold: 1000, speedMultiplier: 1.8, obstacleTypes: ['mami', 'papa', 'brokkoli', 'homework', 'bedtime'] },
  { scoreThreshold: 2000, speedMultiplier: 2.0, obstacleTypes: ['mami', 'papa', 'brokkoli', 'homework', 'bedtime', 'bathtub'] },
] as const;

export const FART = {
  comboWindow: 2000,
  comboBonus3: 15,
  comboBonus5: 30,
  beanFlightDuration: 15000,
} as const;

export const TOILET = {
  warningDelay: [45000, 60000] as readonly [number, number],
  warningDuration: 5000,
  pauseDuration: 5000,
  speedBoostAfter: 1.3,
  speedBoostDuration: 3000,
} as const;

export const LEVELS = [
  { level: 1, name: 'Anfänger', speedMultiplier: 1.0 },
  { level: 2, name: 'Normal', speedMultiplier: 1.3 },
  { level: 3, name: 'Schnell', speedMultiplier: 1.6 },
  { level: 4, name: 'Turbo', speedMultiplier: 2.0 },
  { level: 5, name: 'WAHNSINN', speedMultiplier: 2.5 },
] as const;

export const UNICORNS = [
  { key: 'unicorn-pink', name: 'Pinki', description: 'Das Original!' },
  { key: 'unicorn-blue', name: 'Blitzi', description: 'Schnell wie der Blitz!' },
  { key: 'unicorn-gold', name: 'Goldi', description: 'Bling Bling!' },
  { key: 'unicorn-purple', name: 'Lila Fee', description: 'Magisch!' },
  { key: 'unicorn-rainbow', name: 'Regenbogen', description: 'Alle Farben!' },
] as const;
