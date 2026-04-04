import Phaser from 'phaser';
import { UNICORN } from '../utils/constants';

export class Unicorn extends Phaser.Physics.Arcade.Sprite {
  public isInvulnerable = false;
  public canDoubleJump = false;

  private rainbowTween?: Phaser.Tweens.Tween;
  private invulnerabilityTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'unicorn');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    // Hitbox slightly smaller than visual sprite
    body.setSize(this.width * 0.7, this.height * 0.85);
    body.setOffset(this.width * 0.15, this.height * 0.15);
    body.setGravityY(600);
  }

  jump(): boolean {
    const body = this.body as Phaser.Physics.Arcade.Body;

    if (body.blocked.down || body.touching.down) {
      this.setVelocityY(UNICORN.jumpVelocity);
      return true;
    }

    if (this.canDoubleJump) {
      this.setVelocityY(UNICORN.doubleJumpVelocity);
      this.canDoubleJump = false;
      return true;
    }

    return false;
  }

  hit(): boolean {
    if (this.isInvulnerable) {
      return false;
    }

    // Flash red tint
    this.setTint(0xff0000);
    this.isInvulnerable = true;

    // Flicker effect during invulnerability
    this.scene.tweens.add({
      targets: this,
      alpha: 0.4,
      duration: 150,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        this.setAlpha(1);
      },
    });

    // Clear invulnerability after 1.5 seconds
    if (this.invulnerabilityTimer) {
      this.invulnerabilityTimer.destroy();
    }

    this.invulnerabilityTimer = this.scene.time.delayedCall(1500, () => {
      this.isInvulnerable = false;
      this.clearTint();
    });

    return true;
  }

  activateRainbow(): void {
    this.isInvulnerable = true;

    // Stop any existing rainbow tween
    if (this.rainbowTween) {
      this.rainbowTween.destroy();
    }

    const colors = [0xff0000, 0xff7700, 0xffff00, 0x00ff00, 0x0000ff, 0x8b00ff];
    let colorIndex = 0;

    this.rainbowTween = this.scene.tweens.addCounter({
      from: 0,
      to: colors.length - 1,
      duration: 600,
      repeat: -1,
      onUpdate: () => {
        colorIndex = (colorIndex + 1) % colors.length;
        this.setTint(colors[colorIndex]);
      },
    });

    // Clear after 5 seconds
    if (this.invulnerabilityTimer) {
      this.invulnerabilityTimer.destroy();
    }

    this.invulnerabilityTimer = this.scene.time.delayedCall(5000, () => {
      this.isInvulnerable = false;
      if (this.rainbowTween) {
        this.rainbowTween.destroy();
        this.rainbowTween = undefined;
      }
      this.clearTint();
    });
  }

  update(): void {
    // Check if unicorn fell off screen (shouldn't happen with world bounds, but safety check)
    if (this.y > this.scene.scale.height + 100) {
      this.setPosition(UNICORN.startX, UNICORN.groundY);
      this.setVelocity(0, 0);
    }
  }
}
