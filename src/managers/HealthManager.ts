import { HEARTS } from '../utils/constants';

export class HealthManager {
  private hearts: number;
  private maxHearts: number;
  private startHearts: number;

  constructor(startHearts: number = HEARTS.start, maxHearts: number = HEARTS.max) {
    this.startHearts = startHearts;
    this.maxHearts = maxHearts;
    this.hearts = startHearts;
  }

  loseHeart(): number {
    if (this.hearts > 0) {
      this.hearts--;
    }
    return this.hearts;
  }

  gainHeart(): number {
    if (this.hearts < this.maxHearts) {
      this.hearts++;
    }
    return this.hearts;
  }

  getHearts(): number {
    return this.hearts;
  }

  getMaxHearts(): number {
    return this.maxHearts;
  }

  isDead(): boolean {
    return this.hearts <= 0;
  }

  reset(): void {
    this.hearts = this.startHearts;
  }
}
