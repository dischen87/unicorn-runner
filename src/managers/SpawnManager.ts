import { SPAWN, DIFFICULTY } from '../utils/constants';

export class SpawnManager {
  private scene: Phaser.Scene;
  private obstacleTimer: Phaser.Time.TimerEvent | null = null;
  private heartTimer: Phaser.Time.TimerEvent | null = null;
  private starTimer: Phaser.Time.TimerEvent | null = null;
  private rainbowTimer: Phaser.Time.TimerEvent | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  getObstacleTypes(score: number): string[] {
    let types: string[] = ['mami'];

    for (const level of DIFFICULTY) {
      if (score >= level.scoreThreshold) {
        types = [...level.obstacleTypes];
      } else {
        break;
      }
    }

    return types;
  }

  spawnObstacle(callback: (type: string) => void, score: number, gapMs: number): void {
    const types = this.getObstacleTypes(score);
    const randomType = types[Math.floor(Math.random() * types.length)];
    callback(randomType);

    const nextDelay = Math.max(gapMs, SPAWN.obstacleMinGap);

    this.obstacleTimer = this.scene.time.addEvent({
      delay: nextDelay,
      callback: () => this.spawnObstacle(callback, score, gapMs),
    });
  }

  spawnCollectible(
    type: 'heart' | 'star' | 'rainbow',
    callback: (type: string) => void,
  ): void {
    let interval: readonly [number, number];

    switch (type) {
      case 'heart':
        interval = SPAWN.heartInterval;
        break;
      case 'star':
        interval = SPAWN.starInterval;
        break;
      case 'rainbow':
        interval = SPAWN.rainbowInterval;
        break;
    }

    const delay = Phaser.Math.Between(interval[0], interval[1]);

    const timer = this.scene.time.addEvent({
      delay,
      callback: () => {
        callback(type);
        this.spawnCollectible(type, callback);
      },
    });

    switch (type) {
      case 'heart':
        this.heartTimer = timer;
        break;
      case 'star':
        this.starTimer = timer;
        break;
      case 'rainbow':
        this.rainbowTimer = timer;
        break;
    }
  }

  startSpawning(
    obstacleCallback: (type: string) => void,
    collectibleCallback: (type: string) => void,
    score: number = 0,
    gapMs: number = 2000,
  ): void {
    this.stopSpawning();
    this.spawnObstacle(obstacleCallback, score, gapMs);
    this.spawnCollectible('heart', collectibleCallback);
    this.spawnCollectible('star', collectibleCallback);
    this.spawnCollectible('rainbow', collectibleCallback);
  }

  stopSpawning(): void {
    const timers = [this.obstacleTimer, this.heartTimer, this.starTimer, this.rainbowTimer];

    for (const timer of timers) {
      if (timer) {
        timer.remove(false);
      }
    }

    this.obstacleTimer = null;
    this.heartTimer = null;
    this.starTimer = null;
    this.rainbowTimer = null;
  }
}
