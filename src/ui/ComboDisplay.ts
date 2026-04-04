import Phaser from 'phaser';

export class ComboDisplay {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private comboText: Phaser.GameObjects.Text;
  private glowText: Phaser.GameObjects.Text;
  private pulseTween: Phaser.Tweens.Tween | null = null;
  private bounceTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;

    // Glow layer behind the main text
    this.glowText = scene.add.text(0, 0, 'x2 COMBO!', {
      fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
      fontSize: '28px',
      color: '#ff0000',
      fontStyle: 'bold',
      stroke: '#ff6600',
      strokeThickness: 6,
    });
    this.glowText.setOrigin(0.5);
    this.glowText.setAlpha(0.5);

    // Main combo text
    this.comboText = scene.add.text(0, 0, 'x2 COMBO!', {
      fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
      fontSize: '28px',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#ff00ff',
      strokeThickness: 4,
    });
    this.comboText.setOrigin(0.5);

    this.container = scene.add.container(x, y, [this.glowText, this.comboText]);
    this.container.setDepth(100);
    this.container.setScrollFactor(0);
    this.container.setVisible(false);
    this.container.setAlpha(0);

    scene.events.on(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  show(): void {
    this.container.setVisible(true);
    this.container.setScale(0);
    this.container.setAlpha(1);

    // Scale-in animation
    this.scene.tweens.add({
      targets: this.container,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });

    // Pulsing glow effect
    this.pulseTween = this.scene.tweens.add({
      targets: this.glowText,
      alpha: { from: 0.3, to: 0.7 },
      scaleX: { from: 1, to: 1.1 },
      scaleY: { from: 1, to: 1.1 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Bouncing animation
    this.bounceTween = this.scene.tweens.add({
      targets: this.container,
      y: this.container.y - 5,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Cycle rainbow stroke colors
    this.cycleColors();
  }

  hide(): void {
    if (this.pulseTween) {
      this.pulseTween.stop();
      this.pulseTween = null;
    }
    if (this.bounceTween) {
      this.bounceTween.stop();
      this.bounceTween = null;
    }

    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      scaleX: 0.5,
      scaleY: 0.5,
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.container.setVisible(false);
      },
    });
  }

  private cycleColors(): void {
    const colors = ['#ff00ff', '#ff0000', '#ff6600', '#00ff00', '#00ccff', '#6600ff'];
    let index = 0;

    this.scene.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => {
        if (!this.container.visible) return;
        index = (index + 1) % colors.length;
        this.comboText.setStroke(colors[index], 4);
      },
    });
  }

  private destroy(): void {
    if (this.pulseTween) {
      this.pulseTween.stop();
      this.pulseTween = null;
    }
    if (this.bounceTween) {
      this.bounceTween.stop();
      this.bounceTween = null;
    }
    this.container.destroy();
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }
}
