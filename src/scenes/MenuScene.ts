import Phaser from 'phaser';
import { getHighScore, getPlayer, clearPlayer } from '../utils/storage';
import { LeaderboardService } from '../services/LeaderboardService';
import type { LeaderboardEntry } from '../services/LeaderboardService';
import { UNICORNS } from '../utils/constants';

export class MenuScene extends Phaser.Scene {
  private unicornSprite!: Phaser.GameObjects.Image;
  private started = false;
  private leaderboardOverlay: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'Menu' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Background: sky image
    this.add.image(width / 2, height / 2, 'sky');

    // Hills parallax layer
    this.add.image(width / 2, height - 60, 'hills').setAlpha(0.6);

    // Ground strip at bottom
    const groundStrip = this.add.tileSprite(width / 2, 370, width, 64, 'ground');
    groundStrip.setDepth(1);

    // Floating decorative stars
    for (let i = 0; i < 5; i++) {
      const star = this.add.image(
        100 + i * 160,
        60 + Math.random() * 40,
        'star-collectible'
      ).setScale(0.6).setAlpha(0.4);
      this.tweens.add({
        targets: star,
        y: star.y - 10,
        alpha: 0.7,
        duration: 1500 + i * 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Title with shadow
    this.add.text(width / 2 + 2, 72, 'Unicorn Runner', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '48px',
      color: '#000000',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.2);

    this.add.text(width / 2, 70, 'Unicorn Runner', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#ff69b4',
      strokeThickness: 6,
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, 115, 'Von Emilia & Mathias', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#ffe0f0',
      fontStyle: 'italic',
    }).setOrigin(0.5);

    // Bouncing unicorn
    this.unicornSprite = this.add.image(width / 2, 200, 'unicorn')
      .setScale(2);
    this.tweens.add({
      targets: this.unicornSprite,
      y: 190,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // "Spielen" button -> goes to Select scene now
    const btnX = width / 2;
    const btnY = 270;
    this.createButton(btnX, btnY, 'Spielen', 0xff69b4, 160, () => {
      this.goToSelect();
    });

    // "Bestenliste" button
    const lbBtnY = 318;
    this.createButton(btnX, lbBtnY, 'Bestenliste', 0x7c4dff, 160, () => {
      this.showLeaderboard();
    });

    // Player greeting
    const player = getPlayer();
    if (player) {
      this.add.text(width / 2, 350, `Hallo, ${player.name}!`, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#ffe0f0',
        fontStyle: 'italic',
        stroke: '#333333',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(2);
    }

    // Highscore display
    const highScore = getHighScore();
    this.add.text(width / 2, 370, `Highscore: ${highScore}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#333333',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(2);

    // "Spieler wechseln" link at bottom-right
    const switchText = this.add.text(width - 16, height - 12, 'Spieler wechseln', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#ffe0f0',
    }).setOrigin(1, 1).setDepth(2).setInteractive({ useHandCursor: true });

    switchText.on('pointerover', () => switchText.setColor('#ffffff'));
    switchText.on('pointerout', () => switchText.setColor('#ffe0f0'));
    switchText.on('pointerdown', () => {
      clearPlayer();
      this.scene.start('Register');
    });

    // Fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.started = false;
    this.leaderboardOverlay = null;
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    bgColor: number,
    btnWidth: number,
    onClick: () => void
  ): void {
    const btnBg = this.add.graphics();
    btnBg.fillStyle(bgColor, 1);
    btnBg.fillRoundedRect(x - btnWidth / 2, y - 22, btnWidth, 44, 14);
    btnBg.lineStyle(3, 0xffffff, 1);
    btnBg.strokeRoundedRect(x - btnWidth / 2, y - 22, btnWidth, 44, 14);

    const btnText = this.add.text(x, y, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const btnZone = this.add.zone(x, y, btnWidth, 44)
      .setInteractive({ useHandCursor: true });

    btnZone.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(bgColor, 0.8);
      btnBg.fillRoundedRect(x - btnWidth / 2, y - 22, btnWidth, 44, 14);
      btnBg.lineStyle(3, 0xffffff, 1);
      btnBg.strokeRoundedRect(x - btnWidth / 2, y - 22, btnWidth, 44, 14);
      btnText.setScale(1.05);
    });

    btnZone.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(bgColor, 1);
      btnBg.fillRoundedRect(x - btnWidth / 2, y - 22, btnWidth, 44, 14);
      btnBg.lineStyle(3, 0xffffff, 1);
      btnBg.strokeRoundedRect(x - btnWidth / 2, y - 22, btnWidth, 44, 14);
      btnText.setScale(1);
    });

    btnZone.on('pointerdown', onClick);
  }

  private goToSelect(): void {
    if (this.started) return;
    this.started = true;
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      this.scene.start('Select');
    });
  }

  private showLeaderboard(): void {
    if (this.leaderboardOverlay) return;

    const { width, height } = this.scale;
    const container = this.add.container(0, 0).setDepth(50);
    const interactiveZones: Phaser.GameObjects.Zone[] = [];

    // Dark overlay background
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.7);
    bg.fillRect(0, 0, width, height);
    container.add(bg);

    // Panel
    const panelX = width / 2 - 170;
    const panelY = 15;
    const panelW = 340;
    const panelH = 370;
    const panel = this.add.graphics();
    panel.fillStyle(0x2a1a4a, 0.95);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 16);
    panel.lineStyle(3, 0xff69b4, 1);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 16);
    container.add(panel);

    // Title
    const title = this.add.text(width / 2, panelY + 24, 'Bestenliste', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#ffd600',
      fontStyle: 'bold',
      stroke: '#333333',
      strokeThickness: 3,
    }).setOrigin(0.5);
    container.add(title);

    // Online/Local mode indicator
    const modeLabel = LeaderboardService.isOnline() ? 'Online' : 'Lokal';
    const modeColor = LeaderboardService.isOnline() ? '#76ff03' : '#80d8ff';
    const modeText = this.add.text(width / 2, panelY + 44, modeLabel, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: modeColor,
    }).setOrigin(0.5);
    container.add(modeText);

    // Loading indicator
    const loadingText = this.add.text(width / 2, panelY + 170, 'Laden...', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#ffe0f0',
      fontStyle: 'italic',
    }).setOrigin(0.5);
    container.add(loadingText);

    const destroyOverlay = () => {
      container.destroy();
      interactiveZones.forEach(z => z.destroy());
      this.leaderboardOverlay = null;
    };

    // Pagination state
    const ENTRIES_PER_PAGE = 10;
    let currentPage = 0;
    let allEntries: LeaderboardEntry[] = [];
    const currentPlayerId = LeaderboardService.getPlayerId();

    const renderEntries = () => {
      // Remove old dynamic elements (tagged with name 'lb-entry')
      container.getAll().forEach(child => {
        if ((child as Phaser.GameObjects.GameObject & { name?: string }).name === 'lb-entry') {
          child.destroy();
        }
      });
      // Remove old pagination zones
      const oldPageZones = interactiveZones.filter(z => z.name === 'lb-page');
      oldPageZones.forEach(z => {
        z.destroy();
        const idx = interactiveZones.indexOf(z);
        if (idx >= 0) interactiveZones.splice(idx, 1);
      });

      const start = currentPage * ENTRIES_PER_PAGE;
      const pageEntries = allEntries.slice(start, start + ENTRIES_PER_PAGE);
      const totalPages = Math.max(1, Math.ceil(allEntries.length / ENTRIES_PER_PAGE));

      if (pageEntries.length === 0) {
        const noData = this.add.text(width / 2, panelY + 170, 'Noch keine Eintr\u00e4ge!', {
          fontFamily: 'Arial, sans-serif',
          fontSize: '18px',
          color: '#ffe0f0',
          fontStyle: 'italic',
        }).setOrigin(0.5);
        noData.name = 'lb-entry';
        container.add(noData);
        return;
      }

      // Column header
      const headerY = panelY + 56;
      const header = this.add.text(panelX + 12, headerY, '#   Name              Punkte  Lv', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#aaaacc',
      });
      header.name = 'lb-entry';
      container.add(header);

      for (let i = 0; i < pageEntries.length; i++) {
        const entry = pageEntries[i];
        const globalRank = start + i + 1;
        const ey = panelY + 72 + i * 24;
        const rankColors = ['#ffd600', '#c0c0c0', '#cd7f32'];
        const isCurrentPlayer = entry.playerId === currentPlayerId;
        const color = globalRank <= 3 ? rankColors[globalRank - 1] : isCurrentPlayer ? '#ff80ab' : '#ffffff';

        // Resolve unicorn display name
        const unicornInfo = UNICORNS.find(u => u.key === entry.unicorn);
        const unicornDisplay = unicornInfo ? unicornInfo.name : entry.unicorn;

        // Format date
        let dateStr = '';
        try {
          const d = new Date(entry.date);
          dateStr = d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        } catch {
          /* skip */
        }

        const rankStr = String(globalRank).padStart(2, ' ');
        const nameStr = entry.playerName.slice(0, 12).padEnd(12, ' ');
        const scoreStr = String(entry.score).padStart(6, ' ');

        const line = this.add.text(
          panelX + 12,
          ey,
          `${rankStr}. ${nameStr} ${scoreStr}  L${entry.level}`,
          {
            fontFamily: 'monospace',
            fontSize: '12px',
            color,
            stroke: '#000000',
            strokeThickness: 1,
          }
        );
        line.name = 'lb-entry';
        container.add(line);

        // Detail line: unicorn name, date, fart count
        const detail = this.add.text(
          panelX + 40,
          ey + 12,
          `${unicornDisplay}  ${dateStr}  ${entry.fartCount} F\u00fcrze`,
          {
            fontFamily: 'Arial, sans-serif',
            fontSize: '9px',
            color: isCurrentPlayer ? '#ff80ab' : '#8888aa',
          }
        );
        detail.name = 'lb-entry';
        container.add(detail);
      }

      // Pagination controls
      if (totalPages > 1) {
        const pageY = panelY + panelH - 62;
        const pageInfo = this.add.text(width / 2, pageY, `Seite ${currentPage + 1} / ${totalPages}`, {
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          color: '#cccccc',
        }).setOrigin(0.5);
        pageInfo.name = 'lb-entry';
        container.add(pageInfo);

        if (currentPage > 0) {
          const prevBg = this.add.graphics();
          prevBg.fillStyle(0x7c4dff, 1);
          prevBg.fillRoundedRect(panelX + 16, pageY - 12, 50, 24, 8);
          prevBg.name = 'lb-entry';
          container.add(prevBg);
          const prevText = this.add.text(panelX + 41, pageY, '\u25C0', {
            fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#ffffff',
          }).setOrigin(0.5);
          prevText.name = 'lb-entry';
          container.add(prevText);
          const prevZone = this.add.zone(panelX + 41, pageY, 50, 24)
            .setInteractive({ useHandCursor: true }).setDepth(52);
          prevZone.name = 'lb-page';
          interactiveZones.push(prevZone);
          prevZone.on('pointerdown', () => { currentPage--; renderEntries(); });
        }

        if (currentPage < totalPages - 1) {
          const nextBg = this.add.graphics();
          nextBg.fillStyle(0x7c4dff, 1);
          nextBg.fillRoundedRect(panelX + panelW - 66, pageY - 12, 50, 24, 8);
          nextBg.name = 'lb-entry';
          container.add(nextBg);
          const nextText = this.add.text(panelX + panelW - 41, pageY, '\u25B6', {
            fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#ffffff',
          }).setOrigin(0.5);
          nextText.name = 'lb-entry';
          container.add(nextText);
          const nextZone = this.add.zone(panelX + panelW - 41, pageY, 50, 24)
            .setInteractive({ useHandCursor: true }).setDepth(52);
          nextZone.name = 'lb-page';
          interactiveZones.push(nextZone);
          nextZone.on('pointerdown', () => { currentPage++; renderEntries(); });
        }
      }
    };

    // Fetch leaderboard data asynchronously
    LeaderboardService.getLeaderboard(50).then(entries => {
      allEntries = entries;
      loadingText.destroy();
      renderEntries();
    }).catch(() => {
      loadingText.setText('Fehler beim Laden');
    });

    // Close button
    const closeBtnY = panelY + panelH - 30;
    const closeBg = this.add.graphics();
    closeBg.fillStyle(0xff69b4, 1);
    closeBg.fillRoundedRect(width / 2 - 50, closeBtnY - 14, 100, 28, 10);
    container.add(closeBg);

    const closeText = this.add.text(width / 2, closeBtnY, 'Schlie\u00dfen', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(closeText);

    const closeZone = this.add.zone(width / 2, closeBtnY, 100, 28)
      .setInteractive({ useHandCursor: true })
      .setDepth(51);
    interactiveZones.push(closeZone);

    closeZone.on('pointerdown', destroyOverlay);

    // Also close when clicking the dark background
    bg.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, width, height),
      Phaser.Geom.Rectangle.Contains
    );
    bg.on('pointerdown', destroyOverlay);

    this.leaderboardOverlay = container;
  }
}
