import Phaser from 'phaser';
import config from './config.ts';

const game = new Phaser.Game(config);
(window as unknown as Record<string, unknown>).__PHASER_GAME__ = game;

function resizeGame(): void {
  game.scale.resize(800, 400);
  game.scale.refresh();
}

window.addEventListener('resize', resizeGame);
