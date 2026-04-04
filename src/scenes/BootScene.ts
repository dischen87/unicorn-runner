import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload(): void {
    this.generateUnicornVariants();
    this.generateGround();
    this.generateObstacles();
    this.generateCollectibles();
    this.generateBackgrounds();
    this.generateFartCloud();
    this.generateToilet();
    this.generateUI();
  }

  create(): void {
    this.scene.start('Register');
  }

  // ── Helper to draw a cute unicorn at given size with color config ──
  private drawUnicorn(
    g: Phaser.GameObjects.Graphics,
    body: number,
    maneColors: number[],
    hornColor: number,
    hoofColor: number,
    extraSparkle: boolean,
  ): void {
    // --- Body (rounded) ---
    g.fillStyle(body);
    g.fillRoundedRect(10, 22, 42, 32, 12);

    // --- Head ---
    g.fillStyle(body);
    g.fillCircle(52, 22, 14);

    // --- Ear ---
    g.fillStyle(body);
    g.fillTriangle(46, 10, 50, 2, 54, 10);

    // --- Horn (golden triangle with sparkle dots) ---
    g.fillStyle(hornColor);
    g.fillTriangle(54, 10, 50, -4, 58, 6);
    // Sparkle dots on horn
    g.fillStyle(0xffffff);
    g.fillCircle(53, 4, 1.5);
    g.fillCircle(55, 0, 1);
    g.fillCircle(52, 7, 1);
    if (extraSparkle) {
      g.fillStyle(0xffff00, 0.8);
      g.fillCircle(56, 2, 1.5);
      g.fillCircle(51, 5, 1.5);
      g.fillCircle(54, -2, 1);
    }

    // --- Big sparkly eyes ---
    // Eye white
    g.fillStyle(0xffffff);
    g.fillCircle(56, 22, 5);
    // Iris
    g.fillStyle(0x6a1b9a);
    g.fillCircle(57, 22, 3.5);
    // Pupil
    g.fillStyle(0x000000);
    g.fillCircle(57.5, 22, 2);
    // Eye shine (two sparkles)
    g.fillStyle(0xffffff);
    g.fillCircle(58.5, 20.5, 1.5);
    g.fillCircle(56, 23, 0.8);
    // Eyelashes
    g.lineStyle(1.5, 0x000000);
    g.beginPath();
    g.moveTo(52, 18); g.lineTo(50, 16);
    g.moveTo(54, 17); g.lineTo(53, 14.5);
    g.moveTo(56, 17); g.lineTo(56, 15);
    g.strokePath();

    // --- Cute smile ---
    g.lineStyle(1.5, 0xcc3366);
    g.beginPath();
    g.arc(56, 26, 3, Phaser.Math.DegToRad(10), Phaser.Math.DegToRad(170), false);
    g.strokePath();

    // --- Blush ---
    g.fillStyle(0xff99cc, 0.4);
    g.fillCircle(60, 26, 3);

    // --- Rainbow Mane (flowing circles/arcs along neck) ---
    const manePositions = [
      { x: 42, y: 12, r: 5 },
      { x: 38, y: 16, r: 4.5 },
      { x: 35, y: 20, r: 4 },
      { x: 33, y: 24, r: 3.5 },
      { x: 46, y: 8, r: 4 },
      { x: 48, y: 14, r: 3.5 },
    ];
    for (let i = 0; i < manePositions.length; i++) {
      const c = maneColors[i % maneColors.length];
      g.fillStyle(c, 0.9);
      g.fillCircle(manePositions[i].x, manePositions[i].y, manePositions[i].r);
    }

    // --- Rainbow Tail (flowing circles behind body) ---
    const tailPositions = [
      { x: 6, y: 28, r: 6 },
      { x: 3, y: 34, r: 5 },
      { x: 5, y: 40, r: 4.5 },
      { x: 2, y: 46, r: 4 },
      { x: 8, y: 24, r: 4 },
    ];
    for (let i = 0; i < tailPositions.length; i++) {
      const c = maneColors[i % maneColors.length];
      g.fillStyle(c, 0.85);
      g.fillCircle(tailPositions[i].x, tailPositions[i].y, tailPositions[i].r);
    }

    // --- Legs ---
    g.fillStyle(body);
    g.fillRoundedRect(16, 52, 7, 12, 2);
    g.fillRoundedRect(27, 52, 7, 12, 2);
    g.fillRoundedRect(37, 52, 7, 12, 2);

    // --- Hooves ---
    g.fillStyle(hoofColor);
    g.fillRoundedRect(15, 61, 9, 4, 2);
    g.fillRoundedRect(26, 61, 9, 4, 2);
    g.fillRoundedRect(36, 61, 9, 4, 2);
  }

  private generateUnicornVariants(): void {
    const rainbowMane = [0xff0000, 0xff8800, 0xffff00, 0x00cc44, 0x0088ff, 0xaa00ff];
    const silverMane = [0xc0c0c0, 0xd8d8d8, 0xe8e8e8, 0xb0b0b0, 0xf0f0f0, 0xa8a8a8];
    const whiteMane = [0xffffff, 0xfffde0, 0xfff8c0, 0xffffff, 0xfffacd, 0xfff0b0];
    const pinkMane = [0xff69b4, 0xff85c8, 0xff99cc, 0xff5599, 0xffaadd, 0xff77bb];
    const allColorsMane = [0xff0000, 0xff8800, 0xffff00, 0x00cc44, 0x0088ff, 0xaa00ff];

    const variants: {
      key: string;
      body: number;
      mane: number[];
      horn: number;
      hoof: number;
      sparkle: boolean;
    }[] = [
      { key: 'unicorn-pink', body: 0xff69b4, mane: rainbowMane, horn: 0xffd700, hoof: 0xff99cc, sparkle: false },
      { key: 'unicorn-blue', body: 0x64b5f6, mane: silverMane, horn: 0xc0c0c0, hoof: 0x90caf9, sparkle: false },
      { key: 'unicorn-gold', body: 0xffd54f, mane: whiteMane, horn: 0xffd700, hoof: 0xffcc02, sparkle: true },
      { key: 'unicorn-purple', body: 0xce93d8, mane: pinkMane, horn: 0xffd700, hoof: 0xe1bee7, sparkle: false },
      { key: 'unicorn-rainbow', body: 0xff69b4, mane: allColorsMane, horn: 0xffd700, hoof: 0xff99cc, sparkle: true },
    ];

    for (const v of variants) {
      if (!this.textures.exists(v.key)) {
        const g = this.make.graphics({}, false);

        // For rainbow variant, paint body with stripes
        if (v.key === 'unicorn-rainbow') {
          const stripeColors = [0xff6666, 0xffaa44, 0xffff66, 0x66dd66, 0x66aaff, 0xcc66ff];
          for (let i = 0; i < stripeColors.length; i++) {
            g.fillStyle(stripeColors[i]);
            g.fillRect(10 + i * 7, 22, 7, 32);
          }
        }

        this.drawUnicorn(g, v.body, v.mane, v.horn, v.hoof, v.sparkle);
        g.generateTexture(v.key, 70, 70);
        g.destroy();
      }
    }

    // 'unicorn' is an alias for 'unicorn-pink'
    if (!this.textures.exists('unicorn')) {
      const g = this.make.graphics({}, false);
      this.drawUnicorn(g, 0xff69b4, rainbowMane, 0xffd700, 0xff99cc, false);
      g.generateTexture('unicorn', 70, 70);
      g.destroy();
    }
  }

  private generateGround(): void {
    if (this.textures.exists('ground')) return;
    const g = this.make.graphics({}, false);
    // Bright grass top
    g.fillStyle(0x66bb6a);
    g.fillRect(0, 0, 64, 10);
    // Grass blades
    g.fillStyle(0x81c784);
    for (let i = 0; i < 8; i++) {
      g.fillTriangle(i * 8 + 2, 10, i * 8 + 4, 2, i * 8 + 6, 10);
    }
    // Dirt
    g.fillStyle(0xa1887f);
    g.fillRect(0, 10, 64, 54);
    // Dirt texture
    g.fillStyle(0x8d6e63);
    for (let i = 0; i < 8; i++) {
      g.fillCircle(8 + i * 8, 28 + (i % 3) * 10, 2);
    }
    // Small pebbles
    g.fillStyle(0xbcaaa4);
    g.fillCircle(12, 45, 1.5);
    g.fillCircle(40, 38, 1);
    g.fillCircle(55, 50, 1.5);
    g.generateTexture('ground', 64, 64);
    g.destroy();
  }

  private generateObstacles(): void {
    // ── MAMI — funny cartoon mom with arms up saying "Nein!" ──
    if (!this.textures.exists('mami')) {
      const g = this.make.graphics({}, false);
      // Triangle dress body (pink/red)
      g.fillStyle(0xe91e63);
      g.fillTriangle(20, 18, 6, 48, 34, 48);
      // Circle head
      g.fillStyle(0xffccbc);
      g.fillCircle(20, 12, 10);
      // Hair bun on top
      g.fillStyle(0x5d4037);
      g.fillCircle(20, 4, 6);
      // Hair sides
      g.fillCircle(12, 8, 4);
      g.fillCircle(28, 8, 4);
      // Eyes (angry!)
      g.fillStyle(0x000000);
      g.fillCircle(17, 11, 1.5);
      g.fillCircle(23, 11, 1.5);
      // Angry eyebrows
      g.lineStyle(2, 0x000000);
      g.beginPath();
      g.moveTo(14, 8); g.lineTo(19, 9);
      g.moveTo(26, 8); g.lineTo(21, 9);
      g.strokePath();
      // Open mouth (yelling "Nein!")
      g.fillStyle(0xcc0000);
      g.fillCircle(20, 17, 3);
      // Stick arms raised up
      g.lineStyle(3, 0xffccbc);
      g.beginPath();
      g.moveTo(10, 28); g.lineTo(2, 10);  // left arm up
      g.moveTo(30, 28); g.lineTo(38, 10); // right arm up
      g.strokePath();
      // Hands
      g.fillStyle(0xffccbc);
      g.fillCircle(2, 10, 3);
      g.fillCircle(38, 10, 3);
      // Legs
      g.fillStyle(0xffccbc);
      g.fillRect(14, 48, 4, 8);
      g.fillRect(22, 48, 4, 8);
      // Shoes
      g.fillStyle(0xc62828);
      g.fillRoundedRect(13, 54, 6, 4, 1);
      g.fillRoundedRect(21, 54, 6, 4, 1);
      g.generateTexture('mami', 42, 60);
      g.destroy();
    }

    // ── PAPA — dad with a newspaper ──
    if (!this.textures.exists('papa')) {
      const g = this.make.graphics({}, false);
      // Rectangle body (blue shirt)
      g.fillStyle(0x1565c0);
      g.fillRoundedRect(10, 18, 24, 30, 4);
      // Circle head
      g.fillStyle(0xffccbc);
      g.fillCircle(22, 12, 10);
      // Hair (short, dark)
      g.fillStyle(0x3e2723);
      g.fillRoundedRect(13, 2, 18, 8, 4);
      // Glasses
      g.lineStyle(1.5, 0x333333);
      g.strokeCircle(18, 12, 4);
      g.strokeCircle(26, 12, 4);
      g.beginPath();
      g.moveTo(22, 12); g.lineTo(22, 12);
      g.strokePath();
      // Eyes behind glasses
      g.fillStyle(0x000000);
      g.fillCircle(18, 12, 1.5);
      g.fillCircle(26, 12, 1.5);
      // Stern mouth
      g.lineStyle(1.5, 0x795548);
      g.beginPath();
      g.moveTo(18, 17); g.lineTo(26, 17);
      g.strokePath();
      // Arm holding newspaper (right side)
      g.lineStyle(3, 0xffccbc);
      g.beginPath();
      g.moveTo(34, 28); g.lineTo(44, 22);
      g.strokePath();
      // Newspaper rectangle
      g.fillStyle(0xfff9c4);
      g.fillRect(38, 14, 14, 18);
      // Newspaper lines
      g.lineStyle(1, 0x999999);
      g.beginPath();
      for (let i = 0; i < 5; i++) {
        g.moveTo(40, 18 + i * 3);
        g.lineTo(50, 18 + i * 3);
      }
      g.strokePath();
      // Newspaper headline
      g.lineStyle(2, 0x333333);
      g.beginPath();
      g.moveTo(40, 16); g.lineTo(50, 16);
      g.strokePath();
      // Left arm at side
      g.lineStyle(3, 0xffccbc);
      g.beginPath();
      g.moveTo(10, 28); g.lineTo(4, 38);
      g.strokePath();
      // Pants
      g.fillStyle(0x37474f);
      g.fillRect(14, 46, 8, 10);
      g.fillRect(24, 46, 8, 10);
      // Shoes
      g.fillStyle(0x4e342e);
      g.fillRoundedRect(13, 54, 10, 4, 1);
      g.fillRoundedRect(23, 54, 10, 4, 1);
      g.generateTexture('papa', 54, 60);
      g.destroy();
    }

    // ── BROKKOLI — broccoli (kids hate it!) ──
    if (!this.textures.exists('brokkoli')) {
      const g = this.make.graphics({}, false);
      // Brown stem
      g.fillStyle(0x795548);
      g.fillRoundedRect(14, 22, 8, 18, 2);
      // Green broccoli top (tree-like clusters)
      g.fillStyle(0x2e7d32);
      g.fillCircle(18, 14, 10);
      g.fillCircle(10, 18, 8);
      g.fillCircle(26, 18, 8);
      g.fillCircle(14, 10, 7);
      g.fillCircle(22, 10, 7);
      // Lighter green highlights
      g.fillStyle(0x4caf50);
      g.fillCircle(16, 12, 5);
      g.fillCircle(22, 14, 4);
      g.fillCircle(12, 16, 3);
      // Tiny bumps texture
      g.fillStyle(0x388e3c);
      g.fillCircle(18, 8, 3);
      g.fillCircle(24, 12, 2);
      g.fillCircle(10, 14, 2);
      // Angry face on the broccoli (cute)
      g.fillStyle(0x000000);
      g.fillCircle(15, 16, 1.5);
      g.fillCircle(21, 16, 1.5);
      // Little angry mouth
      g.lineStyle(1, 0x1b5e20);
      g.beginPath();
      g.arc(18, 20, 3, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340), false);
      g.strokePath();
      g.generateTexture('brokkoli', 36, 42);
      g.destroy();
    }

    // ── HOMEWORK — homework sheet with red "F" grade ──
    if (!this.textures.exists('homework')) {
      const g = this.make.graphics({}, false);
      // Paper sheet (white with slight shadow)
      g.fillStyle(0xe0e0e0);
      g.fillRect(3, 3, 32, 40);
      g.fillStyle(0xffffff);
      g.fillRect(0, 0, 32, 40);
      // Red margin line
      g.lineStyle(1, 0xef5350);
      g.beginPath();
      g.moveTo(6, 0); g.lineTo(6, 40);
      g.strokePath();
      // Blue ruled lines
      g.lineStyle(0.8, 0x90caf9);
      for (let i = 0; i < 7; i++) {
        g.beginPath();
        g.moveTo(4, 8 + i * 5);
        g.lineTo(30, 8 + i * 5);
        g.strokePath();
      }
      // Scribble text (wavy lines)
      g.lineStyle(1, 0x555555);
      g.beginPath();
      for (let i = 0; i < 5; i++) {
        const y = 9 + i * 5;
        g.moveTo(8, y);
        for (let x = 8; x < 28; x += 2) {
          g.lineTo(x + 1, y + Math.sin(x) * 1);
        }
      }
      g.strokePath();
      // Big red "F" grade
      g.fillStyle(0xd32f2f);
      g.fillRect(18, 2, 8, 2);   // top bar
      g.fillRect(18, 2, 2, 8);   // vertical
      g.fillRect(18, 5, 6, 2);   // middle bar
      // Red circle around F
      g.lineStyle(2, 0xd32f2f);
      g.strokeCircle(22, 6, 8);
      g.generateTexture('homework', 36, 44);
      g.destroy();
    }

    // ── BEDTIME — alarm clock showing bedtime with "ZZZ" ──
    if (!this.textures.exists('bedtime')) {
      const g = this.make.graphics({}, false);
      // Clock body (circle)
      g.fillStyle(0x7b1fa2);
      g.fillCircle(20, 24, 16);
      // Clock face (white)
      g.fillStyle(0xffffff);
      g.fillCircle(20, 24, 13);
      // Clock bells on top
      g.fillStyle(0xffd600);
      g.fillCircle(10, 10, 5);
      g.fillCircle(30, 10, 5);
      // Bell connector
      g.fillStyle(0x7b1fa2);
      g.fillRoundedRect(14, 6, 12, 4, 2);
      // Clock hands
      g.lineStyle(2, 0x333333);
      g.beginPath();
      g.moveTo(20, 24); g.lineTo(20, 14); // minute hand
      g.moveTo(20, 24); g.lineTo(28, 24); // hour hand (pointing to 9 = bedtime)
      g.strokePath();
      // Center dot
      g.fillStyle(0xd32f2f);
      g.fillCircle(20, 24, 2);
      // Clock legs
      g.fillStyle(0x7b1fa2);
      g.fillRect(12, 38, 3, 5);
      g.fillRect(25, 38, 3, 5);
      // "ZZZ" letters floating up
      g.lineStyle(2, 0x1565c0);
      g.beginPath();
      g.moveTo(32, 14); g.lineTo(38, 14); g.lineTo(32, 20); g.lineTo(38, 20);
      g.strokePath();
      // Z2 (smaller)
      g.lineStyle(1.5, 0x42a5f5);
      g.beginPath();
      g.moveTo(36, 6); g.lineTo(40, 6); g.lineTo(36, 10); g.lineTo(40, 10);
      g.strokePath();
      // Z3 (smallest)
      g.lineStyle(1, 0x90caf9);
      g.beginPath();
      g.moveTo(38, 0); g.lineTo(41, 0); g.lineTo(38, 3); g.lineTo(41, 3);
      g.strokePath();
      g.generateTexture('bedtime', 44, 44);
      g.destroy();
    }

    // ── BATHTUB — white oval with blue water and bubbles ──
    if (!this.textures.exists('bathtub')) {
      const g = this.make.graphics({}, false);
      // Tub body (white oval)
      g.fillStyle(0xf5f5f5);
      g.fillEllipse(22, 26, 40, 24);
      // Tub rim
      g.lineStyle(2, 0xe0e0e0);
      g.strokeEllipse(22, 26, 40, 24);
      // Blue water inside
      g.fillStyle(0x64b5f6, 0.8);
      g.fillEllipse(22, 28, 34, 16);
      // Water waves
      g.lineStyle(1.5, 0x42a5f5);
      g.beginPath();
      for (let x = 8; x < 36; x += 4) {
        g.moveTo(x, 26);
        g.lineTo(x + 2, 24);
        g.lineTo(x + 4, 26);
      }
      g.strokePath();
      // Bubbles
      g.fillStyle(0xffffff, 0.8);
      g.fillCircle(12, 18, 4);
      g.fillCircle(18, 14, 3);
      g.fillCircle(28, 16, 3.5);
      g.fillCircle(22, 12, 2.5);
      g.fillCircle(32, 18, 2);
      // Bubble shine
      g.fillStyle(0xffffff, 0.6);
      g.fillCircle(11, 17, 1.5);
      g.fillCircle(17, 13, 1);
      g.fillCircle(27, 15, 1.2);
      // Faucet
      g.fillStyle(0xbdbdbd);
      g.fillRoundedRect(36, 14, 6, 12, 2);
      g.fillRoundedRect(34, 12, 10, 4, 2);
      // Water drip
      g.fillStyle(0x64b5f6);
      g.fillCircle(39, 26, 1.5);
      // Tub feet
      g.fillStyle(0xbdbdbd);
      g.fillCircle(8, 38, 3);
      g.fillCircle(36, 38, 3);
      g.generateTexture('bathtub', 46, 42);
      g.destroy();
    }

    // ── BERG — mountain / raised platform obstacle ──
    if (!this.textures.exists('berg')) {
      const g = this.make.graphics({}, false);
      // Mountain body (triangle shape with flat top)
      g.fillStyle(0x795548);
      g.beginPath();
      g.moveTo(0, 80);    // bottom-left
      g.lineTo(20, 0);    // top-left edge
      g.lineTo(100, 0);   // flat top
      g.lineTo(120, 80);  // bottom-right
      g.closePath();
      g.fillPath();
      // Snow/lighter top
      g.fillStyle(0xa1887f);
      g.beginPath();
      g.moveTo(16, 10);
      g.lineTo(20, 0);
      g.lineTo(100, 0);
      g.lineTo(104, 10);
      g.closePath();
      g.fillPath();
      // Flat top grass
      g.fillStyle(0x66bb6a);
      g.fillRect(18, 0, 84, 6);
      // Grass blades on top
      g.fillStyle(0x81c784);
      for (let i = 0; i < 10; i++) {
        g.fillTriangle(22 + i * 8, 6, 24 + i * 8, 0, 26 + i * 8, 6);
      }
      // Rock texture details
      g.fillStyle(0x6d4c41);
      g.fillCircle(40, 40, 4);
      g.fillCircle(70, 50, 3);
      g.fillCircle(55, 30, 2.5);
      g.fillCircle(85, 45, 3.5);
      g.fillCircle(30, 55, 2);
      // Cracks
      g.lineStyle(1, 0x5d4037);
      g.beginPath();
      g.moveTo(50, 20); g.lineTo(55, 35); g.lineTo(52, 50);
      g.moveTo(75, 15); g.lineTo(80, 30);
      g.strokePath();
      g.generateTexture('berg', 120, 80);
      g.destroy();
    }
  }

  private generateCollectibles(): void {
    // Heart collectible (bigger, with shine)
    if (!this.textures.exists('heart-collectible')) {
      const g = this.make.graphics({}, false);
      g.fillStyle(0xff1744);
      g.fillCircle(14, 12, 10);
      g.fillCircle(28, 12, 10);
      g.fillTriangle(4, 16, 38, 16, 21, 36);
      // Shine highlight
      g.fillStyle(0xff5252, 0.7);
      g.fillCircle(12, 10, 5);
      g.fillStyle(0xffffff, 0.5);
      g.fillCircle(12, 8, 3);
      // Sparkle dots
      g.fillStyle(0xffffff, 0.8);
      g.fillCircle(10, 6, 1.5);
      g.fillCircle(30, 10, 1);
      g.generateTexture('heart-collectible', 42, 38);
      g.destroy();
    }

    // Star collectible (bigger, shinier)
    if (!this.textures.exists('star-collectible')) {
      const g = this.make.graphics({}, false);
      // Outer glow
      g.fillStyle(0xfff176, 0.3);
      g.fillCircle(20, 20, 18);
      // Star shape
      g.fillStyle(0xffd600);
      const cx = 20, cy = 20, outer = 17, inner = 8;
      const points: { x: number; y: number }[] = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? outer : inner;
        const angle = (Math.PI / 2) + (i * Math.PI / 5);
        points.push({ x: cx + r * Math.cos(angle), y: cy - r * Math.sin(angle) });
      }
      g.beginPath();
      g.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) g.lineTo(points[i].x, points[i].y);
      g.closePath();
      g.fillPath();
      // Shine
      g.fillStyle(0xffff00);
      g.fillCircle(17, 15, 4);
      // Sparkle dots
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(15, 12, 2);
      g.fillCircle(25, 14, 1.5);
      g.fillCircle(20, 8, 1);
      g.generateTexture('star-collectible', 40, 40);
      g.destroy();
    }

    // Rainbow collectible (bigger, more vibrant)
    if (!this.textures.exists('rainbow-collectible')) {
      const g = this.make.graphics({}, false);
      const colors = [0xff0000, 0xff8800, 0xffff00, 0x00cc00, 0x0088ff, 0x8800ff];
      for (let i = 0; i < colors.length; i++) {
        g.lineStyle(4, colors[i]);
        g.beginPath();
        g.arc(22, 30, 20 - i * 3, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false);
        g.strokePath();
      }
      // Sparkle at ends
      g.fillStyle(0xffffff, 0.8);
      g.fillCircle(4, 30, 2);
      g.fillCircle(40, 30, 2);
      // Cloud puffs at base
      g.fillStyle(0xffffff, 0.6);
      g.fillCircle(6, 32, 4);
      g.fillCircle(38, 32, 4);
      g.generateTexture('rainbow-collectible', 44, 36);
      g.destroy();
    }

    // Fart bean (Furzbohne!)
    if (!this.textures.exists('bean-collectible')) {
      const g = this.make.graphics({}, false);
      // Bean body (kidney shape — bigger)
      g.fillStyle(0x4caf50);
      g.fillEllipse(20, 18, 30, 22);
      // Darker curve
      g.lineStyle(2, 0x2e7d32);
      g.beginPath();
      g.arc(20, 18, 10, Phaser.Math.DegToRad(200), Phaser.Math.DegToRad(340), false);
      g.strokePath();
      // Highlight
      g.fillStyle(0x81c784, 0.6);
      g.fillEllipse(15, 14, 10, 8);
      // Shine
      g.fillStyle(0xffffff, 0.4);
      g.fillCircle(14, 12, 3);
      // Stink lines
      g.lineStyle(1.5, 0x9e9d24, 0.7);
      g.beginPath();
      g.moveTo(10, 5); g.lineTo(8, 0);
      g.moveTo(18, 4); g.lineTo(18, 0);
      g.moveTo(26, 5); g.lineTo(28, 0);
      g.strokePath();
      g.generateTexture('bean-collectible', 38, 32);
      g.destroy();
    }
  }

  private generateBackgrounds(): void {
    // Sky gradient — BRIGHTER and more cheerful
    if (!this.textures.exists('sky')) {
      const g = this.make.graphics({}, false);
      const steps = 24;
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        // Bright cheerful sky: vivid light blue to warm peach-pink
        const r = Math.floor(100 + t * 155);
        const gr = Math.floor(210 - t * 30);
        const b = Math.floor(255 - t * 40);
        const color = (r << 16) | (gr << 8) | b;
        g.fillStyle(color);
        g.fillRect(0, i * 17, 800, 17);
      }

      // Bright white fluffy clouds
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(100, 50, 28);
      g.fillCircle(128, 44, 34);
      g.fillCircle(158, 52, 24);
      g.fillCircle(80, 56, 18);

      g.fillCircle(460, 70, 22);
      g.fillCircle(484, 64, 28);
      g.fillCircle(510, 72, 20);

      g.fillCircle(680, 34, 24);
      g.fillCircle(706, 28, 30);
      g.fillCircle(734, 36, 20);

      // Cloud highlights
      g.fillStyle(0xffffff, 0.5);
      g.fillCircle(125, 38, 16);
      g.fillCircle(480, 58, 14);
      g.fillCircle(702, 22, 14);

      // Small butterflies
      const butterflyColors = [0xff69b4, 0xffeb3b, 0x64b5f6, 0xce93d8];
      const butterflyPositions = [
        { x: 200, y: 100 }, { x: 350, y: 60 }, { x: 550, y: 90 },
        { x: 650, y: 45 }, { x: 300, y: 130 }, { x: 750, y: 80 },
      ];
      for (let i = 0; i < butterflyPositions.length; i++) {
        const bx = butterflyPositions[i].x;
        const by = butterflyPositions[i].y;
        const bc = butterflyColors[i % butterflyColors.length];
        // Wings
        g.fillStyle(bc, 0.7);
        g.fillEllipse(bx - 4, by - 2, 8, 5);
        g.fillEllipse(bx + 4, by - 2, 8, 5);
        // Body
        g.fillStyle(0x333333, 0.8);
        g.fillRect(bx - 0.5, by - 4, 1.5, 6);
      }

      // Small decorative flowers on the ground area
      const flowerColors = [0xff4081, 0xffeb3b, 0xff9800, 0xe040fb, 0x00e5ff];
      const flowerPositions = [
        { x: 50, y: 370 }, { x: 160, y: 375 }, { x: 280, y: 368 },
        { x: 420, y: 372 }, { x: 560, y: 374 }, { x: 700, y: 370 },
        { x: 340, y: 378 }, { x: 620, y: 376 },
      ];
      for (let i = 0; i < flowerPositions.length; i++) {
        const fx = flowerPositions[i].x;
        const fy = flowerPositions[i].y;
        const fc = flowerColors[i % flowerColors.length];
        // Stem
        g.fillStyle(0x4caf50);
        g.fillRect(fx - 0.5, fy, 1.5, 8);
        // Petals
        g.fillStyle(fc, 0.8);
        for (let p = 0; p < 5; p++) {
          const angle = (p / 5) * Math.PI * 2;
          g.fillCircle(fx + Math.cos(angle) * 3, fy + Math.sin(angle) * 3, 2.5);
        }
        // Center
        g.fillStyle(0xffeb3b);
        g.fillCircle(fx, fy, 1.5);
      }

      g.generateTexture('sky', 800, 400);
      g.destroy();
    }

    // Hills layer — brighter, more cheerful
    if (!this.textures.exists('hills')) {
      const g = this.make.graphics({}, false);

      // Back hills (lighter green)
      g.fillStyle(0x81c784, 0.6);
      g.beginPath();
      g.moveTo(0, 120);
      g.lineTo(0, 50);
      for (let x = 0; x <= 800; x += 8) {
        const y = 50 + Math.sin(x / 130 + 2) * 22 + Math.sin(x / 70 + 1) * 10;
        g.lineTo(x, y);
      }
      g.lineTo(800, 120);
      g.closePath();
      g.fillPath();

      // Front hills (vivid green)
      g.fillStyle(0x66bb6a, 0.8);
      g.beginPath();
      g.moveTo(0, 120);
      g.lineTo(0, 70);
      for (let x = 0; x <= 800; x += 8) {
        const y = 70 + Math.sin(x / 100) * 18 + Math.sin(x / 55) * 8;
        g.lineTo(x, y);
      }
      g.lineTo(800, 120);
      g.closePath();
      g.fillPath();

      // Small flowers on the hills
      const hillFlowerColors = [0xffffff, 0xffeb3b, 0xff80ab, 0xe1bee7];
      for (let i = 0; i < 20; i++) {
        const fx = i * 42 + 10;
        const fy = 75 + Math.sin(fx / 100) * 15 + Math.sin(fx / 55) * 6;
        const fc = hillFlowerColors[i % hillFlowerColors.length];
        g.fillStyle(fc, 0.7);
        g.fillCircle(fx, fy, 2);
        g.fillCircle(fx - 2, fy + 1, 1.5);
        g.fillCircle(fx + 2, fy + 1, 1.5);
      }

      g.generateTexture('hills', 800, 120);
      g.destroy();
    }
  }

  private generateFartCloud(): void {
    // RAINBOW colored fart cloud!
    if (!this.textures.exists('fart-cloud')) {
      const g = this.make.graphics({}, false);
      const rainbowColors = [0xff0000, 0xff8800, 0xffff00, 0x00cc44, 0x0088ff, 0xaa00ff, 0xff69b4];
      // Overlapping circles in rainbow colors
      g.fillStyle(rainbowColors[0], 0.7);
      g.fillCircle(9, 9, 7);
      g.fillStyle(rainbowColors[1], 0.7);
      g.fillCircle(14, 7, 5);
      g.fillStyle(rainbowColors[2], 0.65);
      g.fillCircle(6, 13, 5);
      g.fillStyle(rainbowColors[3], 0.6);
      g.fillCircle(12, 13, 4);
      g.fillStyle(rainbowColors[4], 0.55);
      g.fillCircle(4, 8, 4);
      g.fillStyle(rainbowColors[5], 0.5);
      g.fillCircle(10, 4, 3);
      g.fillStyle(rainbowColors[6], 0.45);
      g.fillCircle(16, 11, 3);
      g.generateTexture('fart-cloud', 20, 20);
      g.destroy();
    }
  }

  private generateToilet(): void {
    if (!this.textures.exists('toilet')) {
      const g = this.make.graphics({}, false);
      // Toilet base (white)
      g.fillStyle(0xf5f5f5);
      g.fillRoundedRect(6, 20, 28, 24, 6);
      // Toilet bowl (oval top)
      g.fillStyle(0xffffff);
      g.fillEllipse(20, 22, 30, 16);
      // Bowl rim
      g.lineStyle(2, 0xe0e0e0);
      g.strokeEllipse(20, 22, 30, 16);
      // Blue water inside
      g.fillStyle(0x64b5f6, 0.7);
      g.fillEllipse(20, 24, 22, 10);
      // Tank behind
      g.fillStyle(0xeeeeee);
      g.fillRoundedRect(10, 4, 20, 18, 4);
      // Tank lid
      g.fillStyle(0xf5f5f5);
      g.fillRoundedRect(8, 2, 24, 5, 2);
      // Flush handle
      g.fillStyle(0xbdbdbd);
      g.fillRoundedRect(30, 8, 6, 3, 1);
      // Crown on top (unicorn toilet!)
      g.fillStyle(0xffd700);
      g.fillTriangle(14, 2, 16, -6, 18, 2);
      g.fillTriangle(18, 2, 20, -8, 22, 2);
      g.fillTriangle(22, 2, 24, -6, 26, 2);
      // Crown base
      g.fillRect(14, 0, 12, 3);
      // Jewels on crown
      g.fillStyle(0xff1744);
      g.fillCircle(17, -2, 1.5);
      g.fillStyle(0x00e5ff);
      g.fillCircle(20, -4, 1.5);
      g.fillStyle(0x76ff03);
      g.fillCircle(23, -2, 1.5);
      g.generateTexture('toilet', 40, 48);
      g.destroy();
    }
  }

  private generateUI(): void {
    // Heart icon (filled)
    if (!this.textures.exists('heart-icon')) {
      const g = this.make.graphics({}, false);
      g.fillStyle(0xff1744);
      g.fillCircle(8, 7, 6);
      g.fillCircle(18, 7, 6);
      g.fillTriangle(2, 9, 24, 9, 13, 22);
      // Shine
      g.fillStyle(0xff5252, 0.6);
      g.fillCircle(8, 5, 2.5);
      g.generateTexture('heart-icon', 26, 24);
      g.destroy();
    }

    // Empty heart icon
    if (!this.textures.exists('heart-empty')) {
      const g = this.make.graphics({}, false);
      g.lineStyle(2, 0xff1744);
      g.strokeCircle(8, 7, 6);
      g.strokeCircle(18, 7, 6);
      g.fillStyle(0xff1744, 0.15);
      g.fillCircle(8, 7, 5);
      g.fillCircle(18, 7, 5);
      g.fillTriangle(2, 9, 24, 9, 13, 22);
      g.generateTexture('heart-empty', 26, 24);
      g.destroy();
    }
  }
}
