import Phaser from 'phaser';

export class ScoreDisplay {
  private scene: Phaser.Scene;
  scoreText: Phaser.GameObjects.Text;
  displayedScore: number = 0;
  private countTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    this.scoreText = scene.add.text(x, y, '0', {
      fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'right',
    });
    this.scoreText.setOrigin(1, 0);
    this.scoreText.setDepth(100);
    this.scoreText.setScrollFactor(0);

    scene.events.on(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  update(score: number): void {
    if (score === this.displayedScore) return;

    if (this.countTween) {
      this.countTween.stop();
    }

    const startScore = this.displayedScore;

    this.countTween = this.scene.tweens.addCounter({
      from: startScore,
      to: score,
      duration: Math.min(400, Math.abs(score - startScore) * 20),
      ease: 'Linear',
      onUpdate: (tween) => {
        this.displayedScore = Math.round(tween.getValue() ?? 0);
        this.scoreText.setText(this.displayedScore.toString());
      },
      onComplete: () => {
        this.displayedScore = score;
        this.scoreText.setText(score.toString());
        this.countTween = null;
      },
    });
  }

  private destroy(): void {
    if (this.countTween) {
      this.countTween.stop();
      this.countTween = null;
    }
    this.scoreText.destroy();
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }
}
