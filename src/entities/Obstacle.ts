import Phaser from 'phaser';
import { UNICORN } from '../utils/constants';

export type ObstacleType = 'rock' | 'cactus' | 'log' | 'bat' | 'firewall' | 'pit';

const OBSTACLE_BODY_CONFIG: Record<ObstacleType, { widthRatio: number; heightRatio: number }> = {
  rock: { widthRatio: 0.8, heightRatio: 0.75 },
  cactus: { widthRatio: 0.5, heightRatio: 0.9 },
  log: { widthRatio: 0.9, heightRatio: 0.6 },
  bat: { widthRatio: 0.7, heightRatio: 0.7 },
  firewall: { widthRatio: 0.8, heightRatio: 0.9 },
  pit: { widthRatio: 0.9, heightRatio: 0.5 },
};

export class Obstacle extends Phaser.Physics.Arcade.Sprite {
  public obstacleType: ObstacleType;

  constructor(scene: Phaser.Scene, x: number, y: number, type: ObstacleType) {
    super(scene, x, y, Obstacle.getTextureKey(type));

    this.obstacleType = type;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);

    // Set hitbox based on obstacle type
    const config = OBSTACLE_BODY_CONFIG[type];
    body.setSize(this.width * config.widthRatio, this.height * config.heightRatio);

    // Type-specific setup
    if (type === 'bat') {
      // Bob up and down
      scene.tweens.add({
        targets: this,
        y: y - 30,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    if (type === 'pit') {
      // Position at ground level
      this.setY(UNICORN.groundY + this.height * 0.5);
    }
  }

  static getTextureKey(type: ObstacleType): string {
    return type;
  }

  isOffScreen(): boolean {
    return this.x < -100;
  }
}
