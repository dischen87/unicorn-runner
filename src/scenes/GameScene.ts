import Phaser from 'phaser';
import {
  UNICORN,
  SPEED,
  HEARTS,
  POINTS,
  COMBO,
  SPAWN,
  type DifficultyLevel,
} from '../utils/constants';
import { getHighScore, setHighScore } from '../utils/storage';

export class GameScene extends Phaser.Scene {
  // Core game objects
  private unicorn!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private ground!: Phaser.GameObjects.TileSprite;
  private hills!: Phaser.GameObjects.TileSprite;
  private obstacles!: Phaser.Physics.Arcade.Group;
  private collectibles!: Phaser.Physics.Arcade.Group;

  // HUD elements
  private heartIcons: Phaser.GameObjects.Image[] = [];
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  // @ts-ignore used by Phaser rendering
  private levelText!: Phaser.GameObjects.Text;
  private fartComboText!: Phaser.GameObjects.Text;

  // Game state
  private score = 0;
  private hearts = HEARTS.start;
  private currentSpeed: number = SPEED.initial;
  private isInvulnerable = false;
  private hasRainbowShield = false;
  private isGameOver = false;

  // Combo state
  private comboCount = 0;
  private comboTimer: Phaser.Time.TimerEvent | null = null;
  private comboMultiplier = 1;

  // Timers
  private obstacleTimer: Phaser.Time.TimerEvent | null = null;
  private scoreTimer: Phaser.Time.TimerEvent | null = null;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;

  // Fart jump state
  private inputEnabled = false;
  private isJumping = false;
  private jumpHoldTime = 0;
  private maxJumpHoldTime = 300; // ms — max hold for full jump
  private fartParticles!: Phaser.GameObjects.Particles.ParticleEmitter;
  private fartSoundPlayed = false;

  // Double jump state
  private canDoubleJump = false;
  private hasDoubleJumped = false;

  // Furzbohne flight state
  private isFlyingBean = false;
  private flyingBeanTimer: Phaser.Time.TimerEvent | null = null;
  private flyingBeanParticleTimer: Phaser.Time.TimerEvent | null = null;
  private flyingBeanBobTween: Phaser.Tweens.Tween | null = null;
  private flyingBeanBlinkTween: Phaser.Tweens.Tween | null = null;
  private flyingBeanRainbowTween: Phaser.Tweens.Tween | null = null;
  private flyingWingLeft: Phaser.GameObjects.Image | null = null;
  private flyingWingRight: Phaser.GameObjects.Image | null = null;
  private flyingWingTween: Phaser.Tweens.Tween | null = null;

  // Fart combo points
  private fartComboCounter = 0;
  private fartComboResetTimer: Phaser.Time.TimerEvent | null = null;

  // Mountain obstacles
  private mountains!: Phaser.Physics.Arcade.StaticGroup;

  // Toilet break state
  private toiletBreakTimer: Phaser.Time.TimerEvent | null = null;
  private isToiletBreak = false;
  private toiletSprite: Phaser.GameObjects.Image | null = null;
  private toiletWarningText: Phaser.GameObjects.Text | null = null;
  private preToiletSpeed = 0;

  // Level / character support
  private selectedUnicorn = 'unicorn-pink';
  private selectedLevel = 1;
  private levelSpeedMultiplier = 1.0;

  constructor() {
    super({ key: 'Game' });
  }

  init(data: { unicornKey?: string; level?: number; speedMultiplier?: number }): void {
    this.selectedUnicorn = data.unicornKey || 'unicorn-pink';
    this.selectedLevel = data.level || 1;
    this.levelSpeedMultiplier = data.speedMultiplier || 1.0;
  }

  create(): void {
    this.resetState();

    const { width, height } = this.scale;

    // Background sky
    this.add.image(width / 2, height / 2, 'sky');

    // Scrolling hills layer
    this.hills = this.add.tileSprite(width / 2, height - 120, width, 120, 'hills')
      .setAlpha(0.6);

    // Scrolling ground
    this.ground = this.add.tileSprite(width / 2, UNICORN.groundY + 32, width, 64, 'ground');
    this.physics.add.existing(this.ground, true);
    (this.ground.body as Phaser.Physics.Arcade.StaticBody).setSize(width, 64);

    // Unicorn — use selected character texture
    this.unicorn = this.physics.add.sprite(UNICORN.startX, UNICORN.groundY - 30, this.selectedUnicorn);
    this.unicorn.setCollideWorldBounds(true);
    this.unicorn.setBounce(0.1);
    this.unicorn.setDepth(10);
    this.unicorn.body.setSize(40, 50);
    this.unicorn.body.setOffset(5, 8);

    // Collider: unicorn on ground
    this.physics.add.collider(this.unicorn, this.ground);

    // Physics groups
    this.obstacles = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });

    this.collectibles = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });

    // Mountains static group (platforms the unicorn can land on)
    this.mountains = this.physics.add.staticGroup();

    // Collider: unicorn on mountains (can land on top)
    this.physics.add.collider(this.unicorn, this.mountains);

    // Collisions
    this.physics.add.overlap(
      this.unicorn,
      this.obstacles,
      this.hitObstacle as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.physics.add.overlap(
      this.unicorn,
      this.collectibles,
      this.collectItem as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    // Input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    // Delay input to avoid triggering jump from the menu click
    this.inputEnabled = false;
    this.time.delayedCall(500, () => { this.inputEnabled = true; });

    // Tap/click to jump (hold = higher jump)
    this.input.on('pointerdown', () => {
      if (this.inputEnabled) this.startJump();
    });
    this.input.on('pointerup', () => {
      if (this.inputEnabled) this.endJump();
    });

    // Fart particle emitter — RAINBOW colors!
    this.fartParticles = this.add.particles(0, 0, 'fart-cloud', {
      speed: { min: 30, max: 80 },
      angle: { min: 160, max: 200 },
      scale: { start: 1.2, end: 0.1 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 500,
      gravityY: -50,
      frequency: -1, // manual emit only
      tint: [0xff0000, 0xff8800, 0xffff00, 0x00cc00, 0x0088ff, 0x8800ff, 0xff00ff],
    });
    this.fartParticles.setDepth(9);

    // HUD: Hearts
    this.createHeartsDisplay();

    // HUD: Score
    this.scoreText = this.add.text(width - 16, 16, 'Punkte: 0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#333333',
      strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(100).setScrollFactor(0);

    // HUD: Level display (top center)
    this.levelText = this.add.text(width / 2, 4, `Level ${this.selectedLevel}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#333333',
      strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(100).setScrollFactor(0);

    // HUD: Combo
    this.comboText = this.add.text(width / 2, 24, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#ffd600',
      fontStyle: 'bold',
      stroke: '#333333',
      strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(100).setScrollFactor(0);

    // HUD: Fart combo counter
    this.fartComboText = this.add.text(width / 2, 48, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#8bc34a',
      fontStyle: 'bold',
      stroke: '#333333',
      strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(100).setScrollFactor(0);

    // Show "Level X" briefly at game start with animation
    const levelAnnounce = this.add.text(width / 2, height / 2, `Level ${this.selectedLevel}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '48px',
      color: '#ffd600',
      fontStyle: 'bold',
      stroke: '#333333',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(300);

    this.tweens.add({
      targets: levelAnnounce,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 1500,
      ease: 'Cubic.easeOut',
      onComplete: () => levelAnnounce.destroy(),
    });

    // Timers — give kids 2 seconds before first obstacle
    this.time.delayedCall(2000, () => this.scheduleObstacle());
    this.scheduleCollectible('heart-collectible', SPAWN.heartInterval);
    this.scheduleCollectible('star-collectible', SPAWN.starInterval);
    this.scheduleCollectible('rainbow-collectible', SPAWN.rainbowInterval);
    this.scheduleCollectible('bean-collectible', SPAWN.starInterval);

    this.scoreTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        if (!this.isGameOver) {
          this.addScore(POINTS.perSecond);
        }
      },
      loop: true,
    });

    // Schedule first toilet break (45-60 seconds)
    this.scheduleToiletBreak();

    // Fade in
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  update(_time: number, delta: number): void {
    if (this.isGameOver) return;

    // During toilet break, obstacles stop but score ticks slowly
    if (this.isToiletBreak) {
      return;
    }

    const dt = delta / 1000;
    const speedWithLevel = this.currentSpeed * this.levelSpeedMultiplier;

    // Scroll backgrounds
    this.ground.tilePositionX += speedWithLevel * dt;
    this.hills.tilePositionX += speedWithLevel * 0.3 * dt;

    // Move obstacles left
    this.obstacles.getChildren().forEach((child) => {
      const obj = child as Phaser.Physics.Arcade.Sprite;
      obj.x -= speedWithLevel * dt;
      if (obj.x < -60) {
        obj.destroy();
      }
    });

    // Move collectibles left
    this.collectibles.getChildren().forEach((child) => {
      const obj = child as Phaser.Physics.Arcade.Sprite;
      obj.x -= speedWithLevel * dt;
      if (obj.x < -60) {
        obj.destroy();
      }
    });

    // Move mountains left (static bodies need manual position + refresh)
    this.mountains.getChildren().forEach((child) => {
      const obj = child as Phaser.Physics.Arcade.Sprite;
      obj.x -= speedWithLevel * dt;
      (obj.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
      if (obj.x < -140) {
        obj.destroy();
      }
    });

    // Gradually increase speed
    if (this.currentSpeed < SPEED.max) {
      this.currentSpeed += SPEED.increment * dt;
    }

    // Furzbohne flight controls — player can fly UP/DOWN
    if (this.isFlyingBean) {
      const flyInput = !this.inputEnabled ? false :
        (this.cursors && (this.cursors.up.isDown || this.cursors.space?.isDown)) ||
        (this.spaceKey && this.spaceKey.isDown) ||
        this.input.activePointer.isDown;

      if (flyInput) {
        // Fly upward when input is held
        this.unicorn.setVelocityY(Phaser.Math.Linear(this.unicorn.body.velocity.y, -200, 0.1));
      } else {
        // Gentle drift downward when released (not full gravity)
        this.unicorn.setVelocityY(Phaser.Math.Linear(this.unicorn.body.velocity.y, 80, 0.05));
      }

      // Keep unicorn on screen
      const minY = 40;
      const maxY = UNICORN.groundY - 40;
      if (this.unicorn.y < minY) {
        this.unicorn.y = minY;
        this.unicorn.setVelocityY(0);
      } else if (this.unicorn.y > maxY) {
        this.unicorn.y = maxY;
        this.unicorn.setVelocityY(0);
      }

      // Position wing clouds on both sides
      if (this.flyingWingLeft && this.flyingWingRight) {
        this.flyingWingLeft.setPosition(this.unicorn.x - 25, this.unicorn.y - 5);
        this.flyingWingRight.setPosition(this.unicorn.x + 25, this.unicorn.y - 5);
      }

      // Massive particle trail
      this.fartParticles.emitParticleAt(this.unicorn.x - 15, this.unicorn.y + 15, 3);
    } else {
      // Normal jump input — hold for higher jump
      const jumpDown = !this.inputEnabled ? false :
        (this.cursors && (this.cursors.up.isDown || this.cursors.space?.isDown)) ||
        (this.spaceKey && this.spaceKey.isDown);

      if (jumpDown) {
        this.startJump();
        // While holding and still going up, extend jump hold time
        if (this.isJumping && this.jumpHoldTime < this.maxJumpHoldTime) {
          this.jumpHoldTime += delta;
        }
      } else if (this.isJumping) {
        this.endJump();
      }
    }

    // Detect landing — reset double jump
    const body = this.unicorn.body;
    if ((body.touching.down || body.blocked.down) && this.hasDoubleJumped) {
      this.hasDoubleJumped = false;
      this.canDoubleJump = false;
    }

    // Emit fart particles while jumping (not during flight, handled above)
    if (!this.isFlyingBean && (this.isJumping || (body && body.velocity.y < -50))) {
      this.fartParticles.emitParticleAt(this.unicorn.x - 15, this.unicorn.y + 15, 1);
    }

    // Rainbow shield visual
    if (this.hasRainbowShield && !this.isFlyingBean) {
      const hue = (Date.now() / 10) % 360;
      this.unicorn.setTint(
        Phaser.Display.Color.HSLToColor(hue / 360, 1, 0.7).color
      );
    }
  }

  private resetState(): void {
    this.score = 0;
    this.hearts = HEARTS.start;
    this.currentSpeed = SPEED.initial;
    this.isInvulnerable = false;
    this.hasRainbowShield = false;
    this.isGameOver = false;
    this.comboCount = 0;
    this.comboMultiplier = 1;
    this.heartIcons = [];
    this.obstacleTimer = null;
    this.scoreTimer = null;
    this.comboTimer = null;
    this.inputEnabled = false;
    this.isJumping = false;
    this.jumpHoldTime = 0;
    this.fartSoundPlayed = false;
    this.canDoubleJump = false;
    this.hasDoubleJumped = false;
    this.isFlyingBean = false;
    this.flyingBeanTimer = null;
    this.flyingBeanParticleTimer = null;
    this.flyingBeanBobTween = null;
    this.flyingBeanBlinkTween = null;
    this.flyingBeanRainbowTween = null;
    this.flyingWingLeft = null;
    this.flyingWingRight = null;
    this.flyingWingTween = null;
    this.fartComboCounter = 0;
    this.fartComboResetTimer = null;
    this.toiletBreakTimer = null;
    this.isToiletBreak = false;
    this.toiletSprite = null;
    this.toiletWarningText = null;
    this.preToiletSpeed = 0;
  }

  private createHeartsDisplay(): void {
    for (let i = 0; i < HEARTS.max; i++) {
      const icon = this.add.image(20 + i * 30, 24, i < this.hearts ? 'heart-icon' : 'heart-empty')
        .setDepth(100)
        .setScrollFactor(0);
      this.heartIcons.push(icon);
    }
  }

  private updateHeartsDisplay(): void {
    for (let i = 0; i < this.heartIcons.length; i++) {
      this.heartIcons[i].setTexture(i < this.hearts ? 'heart-icon' : 'heart-empty');
    }
  }

  // ---- DOUBLE JUMP + FART COMBO ----

  private startJump(): void {
    if (this.isGameOver || this.isToiletBreak) return;

    // During Furzbohne flight, ignore jumps
    if (this.isFlyingBean) return;

    const body = this.unicorn.body;
    const onGround = body.touching.down || body.blocked.down;

    if (!this.isJumping && onGround) {
      // FIRST JUMP (normal)
      this.isJumping = true;
      this.jumpHoldTime = 0;
      this.fartSoundPlayed = false;
      this.canDoubleJump = true;
      this.hasDoubleJumped = false;

      // Initial jump impulse
      this.unicorn.setVelocityY(UNICORN.jumpVelocity * 0.6);

      // Squash & stretch effect
      this.tweens.add({
        targets: this.unicorn,
        scaleX: 1.2,
        scaleY: 0.8,
        duration: 100,
        yoyo: true,
        ease: 'Quad.easeOut',
      });

      // Play fart sound!
      this.playFartSound();
      // Fart burst at start
      this.fartParticles.emitParticleAt(this.unicorn.x - 15, this.unicorn.y + 20, 8);

      // Fart combo tracking
      this.incrementFartCombo();

    } else if (this.canDoubleJump && !this.hasDoubleJumped && !onGround) {
      // SECOND JUMP (double jump / boost!)
      this.hasDoubleJumped = true;
      this.canDoubleJump = false;

      // Stronger boost velocity
      this.unicorn.setVelocityY(UNICORN.doubleJumpVelocity);

      // Bigger squash & stretch
      this.tweens.add({
        targets: this.unicorn,
        scaleX: 1.4,
        scaleY: 0.6,
        duration: 120,
        yoyo: true,
        ease: 'Quad.easeOut',
      });

      // Play louder fart!
      this.fartSoundPlayed = false;
      this.playFartSound();

      // BIGGER fart burst for double jump
      this.fartParticles.emitParticleAt(this.unicorn.x - 15, this.unicorn.y + 20, 15);

      // Fart combo tracking
      this.incrementFartCombo();
    }

    // While holding, keep applying upward force (variable height)
    if (this.isJumping && this.jumpHoldTime < this.maxJumpHoldTime) {
      const holdRatio = 1 - (this.jumpHoldTime / this.maxJumpHoldTime);
      this.unicorn.setVelocityY(
        Math.min(this.unicorn.body.velocity.y, UNICORN.jumpVelocity * (0.6 + holdRatio * 0.4))
      );
    }
  }

  private endJump(): void {
    if (this.isJumping) {
      this.isJumping = false;
      // Cut upward velocity when button released (short jump)
      if (this.unicorn.body.velocity.y < 0) {
        this.unicorn.setVelocityY(this.unicorn.body.velocity.y * 0.5);
      }
    }
  }

  // ---- FART COMBO POINTS ----

  private incrementFartCombo(): void {
    this.fartComboCounter += 1;

    // Reset the 2-second timer
    if (this.fartComboResetTimer) {
      this.fartComboResetTimer.destroy();
    }
    this.fartComboResetTimer = this.time.delayedCall(2000, () => {
      this.fartComboCounter = 0;
      this.fartComboText.setText('');
    });

    // Update HUD
    if (this.fartComboCounter >= 2) {
      this.fartComboText.setText(`Furz-Combo: ${this.fartComboCounter}`);
    }

    // Every 5th fart: MEGA FURZ +30
    if (this.fartComboCounter > 0 && this.fartComboCounter % 5 === 0) {
      this.addScore(30);
      this.showFloatingText(this.unicorn.x, this.unicorn.y - 60, `MEGA-FURZ! +30`, '#ff00ff');
      this.fartParticles.emitParticleAt(this.unicorn.x - 15, this.unicorn.y + 15, 20);
    }
    // Every 3rd fart: bonus +15
    else if (this.fartComboCounter > 0 && this.fartComboCounter % 3 === 0) {
      this.addScore(15);
      this.showFloatingText(this.unicorn.x, this.unicorn.y - 60, `FURZ-COMBO x3! +15`, '#8bc34a');
      this.fartParticles.emitParticleAt(this.unicorn.x - 15, this.unicorn.y + 15, 10);
    }
  }

  // ---- FART SOUND ----

  private playFartSound(): void {
    if (this.fartSoundPlayed) return;
    this.fartSoundPlayed = true;
    try {
      const soundManager = this.sound as unknown as { context?: AudioContext };
      const audioCtx = soundManager.context;
      if (!audioCtx) return;

      // Create a funny fart sound using oscillators + noise
      const now = audioCtx.currentTime;

      // Low rumble oscillator
      const osc1 = audioCtx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(80, now);
      osc1.frequency.exponentialRampToValueAtTime(40, now + 0.15);

      // Higher "pfffft" oscillator
      const osc2 = audioCtx.createOscillator();
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(150, now);
      osc2.frequency.exponentialRampToValueAtTime(60, now + 0.2);

      // Gain envelope — quick burst
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      // Noise buffer for the "hiss" part
      const bufferSize = audioCtx.sampleRate * 0.2;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = noiseBuffer;

      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.1, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      // Low pass filter for muffled fart sound
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.2);

      // Connect
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      noise.connect(noiseGain);
      noiseGain.connect(audioCtx.destination);

      // Start and stop
      osc1.start(now);
      osc2.start(now);
      noise.start(now);
      osc1.stop(now + 0.25);
      osc2.stop(now + 0.25);
      noise.stop(now + 0.2);
    } catch {
      // Audio not available — no problem
    }
  }

  // ---- COLLISIONS ----

  private hitObstacle(
    _unicorn: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    obstacle: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): void {
    if (this.isInvulnerable || this.isGameOver || this.isFlyingBean) return;

    const obstacleSprite = obstacle as Phaser.Physics.Arcade.Sprite;

    // --- STOMP CHECK: if unicorn is falling and above the obstacle, STOMP it ---
    const unicornBody = this.unicorn.body;
    const isStomping = unicornBody.velocity.y > 0 &&
      this.unicorn.y + 20 < obstacleSprite.y;

    if (isStomping) {
      this.stompObstacle(obstacleSprite);
      return;
    }

    // Rainbow shield absorbs hit
    if (this.hasRainbowShield) {
      this.hasRainbowShield = false;
      this.unicorn.clearTint();
      obstacleSprite.destroy();
      this.showFloatingText(this.unicorn.x, this.unicorn.y - 30, 'Shield!', '#00e5ff');
      return;
    }

    obstacleSprite.destroy();

    this.hearts -= 1;
    this.updateHeartsDisplay();

    // Reset combo
    this.comboCount = 0;
    this.comboMultiplier = 1;
    this.comboText.setText('');

    // Flash red
    this.unicorn.setTint(0xff0000);
    this.isInvulnerable = true;

    // Blink effect during invulnerability
    this.tweens.add({
      targets: this.unicorn,
      alpha: 0.3,
      duration: 150,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        this.unicorn.setAlpha(1);
        this.unicorn.clearTint();
        this.isInvulnerable = false;
      },
    });

    // Screen shake
    this.cameras.main.shake(200, 0.01);

    if (this.hearts <= 0) {
      this.gameOver();
    }
  }

  // ---- STOMP MECHANIC (Mario-style) ----

  private stompObstacle(obstacle: Phaser.Physics.Arcade.Sprite): void {
    const stompX = obstacle.x;
    const stompY = obstacle.y;

    // Squish animation — scale to 0 then destroy
    this.tweens.add({
      targets: obstacle,
      scaleX: 1.5,
      scaleY: 0,
      duration: 200,
      ease: 'Quad.easeIn',
      onComplete: () => {
        obstacle.destroy();
      },
    });

    // Bounce the unicorn back up
    this.unicorn.setVelocityY(-200);

    // Award points
    this.addScore(15);
    this.showFloatingText(stompX, stompY - 40, 'ZERTRAMPELT! +15', '#ff6600');

    // Play squish sound
    this.playSquishSound();

    // Particle burst at impact point
    this.fartParticles.emitParticleAt(stompX, stompY, 12);

    // Brief invulnerability after stomp
    this.isInvulnerable = true;
    this.time.delayedCall(300, () => {
      if (!this.isGameOver) {
        this.isInvulnerable = false;
      }
    });
  }

  private playSquishSound(): void {
    try {
      const soundManager = this.sound as unknown as { context?: AudioContext };
      const audioCtx = soundManager.context;
      if (!audioCtx) return;

      const now = audioCtx.currentTime;

      // Low "splat" oscillator
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);

      // Noise for the "squish" texture
      const bufferSize = audioCtx.sampleRate * 0.1;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.4;
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = noiseBuffer;

      // Gain envelope
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.15, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      // Low pass filter for muffled splat
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.15);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      noise.connect(noiseGain);
      noiseGain.connect(audioCtx.destination);

      osc.start(now);
      noise.start(now);
      osc.stop(now + 0.15);
      noise.stop(now + 0.1);
    } catch {
      // Audio not available
    }
  }

  private collectItem(
    _unicorn: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    item: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile
  ): void {
    if (this.isGameOver) return;

    const sprite = item as Phaser.Physics.Arcade.Sprite;
    const textureKey = sprite.texture.key;
    sprite.destroy();

    // Increment combo
    this.comboCount += 1;
    if (this.comboCount >= COMBO.threshold) {
      this.comboMultiplier = COMBO.multiplier;
      this.comboText.setText(`Combo x${this.comboMultiplier}!`);
      // Flash combo text
      this.tweens.add({
        targets: this.comboText,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 150,
        yoyo: true,
      });
    }

    // Reset combo timer
    if (this.comboTimer) {
      this.comboTimer.destroy();
    }
    this.comboTimer = this.time.delayedCall(COMBO.duration, () => {
      this.comboCount = 0;
      this.comboMultiplier = 1;
      this.comboText.setText('');
    });

    let pointsEarned = 0;
    let color = '#ffffff';

    switch (textureKey) {
      case 'heart-collectible':
        if (this.hearts < HEARTS.max) {
          this.hearts += 1;
          this.updateHeartsDisplay();
        }
        pointsEarned = POINTS.perHeart * this.comboMultiplier;
        color = '#ff1744';
        break;

      case 'star-collectible':
        pointsEarned = POINTS.perStar * this.comboMultiplier;
        color = '#ffd600';
        break;

      case 'rainbow-collectible':
        this.hasRainbowShield = true;
        pointsEarned = POINTS.perStar * this.comboMultiplier;
        color = '#e040fb';
        this.showFloatingText(this.unicorn.x, this.unicorn.y - 50, 'Rainbow Shield!', '#e040fb');
        break;

      case 'bean-collectible':
        // FURZBOHNE! 15 seconds flying!
        this.activateFurzbohne();
        pointsEarned = POINTS.perStar * 2 * this.comboMultiplier;
        color = '#4caf50';
        break;

      default:
        pointsEarned = POINTS.perObstacle * this.comboMultiplier;
        break;
    }

    this.addScore(pointsEarned);
    this.showFloatingText(
      this.unicorn.x + 30,
      this.unicorn.y - 20,
      `+${pointsEarned}`,
      color
    );
  }

  // ---- FURZBOHNE: 15 SECONDS FLYING ----

  private activateFurzbohne(): void {
    this.isFlyingBean = true;
    this.isInvulnerable = true;

    // Show announcement text
    this.showFloatingText(this.unicorn.x, this.unicorn.y - 60, 'FURZBOHNE! 15 Sek Flug!', '#4caf50');

    // Cancel world gravity for the unicorn during flight
    this.unicorn.body.setGravityY(-this.physics.world.gravity.y);
    // Initial upward boost
    this.unicorn.setVelocityY(-150);

    // --- BLINK rapidly: alternate alpha between 1.0 and 0.5 every 100ms ---
    this.flyingBeanBlinkTween = this.tweens.add({
      targets: this.unicorn,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: -1,
      ease: 'Linear',
    });

    // --- RAINBOW GLOW: cycle tint through rainbow colors ---
    this.flyingBeanRainbowTween = this.tweens.addCounter({
      from: 0,
      to: 360,
      duration: 2000,
      repeat: -1,
      onUpdate: (tween) => {
        if (this.isFlyingBean) {
          const hue = tween.getValue() ?? 0;
          this.unicorn.setTint(
            Phaser.Display.Color.HSLToColor(hue / 360, 1, 0.7).color
          );
        }
      },
    });

    // --- WING-LIKE FART CLOUDS on both sides ---
    this.flyingWingLeft = this.add.image(this.unicorn.x - 25, this.unicorn.y - 5, 'fart-cloud')
      .setScale(0.8)
      .setAlpha(0.7)
      .setDepth(9);
    this.flyingWingRight = this.add.image(this.unicorn.x + 25, this.unicorn.y - 5, 'fart-cloud')
      .setScale(0.8)
      .setFlipX(true)
      .setAlpha(0.7)
      .setDepth(9);

    // Flap the wings (scale Y oscillation)
    this.flyingWingTween = this.tweens.add({
      targets: [this.flyingWingLeft, this.flyingWingRight],
      scaleY: { from: 0.5, to: 1.0 },
      duration: 200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Massive rainbow fart trail continuously
    this.flyingBeanParticleTimer = this.time.addEvent({
      delay: 80,
      callback: () => {
        if (this.isFlyingBean) {
          this.fartParticles.emitParticleAt(this.unicorn.x - 15, this.unicorn.y + 15, 4);
          // Random fart sounds
          if (Math.random() < 0.2) {
            this.fartSoundPlayed = false;
            this.playFartSound();
          }
        }
      },
      repeat: 186, // ~15 seconds at 80ms intervals
    });

    // Mega initial fart burst
    this.fartParticles.emitParticleAt(this.unicorn.x - 15, this.unicorn.y + 15, 25);
    this.fartSoundPlayed = false;
    this.playFartSound();

    // End after 15 seconds
    this.flyingBeanTimer = this.time.delayedCall(15000, () => {
      this.endFurzbohne();
    });
  }

  private endFurzbohne(): void {
    this.isFlyingBean = false;
    this.isInvulnerable = false;

    // Restore gravity
    this.unicorn.body.setGravityY(0);

    // Stop blink tween
    if (this.flyingBeanBlinkTween) {
      this.flyingBeanBlinkTween.destroy();
      this.flyingBeanBlinkTween = null;
    }
    this.unicorn.setAlpha(1);

    // Stop rainbow tween
    if (this.flyingBeanRainbowTween) {
      this.flyingBeanRainbowTween.destroy();
      this.flyingBeanRainbowTween = null;
    }

    // Remove wing clouds
    if (this.flyingWingLeft) {
      this.flyingWingLeft.destroy();
      this.flyingWingLeft = null;
    }
    if (this.flyingWingRight) {
      this.flyingWingRight.destroy();
      this.flyingWingRight = null;
    }
    if (this.flyingWingTween) {
      this.flyingWingTween.destroy();
      this.flyingWingTween = null;
    }

    // Stop bobbing (legacy, kept for safety)
    if (this.flyingBeanBobTween) {
      this.flyingBeanBobTween.destroy();
      this.flyingBeanBobTween = null;
    }

    // Stop particle timer
    if (this.flyingBeanParticleTimer) {
      this.flyingBeanParticleTimer.destroy();
      this.flyingBeanParticleTimer = null;
    }

    // Clear tint
    this.unicorn.clearTint();

    // Let unicorn fall back down
    this.unicorn.setVelocityY(0);

    this.showFloatingText(this.unicorn.x, this.unicorn.y - 40, 'Landung!', '#ffd600');
  }

  // ---- TOILET BREAK ----

  private scheduleToiletBreak(): void {
    const delay = Phaser.Math.Between(45000, 60000);
    this.toiletBreakTimer = this.time.delayedCall(delay, () => {
      if (!this.isGameOver && !this.isFlyingBean) {
        this.startToiletWarning();
      } else if (!this.isGameOver) {
        // Retry if flying
        this.scheduleToiletBreak();
      }
    });
  }

  private startToiletWarning(): void {
    // Show "!" above unicorn's head
    this.toiletWarningText = this.add.text(this.unicorn.x, this.unicorn.y - 50, '!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '32px',
      color: '#ff0000',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(200);

    // Blink the warning
    this.tweens.add({
      targets: this.toiletWarningText,
      alpha: 0.3,
      duration: 300,
      yoyo: true,
      repeat: 7,
    });

    // After 5 seconds, start the toilet break
    this.time.delayedCall(5000, () => {
      if (!this.isGameOver) {
        this.startToiletBreak();
      }
    });
  }

  private startToiletBreak(): void {
    this.isToiletBreak = true;
    this.preToiletSpeed = this.currentSpeed;

    // Remove warning text
    if (this.toiletWarningText) {
      this.toiletWarningText.destroy();
      this.toiletWarningText = null;
    }

    // Stop the unicorn
    this.unicorn.setVelocityY(0);
    this.unicorn.setVelocityX(0);

    // Place unicorn on ground
    this.unicorn.y = UNICORN.groundY - 30;

    // Show toilet sprite under/at unicorn
    this.toiletSprite = this.add.image(this.unicorn.x, UNICORN.groundY - 10, 'toilet')
      .setDepth(8);

    // Show "Topfchen-Pause!" text
    const pauseText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 60, 'Töpfchen-Pause!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '36px',
      color: '#ff8800',
      fontStyle: 'bold',
      stroke: '#333333',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(300);

    this.tweens.add({
      targets: pauseText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Score ticks slowly during pause
    const pauseScoreTimer = this.time.addEvent({
      delay: 2000,
      callback: () => {
        if (this.isToiletBreak && !this.isGameOver) {
          this.addScore(1);
        }
      },
      repeat: 2,
    });

    // After 5 seconds, resume
    this.time.delayedCall(5000, () => {
      this.isToiletBreak = false;

      // Remove toilet and text
      if (this.toiletSprite) {
        this.toiletSprite.destroy();
        this.toiletSprite = null;
      }
      pauseText.destroy();
      pauseScoreTimer.destroy();

      // Speed boost for 3 seconds after toilet break
      const boostedSpeed = this.preToiletSpeed * 1.3;
      this.currentSpeed = boostedSpeed;
      this.showFloatingText(this.unicorn.x, this.unicorn.y - 40, 'Frisch und schnell!', '#00e5ff');

      this.time.delayedCall(3000, () => {
        // Return to normal speed (or whatever it would have been)
        if (this.currentSpeed > SPEED.max) {
          this.currentSpeed = SPEED.max;
        }
      });

      // Schedule next toilet break
      this.scheduleToiletBreak();
    });
  }

  // ---- SCORING ----

  private addScore(amount: number): void {
    this.score += amount;
    this.scoreText.setText(`Punkte: ${this.score}`);

    // Dramatic score animation on large amounts
    if (amount >= 15) {
      this.tweens.add({
        targets: this.scoreText,
        scaleX: 1.3,
        scaleY: 1.3,
        duration: 150,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
    }
  }

  private showFloatingText(x: number, y: number, text: string, color: string): void {
    const floater = this.add.text(x, y, text, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: floater,
      y: y - 40,
      alpha: 0,
      duration: 800,
      ease: 'Cubic.easeOut',
      onComplete: () => floater.destroy(),
    });
  }

  // ---- DIFFICULTY / OBSTACLE TYPES ----

  private getDifficultyObstacles(): string[] {
    if (this.score < 100) return ['brokkoli', 'homework'];
    if (this.score < 300) return ['brokkoli', 'homework', 'mami'];
    if (this.score < 500) return ['brokkoli', 'homework', 'mami', 'papa'];
    if (this.score < 1000) return ['mami', 'papa', 'brokkoli', 'bedtime', 'berg'];
    return ['mami', 'papa', 'brokkoli', 'homework', 'bedtime', 'bathtub', 'berg'];
  }

  private getCurrentDifficulty(): DifficultyLevel {
    // We still use the constants for speed multiplier thresholds
    let level: DifficultyLevel = { scoreThreshold: 0, speedMultiplier: 1.0, obstacleTypes: [] };
    for (const d of [
      { scoreThreshold: 0, speedMultiplier: 1.0 },
      { scoreThreshold: 100, speedMultiplier: 1.2 },
      { scoreThreshold: 300, speedMultiplier: 1.4 },
      { scoreThreshold: 600, speedMultiplier: 1.6 },
      { scoreThreshold: 1000, speedMultiplier: 1.8 },
      { scoreThreshold: 2000, speedMultiplier: 2.0 },
    ]) {
      if (this.score >= d.scoreThreshold) {
        level = { ...d, obstacleTypes: this.getDifficultyObstacles() };
      }
    }
    return level;
  }

  private scheduleObstacle(): void {
    const difficulty = this.getCurrentDifficulty();
    const minGap = Math.max(
      SPAWN.obstacleMinGap / difficulty.speedMultiplier,
      150
    );
    const delay = Phaser.Math.Between(minGap, minGap + 1200);

    this.obstacleTimer = this.time.delayedCall(delay, () => {
      if (!this.isGameOver) {
        this.spawnObstacle();
        this.scheduleObstacle();
      }
    });
  }

  private spawnObstacle(): void {
    if (this.isToiletBreak) return;

    const { width } = this.scale;
    const types = this.getDifficultyObstacles();
    const type = Phaser.Utils.Array.GetRandom(types) as string;

    // Mountains are special — they are static platforms, not normal obstacles
    if (type === 'berg') {
      this.spawnMountain();
      return;
    }

    let x = width + 40;
    let y = UNICORN.groundY;
    let bodyWidth = 30;
    let bodyHeight = 30;

    switch (type) {
      case 'mami':
        y = UNICORN.groundY - 6;
        bodyWidth = 32;
        bodyHeight = 36;
        break;
      case 'papa':
        y = UNICORN.groundY - 10;
        bodyWidth = 34;
        bodyHeight = 42;
        break;
      case 'brokkoli':
        y = UNICORN.groundY - 2;
        bodyWidth = 24;
        bodyHeight = 22;
        break;
      case 'homework':
        y = UNICORN.groundY - 2;
        bodyWidth = 26;
        bodyHeight = 20;
        break;
      case 'bedtime':
        // Floating obstacle that bobs up and down
        y = UNICORN.groundY - Phaser.Math.Between(50, 90);
        bodyWidth = 30;
        bodyHeight = 28;
        break;
      case 'bathtub':
        y = UNICORN.groundY - 4;
        bodyWidth = 48;
        bodyHeight = 28;
        break;
    }

    const obstacle = this.obstacles.create(x, y, type) as Phaser.Physics.Arcade.Sprite;
    obstacle.body!.setSize(bodyWidth, bodyHeight);
    obstacle.setOrigin(0.5, 1);
    obstacle.setImmovable(true);
    (obstacle.body as Phaser.Physics.Arcade.Body).allowGravity = false;

    // Flying obstacles get a gentle bob
    if (type === 'bedtime') {
      this.tweens.add({
        targets: obstacle,
        y: y - 15,
        duration: 600 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  // ---- MOUNTAIN OBSTACLE ----

  private spawnMountain(): void {
    const { width } = this.scale;
    const x = width + 80;
    // Mountain sits on the ground — bottom aligned with ground level
    const y = UNICORN.groundY - 48; // top of mountain is 48px above ground

    const mountain = this.mountains.create(x, y, 'berg') as Phaser.Physics.Arcade.Sprite;
    mountain.setOrigin(0.5, 0.5);
    // Set the physics body to just the flat top area so the unicorn can land on it
    const body = mountain.body as Phaser.Physics.Arcade.StaticBody;
    // The berg texture is 120x80. The flat top is roughly from x=20 to x=100, top 10px
    body.setSize(80, 10);
    body.setOffset(20, 0);
    mountain.refreshBody();
  }

  // ---- COLLECTIBLES ----

  private scheduleCollectible(
    type: string,
    intervalRange: readonly [number, number]
  ): void {
    const delay = Phaser.Math.Between(intervalRange[0], intervalRange[1]);
    this.time.delayedCall(delay, () => {
      if (!this.isGameOver) {
        this.spawnCollectible(type);
        this.scheduleCollectible(type, intervalRange);
      }
    });
  }

  private spawnCollectible(type: string): void {
    const { width } = this.scale;
    const x = width + 30;
    const y = UNICORN.groundY - Phaser.Math.Between(40, 100);

    const item = this.collectibles.create(x, y, type) as Phaser.Physics.Arcade.Sprite;
    item.setOrigin(0.5, 0.5);
    (item.body as Phaser.Physics.Arcade.Body).allowGravity = false;
    item.body!.setSize(24, 24);

    // Gentle floating bob
    this.tweens.add({
      targets: item,
      y: y - 10,
      duration: 800 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Sparkle scale effect
    this.tweens.add({
      targets: item,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // ---- GAME OVER ----

  private gameOver(): void {
    this.isGameOver = true;

    // Stop timers
    if (this.obstacleTimer) this.obstacleTimer.destroy();
    if (this.scoreTimer) this.scoreTimer.destroy();
    if (this.comboTimer) this.comboTimer.destroy();
    if (this.flyingBeanTimer) this.flyingBeanTimer.destroy();
    if (this.flyingBeanParticleTimer) this.flyingBeanParticleTimer.destroy();
    if (this.flyingBeanBlinkTween) this.flyingBeanBlinkTween.destroy();
    if (this.flyingBeanRainbowTween) this.flyingBeanRainbowTween.destroy();
    if (this.flyingWingTween) this.flyingWingTween.destroy();
    if (this.flyingWingLeft) this.flyingWingLeft.destroy();
    if (this.flyingWingRight) this.flyingWingRight.destroy();
    if (this.fartComboResetTimer) this.fartComboResetTimer.destroy();
    if (this.toiletBreakTimer) this.toiletBreakTimer.destroy();

    // End any active furzbohne
    if (this.isFlyingBean) {
      this.endFurzbohne();
    }

    // Unicorn death animation
    this.unicorn.setTint(0xff0000);
    this.unicorn.setVelocityY(-300);
    this.physics.world.gravity.y = 0;

    // Screen effects
    this.cameras.main.shake(400, 0.02);
    this.cameras.main.flash(300, 255, 0, 0, false);

    // Save highscore
    const highScore = getHighScore();
    const isNewRecord = this.score > highScore;
    if (isNewRecord) {
      setHighScore(this.score);
    }

    // Transition after delay
    this.time.delayedCall(1200, () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(400, () => {
        this.scene.start('GameOver', {
          score: this.score,
          highScore: isNewRecord ? this.score : highScore,
          isNewRecord,
          level: this.selectedLevel,
          unicornKey: this.selectedUnicorn,
        });
      });
    });
  }
}
