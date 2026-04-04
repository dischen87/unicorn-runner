import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.ts';
import { RegisterScene } from './scenes/RegisterScene.ts';
import { MenuScene } from './scenes/MenuScene.ts';
import { SelectScene } from './scenes/SelectScene.ts';
import { GameScene } from './scenes/GameScene.ts';
import { GameOverScene } from './scenes/GameOverScene.ts';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 400,
  backgroundColor: '#87CEEB',
  parent: 'app',
  dom: {
    createContainer: true,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 800 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, RegisterScene, MenuScene, SelectScene, GameScene, GameOverScene],
};

export default config;
