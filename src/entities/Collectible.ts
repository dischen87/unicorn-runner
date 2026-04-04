import Phaser from 'phaser';
import { POINTS } from '../utils/constants';

export type CollectibleType = 'heart' | 'star' | 'rainbow' | 'cupcake';

export class Collectible extends Phaser.Physics.Arcade.Sprite {
  public collectibleType: CollectibleType;

  constructor(scene: Phaser.Scene, x: number, y: number, type: CollectibleType) {
    super(scene, x, y, type);

    this.collectibleType = type;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setSize(this.width * 0.8, this.height * 0.8);

    // Floating bob animation
    scene.tweens.add({
      targets: this,
      y: y - 15,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  getPoints(): number {
    switch (this.collectibleType) {
      case 'heart':
        return POINTS.perHeart;
      case 'star':
        return POINTS.perStar;
      case 'rainbow':
        return 0;
      case 'cupcake':
        return 0;
      default:
        return 0;
    }
  }

  isOffScreen(): boolean {
    return this.x < -50;
  }
}
