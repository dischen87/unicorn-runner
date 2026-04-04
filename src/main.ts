import Phaser from 'phaser';
import config from './config.ts';
import { LeaderboardService } from './services/LeaderboardService.ts';

const game = new Phaser.Game(config);
(window as unknown as Record<string, unknown>).__PHASER_GAME__ = game;

function resizeGame(): void {
  game.scale.resize(800, 400);
  game.scale.refresh();
}

window.addEventListener('resize', resizeGame);

// Sync local scores to server if online mode is configured
if (LeaderboardService.isOnline()) {
  LeaderboardService.syncLocalToServer().catch(() => {
    // Sync failed silently — will retry next session
  });
}
