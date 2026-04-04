import Phaser from 'phaser';

export class HeartsDisplay {
  private scene: Phaser.Scene;
  hearts: Phaser.GameObjects.Image[] = [];
  private lastHearts: number = -1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.createHearts(x, y);

    scene.events.on(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  private createHearts(x: number, y: number): void {
    // Pre-create max possible hearts (use 5 as safe default)
    for (let i = 0; i < 5; i++) {
      const heart = this.scene.add.image(x + i * 30, y, 'heart-icon');
      heart.setDisplaySize(24, 24);
      heart.setDepth(100);
      heart.setScrollFactor(0);
      this.hearts.push(heart);
    }
  }

  update(currentHearts: number, maxHearts: number): void {
    // Ensure we have enough heart images
    while (this.hearts.length < maxHearts) {
      const lastHeart = this.hearts[this.hearts.length - 1];
      const heart = this.scene.add.image(
        lastHeart.x + 30,
        lastHeart.y,
        'heart-icon'
      );
      heart.setDisplaySize(24, 24);
      heart.setDepth(100);
      heart.setScrollFactor(0);
      this.hearts.push(heart);
    }

    for (let i = 0; i < this.hearts.length; i++) {
      if (i < maxHearts) {
        this.hearts[i].setVisible(true);
        const shouldBeFilled = i < currentHearts;
        const textureKey = shouldBeFilled ? 'heart-icon' : 'heart-empty';
        this.hearts[i].setTexture(textureKey);
      } else {
        this.hearts[i].setVisible(false);
      }
    }

    // Pulse animation when hearts changed
    if (this.lastHearts >= 0 && this.lastHearts !== currentHearts) {
      const changedIndex =
        currentHearts < this.lastHearts ? currentHearts : currentHearts - 1;

      if (changedIndex >= 0 && changedIndex < this.hearts.length) {
        const target = this.hearts[changedIndex];
        this.scene.tweens.add({
          targets: target,
          scaleX: { from: 1.5, to: 1 },
          scaleY: { from: 1.5, to: 1 },
          duration: 300,
          ease: 'Back.easeOut',
        });
      }
    }

    this.lastHearts = currentHearts;
  }

  private destroy(): void {
    this.scene.tweens.killTweensOf(this.hearts);
    this.hearts.forEach((h) => h.destroy());
    this.hearts = [];
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }
}
