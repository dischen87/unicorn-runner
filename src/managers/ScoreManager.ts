import { POINTS, COMBO, MILESTONES } from '../utils/constants';
import type { MilestoneReward } from '../utils/constants';

export class ScoreManager {
  private scene: Phaser.Scene;
  private score: number = 0;
  private comboCount: number = 0;
  private comboMultiplier: number = 1;
  private comboTimer: Phaser.Time.TimerEvent | null = null;
  private awardedMilestoneIndices: Set<number> = new Set();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  addPoints(base: number): number {
    const points = base * this.comboMultiplier;
    this.score += points;
    return points;
  }

  addSurvivalPoint(): void {
    this.score += POINTS.perSecond;
  }

  obstacleCleared(): void {
    this.comboCount++;
    if (this.comboCount >= COMBO.threshold) {
      this.activateCombo();
    }
  }

  activateCombo(): void {
    this.comboMultiplier = COMBO.multiplier;

    if (this.comboTimer) {
      this.comboTimer.remove(false);
    }

    this.comboTimer = this.scene.time.addEvent({
      delay: COMBO.duration,
      callback: () => {
        this.comboMultiplier = 1;
        this.comboCount = 0;
        this.comboTimer = null;
      },
    });
  }

  getScore(): number {
    return this.score;
  }

  getComboMultiplier(): number {
    return this.comboMultiplier;
  }

  reset(): void {
    this.score = 0;
    this.comboCount = 0;
    this.comboMultiplier = 1;

    if (this.comboTimer) {
      this.comboTimer.remove(false);
      this.comboTimer = null;
    }

    this.awardedMilestoneIndices.clear();
  }

  checkMilestones(): MilestoneReward[] {
    const rewards: MilestoneReward[] = [];

    // Check fixed milestones
    for (let i = 0; i < MILESTONES.length; i++) {
      if (this.score >= MILESTONES[i].score && !this.awardedMilestoneIndices.has(i)) {
        this.awardedMilestoneIndices.add(i);
        rewards.push(MILESTONES[i].reward);
      }
    }

    // Check repeating milestones every 2500 after 5000
    const lastFixedScore = MILESTONES[MILESTONES.length - 1].score; // 5000
    const repeatingInterval = 2500;

    if (this.score > lastFixedScore) {
      const repeatingCount = Math.floor((this.score - lastFixedScore) / repeatingInterval);
      for (let i = 1; i <= repeatingCount; i++) {
        const milestoneIndex = MILESTONES.length + i - 1;
        if (!this.awardedMilestoneIndices.has(milestoneIndex)) {
          this.awardedMilestoneIndices.add(milestoneIndex);
          rewards.push('heart');
        }
      }
    }

    return rewards;
  }
}
