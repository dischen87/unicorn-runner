import Phaser from 'phaser';
import { getHighScore, addToLeaderboard, getPlayer } from '../utils/storage';
import { UNICORNS } from '../utils/constants';
import { LeaderboardService } from '../services/LeaderboardService';

interface GameOverData {
  score: number;
  highScore: number;
  isNewRecord: boolean;
  level?: number;
  unicornKey?: string;
  fartCount?: number;
}

function getFunMessage(score: number): string {
  if (score >= 1000) return 'FURZ-LEGENDE!';
  if (score >= 500) return 'Mega-Furzer!';
  if (score >= 200) return 'Furztastisch!';
  if (score >= 50) return 'Nicht schlecht!';
  return 'Nächstes Mal mehr furzen!';
}

export class GameOverScene extends Phaser.Scene {
  private data_score = 0;
  private data_highScore = 0;
  private data_isNewRecord = false;
  private data_level = 1;
  private data_unicornKey = 'unicorn-pink';
  private data_fartCount = 0;

  constructor() {
    super({ key: 'GameOver' });
  }

  init(data: GameOverData): void {
    this.data_score = data.score ?? 0;
    this.data_highScore = data.highScore ?? getHighScore();
    this.data_isNewRecord = data.isNewRecord ?? false;
    this.data_level = data.level ?? 1;
    this.data_unicornKey = data.unicornKey ?? 'unicorn-pink';
    this.data_fartCount = data.fartCount ?? 0;

    // Save to leaderboard (old format for backward compat)
    const unicornInfo = UNICORNS.find(u => u.key === this.data_unicornKey);
    const unicornName = unicornInfo ? unicornInfo.name : 'Pinki';
    addToLeaderboard({
      name: unicornName,
      score: this.data_score,
      unicorn: this.data_unicornKey,
      level: this.data_level,
    });

    // Also submit to the new LeaderboardService (local + optional online)
    const player = getPlayer();
    const playerName = player ? player.name : unicornName;
    LeaderboardService.submitScore({
      playerName,
      playerId: LeaderboardService.getPlayerId(),
      score: this.data_score,
      level: this.data_level,
      unicorn: this.data_unicornKey,
      fartCount: this.data_fartCount,
    }).catch(() => {
      // Never let leaderboard errors break the game
    });
  }

  create(): void {
    const { width, height } = this.scale;

    // Background
    this.add.image(width / 2, height / 2, 'sky');
    this.add.image(width / 2, height - 60, 'hills').setAlpha(0.4);

    // Darken overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.4);
    overlay.fillRect(0, 0, width, height);

    // Sad unicorn (tinted gray, tilted)
    const sadUnicorn = this.add.image(width / 2, 80, 'unicorn')
      .setScale(2)
      .setTint(0xaaaacc)
      .setAngle(-15);

    // Gentle rocking
    this.tweens.add({
      targets: sadUnicorn,
      angle: 15,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Game Over title
    this.add.text(width / 2 + 2, 142, 'Game Over', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '40px',
      color: '#000000',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.3);

    this.add.text(width / 2, 140, 'Game Over', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '40px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#ff1744',
      strokeThickness: 5,
    }).setOrigin(0.5);

    // Fun message
    const funMsg = getFunMessage(this.data_score);
    const funText = this.add.text(width / 2, 172, funMsg, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#76ff03',
      fontStyle: 'bold',
      stroke: '#333333',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: funText,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Stats
    let statsY = 200;
    const statsGap = 26;

    // Score
    this.add.text(width / 2, statsY, `Punkte: ${this.data_score}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#333333',
      strokeThickness: 3,
    }).setOrigin(0.5);
    statsY += statsGap;

    // Level
    this.add.text(width / 2, statsY, `Level: ${this.data_level}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#80d8ff',
      stroke: '#333333',
      strokeThickness: 3,
    }).setOrigin(0.5);
    statsY += statsGap;

    // Fart count
    this.add.text(width / 2, statsY, `Fürze: ${this.data_fartCount}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#b2ff59',
      stroke: '#333333',
      strokeThickness: 3,
    }).setOrigin(0.5);
    statsY += statsGap;

    // Highscore
    this.add.text(width / 2, statsY, `Bestleistung: ${this.data_highScore}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#ffd600',
      stroke: '#333333',
      strokeThickness: 3,
    }).setOrigin(0.5);
    statsY += statsGap;

    // New record banner
    if (this.data_isNewRecord) {
      statsY += 4;
      const recordText = this.add.text(width / 2, statsY, 'Neuer Rekord!', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '26px',
        color: '#ffd600',
        fontStyle: 'bold',
        stroke: '#ff6f00',
        strokeThickness: 4,
      }).setOrigin(0.5);

      this.tweens.add({
        targets: recordText,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Star burst around the record text
      for (let i = 0; i < 6; i++) {
        const star = this.add.image(
          width / 2 + Math.cos(i * Math.PI / 3) * 120,
          statsY + Math.sin(i * Math.PI / 3) * 25,
          'star-collectible'
        ).setScale(0.5).setAlpha(0.6);

        this.tweens.add({
          targets: star,
          alpha: 0.2,
          scaleX: 0.3,
          scaleY: 0.3,
          duration: 800 + i * 100,
          yoyo: true,
          repeat: -1,
        });
      }
      statsY += 30;
    }

    // Buttons
    const btnY = Math.max(statsY + 20, this.data_isNewRecord ? 360 : 330);

    // "Nochmal" button — goes to Select scene
    this.createButton(width / 2 - 100, btnY, 'Nochmal', 0xff69b4, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => {
        this.scene.start('Select');
      });
    });

    // "Menu" button
    this.createButton(width / 2 + 100, btnY, 'Menu', 0x7c4dff, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => {
        this.scene.start('Menu');
      });
    });

    // Fade in
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    bgColor: number,
    onClick: () => void
  ): void {
    const bg = this.add.graphics();
    bg.fillStyle(bgColor, 1);
    bg.fillRoundedRect(x - 70, y - 22, 140, 44, 14);
    bg.lineStyle(2, 0xffffff, 1);
    bg.strokeRoundedRect(x - 70, y - 22, 140, 44, 14);

    const text = this.add.text(x, y, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const zone = this.add.zone(x, y, 140, 44).setInteractive({ useHandCursor: true });

    zone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(bgColor, 0.8);
      bg.fillRoundedRect(x - 70, y - 22, 140, 44, 14);
      bg.lineStyle(2, 0xffffff, 1);
      bg.strokeRoundedRect(x - 70, y - 22, 140, 44, 14);
      text.setScale(1.05);
    });

    zone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(bgColor, 1);
      bg.fillRoundedRect(x - 70, y - 22, 140, 44, 14);
      bg.lineStyle(2, 0xffffff, 1);
      bg.strokeRoundedRect(x - 70, y - 22, 140, 44, 14);
      text.setScale(1);
    });

    zone.on('pointerdown', onClick);
  }
}
