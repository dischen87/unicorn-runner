import Phaser from 'phaser';

interface UnicornOption {
  key: string;
  name: string;
  description: string;
}

interface LevelOption {
  level: number;
  name: string;
  speedMultiplier: number;
}

const UNICORNS: UnicornOption[] = [
  { key: 'unicorn-pink', name: 'Pinki', description: 'Das Original!' },
  { key: 'unicorn-blue', name: 'Blitzi', description: 'Schnell wie der Blitz!' },
  { key: 'unicorn-gold', name: 'Goldi', description: 'Bling Bling!' },
  { key: 'unicorn-purple', name: 'Lila Fee', description: 'Magisch!' },
  { key: 'unicorn-rainbow', name: 'Regenbogen', description: 'Alle Farben!' },
];

const LEVELS: LevelOption[] = [
  { level: 1, name: 'Anfänger', speedMultiplier: 1.0 },
  { level: 2, name: 'Normal', speedMultiplier: 1.3 },
  { level: 3, name: 'Schnell', speedMultiplier: 1.6 },
  { level: 4, name: 'Turbo', speedMultiplier: 2.0 },
  { level: 5, name: 'WAHNSINN', speedMultiplier: 2.5 },
];

export class SelectScene extends Phaser.Scene {
  private selectedUnicornIndex = 0;
  private selectedLevelIndex = 0;

  // Display objects that get updated on selection
  private unicornSprites: Phaser.GameObjects.Image[] = [];
  private unicornGlows: Phaser.GameObjects.Graphics[] = [];
  private nameText!: Phaser.GameObjects.Text;
  private descText!: Phaser.GameObjects.Text;
  private levelButtons: { bg: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text; zone: Phaser.GameObjects.Zone }[] = [];
  private goButton!: Phaser.GameObjects.Container;
  private started = false;

  constructor() {
    super({ key: 'Select' });
  }

  create(): void {
    this.started = false;
    this.selectedUnicornIndex = 0;
    this.selectedLevelIndex = 0;
    this.unicornSprites = [];
    this.unicornGlows = [];
    this.levelButtons = [];

    const { width, height } = this.scale;

    // Background
    this.add.image(width / 2, height / 2, 'sky');
    this.add.image(width / 2, height - 60, 'hills').setAlpha(0.5);

    // Ground
    const groundStrip = this.add.tileSprite(width / 2, 370, width, 64, 'ground');
    groundStrip.setDepth(1);

    // Title with rainbow-ish gradient effect via multiple overlapping texts
    const titleY = 36;
    this.add.text(width / 2 + 2, titleY + 2, 'Wähle dein Einhorn!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '34px',
      color: '#000000',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.2).setDepth(10);

    const titleText = this.add.text(width / 2, titleY, 'Wähle dein Einhorn!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '34px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#ff69b4',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(10);

    // Gentle title pulse
    this.tweens.add({
      targets: titleText,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Unicorn selection area
    const unicornY = 120;
    const startX = 80;
    const spacingX = (width - 160) / (UNICORNS.length - 1);

    for (let i = 0; i < UNICORNS.length; i++) {
      const x = startX + i * spacingX;

      // Pedestal
      const pedestal = this.add.graphics();
      pedestal.fillStyle(0xdda0dd, 0.6);
      pedestal.fillRoundedRect(x - 28, unicornY + 28, 56, 14, 4);
      pedestal.fillStyle(0xc890c8, 0.4);
      pedestal.fillRoundedRect(x - 24, unicornY + 36, 48, 8, 3);
      pedestal.setDepth(5);

      // Glow circle (selection indicator)
      const glow = this.add.graphics();
      glow.setDepth(4);
      glow.setAlpha(0);
      this.unicornGlows.push(glow);

      // Unicorn sprite
      const sprite = this.add.image(x, unicornY, UNICORNS[i].key)
        .setScale(1.6)
        .setDepth(6);
      this.unicornSprites.push(sprite);

      // Bounce tween
      this.tweens.add({
        targets: sprite,
        y: unicornY - 6,
        duration: 700 + i * 120,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Name label under pedestal
      this.add.text(x, unicornY + 52, UNICORNS[i].name, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#333333',
        strokeThickness: 2,
      }).setOrigin(0.5).setDepth(10);

      // Click zone
      const zone = this.add.zone(x, unicornY + 10, 70, 80)
        .setInteractive({ useHandCursor: true })
        .setDepth(20);

      zone.on('pointerdown', () => {
        this.selectUnicorn(i);
      });

      zone.on('pointerover', () => {
        if (i !== this.selectedUnicornIndex) {
          sprite.setScale(1.8);
        }
      });

      zone.on('pointerout', () => {
        if (i !== this.selectedUnicornIndex) {
          sprite.setScale(1.6);
        }
      });
    }

    // Selected unicorn name + description (shown bigger)
    this.nameText = this.add.text(width / 2, 188, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#ff69b4',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(10);

    this.descText = this.add.text(width / 2, 210, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#ffe0f0',
      fontStyle: 'italic',
      stroke: '#333333',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(10);

    // Level selection section
    const levelTitleY = 240;
    this.add.text(width / 2, levelTitleY, 'Schwierigkeit:', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#7c4dff',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(10);

    const levelY = 270;
    const levelStartX = 70;
    const levelSpacing = (width - 140) / (LEVELS.length - 1);

    for (let i = 0; i < LEVELS.length; i++) {
      const lx = levelStartX + i * levelSpacing;
      const btnW = 110;
      const btnH = 32;

      const bg = this.add.graphics().setDepth(10);
      const text = this.add.text(lx, levelY, LEVELS[i].name, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(11);

      const zone = this.add.zone(lx, levelY, btnW, btnH)
        .setInteractive({ useHandCursor: true })
        .setDepth(20);

      this.levelButtons.push({ bg, text, zone });

      zone.on('pointerdown', () => {
        this.selectLevel(i);
      });

      zone.on('pointerover', () => {
        if (i !== this.selectedLevelIndex) {
          text.setScale(1.08);
        }
      });

      zone.on('pointerout', () => {
        if (i !== this.selectedLevelIndex) {
          text.setScale(1);
        }
      });
    }

    // "Los geht's!" button
    const goBtnY = 320;
    const goContainer = this.add.container(width / 2, goBtnY).setDepth(15);

    const goBg = this.add.graphics();
    goBg.fillStyle(0x4caf50, 1);
    goBg.fillRoundedRect(-90, -24, 180, 48, 16);
    goBg.lineStyle(3, 0xffffff, 1);
    goBg.strokeRoundedRect(-90, -24, 180, 48, 16);

    const goText = this.add.text(0, 0, "Los geht's!", {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    goContainer.add([goBg, goText]);
    goContainer.setAlpha(0);
    goContainer.setScale(0.8);
    this.goButton = goContainer;

    const goZone = this.add.zone(width / 2, goBtnY, 180, 48)
      .setInteractive({ useHandCursor: true })
      .setDepth(25)


    goZone.disableInteractive(); // disabled until unicorn selected

    goZone.on('pointerover', () => {
      goBg.clear();
      goBg.fillStyle(0x66bb6a, 1);
      goBg.fillRoundedRect(-90, -24, 180, 48, 16);
      goBg.lineStyle(3, 0xffffff, 1);
      goBg.strokeRoundedRect(-90, -24, 180, 48, 16);
      goText.setScale(1.05);
    });

    goZone.on('pointerout', () => {
      goBg.clear();
      goBg.fillStyle(0x4caf50, 1);
      goBg.fillRoundedRect(-90, -24, 180, 48, 16);
      goBg.lineStyle(3, 0xffffff, 1);
      goBg.strokeRoundedRect(-90, -24, 180, 48, 16);
      goText.setScale(1);
    });

    goZone.on('pointerdown', () => {
      this.startGame();
    });

    // Back button (top left)
    const backBg = this.add.graphics().setDepth(10);
    backBg.fillStyle(0x7c4dff, 0.8);
    backBg.fillRoundedRect(10, 8, 70, 28, 8);
    this.add.text(45, 22, 'Zurück', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11);

    this.add.zone(45, 22, 70, 28)
      .setInteractive({ useHandCursor: true })
      .setDepth(20)
      .on('pointerdown', () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.time.delayedCall(300, () => {
          this.scene.start('Menu');
        });
      });

    // Store reference to goZone BEFORE selecting (showGoButton needs it)
    (this as unknown as Record<string, unknown>)['_goZone'] = goZone;

    // Initialize selections
    this.selectUnicorn(0);
    this.selectLevel(0);

    // Fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  private selectUnicorn(index: number): void {
    this.selectedUnicornIndex = index;
    const { width } = this.scale;
    const startX = 80;
    const spacingX = (width - 160) / (UNICORNS.length - 1);
    const unicornY = 120;

    // Update all unicorn visuals
    for (let i = 0; i < UNICORNS.length; i++) {
      const x = startX + i * spacingX;
      const glow = this.unicornGlows[i];
      const sprite = this.unicornSprites[i];

      glow.clear();

      if (i === index) {
        // Draw selection glow
        glow.fillStyle(0xffd700, 0.3);
        glow.fillCircle(x, unicornY, 36);
        glow.fillStyle(0xffd700, 0.15);
        glow.fillCircle(x, unicornY, 44);
        glow.setVisible(true);

        sprite.setScale(2.0);

        // Pulse the selected sprite
        this.tweens.add({
          targets: sprite,
          scaleX: 2.1,
          scaleY: 2.1,
          duration: 600,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      } else {
        glow.setVisible(false);
        sprite.setScale(1.6);
      }
    }

    // Update name and description
    const unicorn = UNICORNS[index];
    this.nameText.setText(unicorn.name);
    this.descText.setText(unicorn.description);

    // Pop animation on name
    this.nameText.setScale(1.3);
    this.tweens.add({
      targets: this.nameText,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });

    // Show go button
    this.showGoButton();
  }

  private selectLevel(index: number): void {
    this.selectedLevelIndex = index;
    const { width } = this.scale;
    const levelStartX = 70;
    const levelSpacing = (width - 140) / (LEVELS.length - 1);
    const levelY = 270;

    // Level color gradient: green -> yellow -> orange -> red -> dark red
    const levelColors = [0x4caf50, 0xffc107, 0xff9800, 0xf44336, 0xb71c1c];

    for (let i = 0; i < LEVELS.length; i++) {
      const lx = levelStartX + i * levelSpacing;
      const btn = this.levelButtons[i];
      const btnW = 110;
      const btnH = 32;
      const isSelected = i === index;

      btn.bg.clear();
      if (isSelected) {
        btn.bg.fillStyle(levelColors[i], 1);
        btn.bg.fillRoundedRect(lx - btnW / 2, levelY - btnH / 2, btnW, btnH, 10);
        btn.bg.lineStyle(2, 0xffffff, 1);
        btn.bg.strokeRoundedRect(lx - btnW / 2, levelY - btnH / 2, btnW, btnH, 10);
        btn.text.setScale(1.1);
      } else {
        btn.bg.fillStyle(levelColors[i], 0.4);
        btn.bg.fillRoundedRect(lx - btnW / 2, levelY - btnH / 2, btnW, btnH, 10);
        btn.bg.lineStyle(1, 0xffffff, 0.5);
        btn.bg.strokeRoundedRect(lx - btnW / 2, levelY - btnH / 2, btnW, btnH, 10);
        btn.text.setScale(1);
      }
    }
  }

  private showGoButton(): void {
    const goZone = (this as unknown as Record<string, unknown>)['_goZone'] as Phaser.GameObjects.Zone;

    this.tweens.add({
      targets: this.goButton,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });

    goZone.setInteractive({ useHandCursor: true });
  }

  private startGame(): void {
    if (this.started) return;
    this.started = true;

    const unicorn = UNICORNS[this.selectedUnicornIndex];
    const level = LEVELS[this.selectedLevelIndex];

    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(400, () => {
      this.scene.start('Game', {
        unicornKey: unicorn.key,
        level: level.level,
        speedMultiplier: level.speedMultiplier,
      });
    });
  }
}
