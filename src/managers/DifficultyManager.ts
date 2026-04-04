import { SPEED, SPAWN } from '../utils/constants';

export class DifficultyManager {
  private initialSpeed: number;
  private maxSpeed: number;
  private currentSpeed: number;
  private elapsedTime: number = 0;

  constructor(initialSpeed: number = SPEED.initial, maxSpeed: number = SPEED.max) {
    this.initialSpeed = initialSpeed;
    this.maxSpeed = maxSpeed;
    this.currentSpeed = initialSpeed;
  }

  update(delta: number): void {
    this.elapsedTime += delta;

    // Logarithmic curve: ramps up fast early, then slows down
    // ln(1) = 0, so at t=0 speed = initial. As t grows, speed approaches max.
    const timeInSeconds = this.elapsedTime / 1000;
    const speedRange = this.maxSpeed - this.initialSpeed;

    // Using log curve: speed = initial + range * (ln(1 + t/k) / ln(1 + tMax/k))
    // k controls the curve shape; smaller k = faster initial ramp
    const k = 30;
    const normalizedProgress = Math.log(1 + timeInSeconds / k) / Math.log(1 + 300 / k);
    const clampedProgress = Math.min(normalizedProgress, 1);

    this.currentSpeed = this.initialSpeed + speedRange * clampedProgress;
  }

  getSpeed(): number {
    return this.currentSpeed;
  }

  getSpeedMultiplier(): number {
    return this.currentSpeed / this.initialSpeed;
  }

  getObstacleGap(): number {
    // Gap decreases as speed increases, with a minimum floor
    const maxGap = 2000;
    const minGap = SPAWN.obstacleMinGap;
    const speedRatio = (this.currentSpeed - this.initialSpeed) / (this.maxSpeed - this.initialSpeed);

    return Math.max(minGap, maxGap - (maxGap - minGap) * speedRatio);
  }

  reset(): void {
    this.currentSpeed = this.initialSpeed;
    this.elapsedTime = 0;
  }
}
