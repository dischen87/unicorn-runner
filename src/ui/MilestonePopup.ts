import Phaser from 'phaser';

export class MilestonePopup {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private bg: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;
  private particles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // Background rounded rectangle
    this.bg = scene.add.graphics();
    this.drawBackground(300, 40);

    // Milestone text
    this.text = scene.add.text(0, 0, '', {
      fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center',
    });
    this.text.setOrigin(0.5);

    this.container = scene.add.container(
      Number(scene.sys.game.config.width) / 2,
      -50,
      [this.bg, this.text]
    );
    this.container.setDepth(110);
    this.container.setScrollFactor(0);
    this.container.setVisible(false);
    this.container.setAlpha(0);

    scene.events.on(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  private drawBackground(width: number, height: number): void {
    this.bg.clear();
    this.bg.fillStyle(0xcc44aa, 0.85);
    this.bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    this.bg.lineStyle(2, 0xffaadd, 1);
    this.bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
  }

  show(message: string): void {
    this.text.setText(message);

    // Resize background to fit text
    const padding = 40;
    const bgWidth = Math.max(this.text.width + padding, 200);
    const bgHeight = this.text.height + 20;
    this.drawBackground(bgWidth, bgHeight);

    this.container.setVisible(true);
    this.container.setAlpha(1);
    this.container.setY(-50);

    // Sparkle particles
    this.emitSparkles();

    // Slide in from top
    this.scene.tweens.add({
      targets: this.container,
      y: 50,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Hold for 2 seconds, then slide back up
        this.scene.time.delayedCall(2000, () => {
          this.scene.tweens.add({
            targets: this.container,
            y: -50,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
              this.container.setVisible(false);
              if (this.particles) {
                this.particles.stop();
              }
            },
          });
        });
      },
    });
  }

  private emitSparkles(): void {
    // Create a small star/sparkle texture if not already cached
    const sparkleKey = '__milestone_sparkle';
    if (!this.scene.textures.exists(sparkleKey)) {
      const gfx = this.scene.add.graphics();
      gfx.fillStyle(0xffffff, 1);
      gfx.fillCircle(4, 4, 4);
      gfx.generateTexture(sparkleKey, 8, 8);
      gfx.destroy();
    }

    if (this.particles) {
      this.particles.stop();
    }

    this.particles = this.scene.add.particles(0, 0, sparkleKey, {
      x: { min: -120, max: 120 },
      y: { min: -20, max: 20 },
      speed: { min: 30, max: 80 },
      angle: { min: 0, max: 360 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: [0xffff00, 0xff69b4, 0x00ffff, 0xffffff, 0xff00ff],
      lifespan: 800,
      frequency: 60,
      quantity: 2,
      blendMode: 'ADD',
    });
    this.particles.setDepth(111);
    this.particles.setScrollFactor(0);

    // Bind particle emitter position to container
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.updateParticlePos, this);
  }

  private updateParticlePos = (): void => {
    if (this.particles && this.container.visible) {
      this.particles.setPosition(this.container.x, this.container.y);
    }
  };

  private destroy(): void {
    this.scene.tweens.killTweensOf(this.container);
    if (this.particles) {
      this.particles.destroy();
      this.particles = null;
    }
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.updateParticlePos, this);
    this.container.destroy();
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }
}
