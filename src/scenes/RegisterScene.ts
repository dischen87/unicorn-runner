import Phaser from 'phaser';
import { getPlayer, setPlayer } from '../utils/storage';

export class RegisterScene extends Phaser.Scene {
  private inputElement: HTMLInputElement | null = null;
  private container: HTMLDivElement | null = null;

  constructor() {
    super({ key: 'Register' });
  }

  create(): void {
    // If player already exists, skip to Menu
    const player = getPlayer();
    if (player) {
      this.scene.start('Menu');
      return;
    }

    this.showRegistration();
  }

  private showRegistration(): void {
    const { width, height } = this.scale;

    // Background: sky
    this.add.image(width / 2, height / 2, 'sky');

    // Hills
    this.add.image(width / 2, height - 60, 'hills').setAlpha(0.6);

    // Ground
    this.add.tileSprite(width / 2, 370, width, 64, 'ground').setDepth(1);

    // Title shadow
    this.add.text(width / 2 + 2, 52, 'Unicorn Runner', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '40px',
      color: '#000000',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.2);

    // Title
    this.add.text(width / 2, 50, 'Unicorn Runner', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '40px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#ff69b4',
      strokeThickness: 5,
    }).setOrigin(0.5);

    // Bouncing unicorn
    const unicorn = this.add.image(width / 2, 140, 'unicorn').setScale(2);
    this.tweens.add({
      targets: unicorn,
      y: 132,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Question text
    this.add.text(width / 2, 195, 'Wie heisst du?', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '26px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#333333',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Create HTML overlay for input
    this.createInputOverlay();

    // Fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  private createInputOverlay(): void {
    // Create a container div for the input and button
    this.container = document.createElement('div');
    this.container.id = 'register-overlay';
    this.container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      pointer-events: none;
      z-index: 10;
    `;

    // Wrapper for input + button (positioned lower to match scene layout)
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      pointer-events: auto;
      margin-top: 80px;
    `;

    // Input field
    this.inputElement = document.createElement('input');
    this.inputElement.type = 'text';
    this.inputElement.placeholder = 'Dein Name...';
    this.inputElement.maxLength = 20;
    this.inputElement.autocomplete = 'off';
    this.inputElement.style.cssText = `
      width: 240px;
      padding: 10px 16px;
      font-size: 20px;
      font-family: Arial, sans-serif;
      border: 3px solid #ff69b4;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.95);
      color: #333;
      text-align: center;
      outline: none;
      box-shadow: 0 4px 12px rgba(255, 105, 180, 0.3);
    `;

    // Focus style
    this.inputElement.addEventListener('focus', () => {
      if (this.inputElement) {
        this.inputElement.style.borderColor = '#ff1493';
        this.inputElement.style.boxShadow = '0 4px 16px rgba(255, 20, 147, 0.4)';
      }
    });
    this.inputElement.addEventListener('blur', () => {
      if (this.inputElement) {
        this.inputElement.style.borderColor = '#ff69b4';
        this.inputElement.style.boxShadow = '0 4px 12px rgba(255, 105, 180, 0.3)';
      }
    });

    // Enter key handler
    this.inputElement.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        this.confirmRegistration();
      }
    });

    // "Los!" button
    const button = document.createElement('button');
    button.textContent = 'Los! 🦄';
    button.style.cssText = `
      padding: 10px 40px;
      font-size: 22px;
      font-family: Arial, sans-serif;
      font-weight: bold;
      color: #ffffff;
      background: linear-gradient(135deg, #ff69b4, #ff1493);
      border: 3px solid #ffffff;
      border-radius: 12px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(255, 105, 180, 0.4);
      transition: transform 0.1s, box-shadow 0.1s;
    `;
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.05)';
      button.style.boxShadow = '0 6px 16px rgba(255, 105, 180, 0.5)';
    });
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 4px 12px rgba(255, 105, 180, 0.4)';
    });
    button.addEventListener('click', () => {
      this.confirmRegistration();
    });

    wrapper.appendChild(this.inputElement);
    wrapper.appendChild(button);
    this.container.appendChild(wrapper);
    document.body.appendChild(this.container);

    // Auto-focus input after a short delay
    setTimeout(() => {
      this.inputElement?.focus();
    }, 600);
  }

  private confirmRegistration(): void {
    const name = this.inputElement?.value.trim();
    if (!name || name.length === 0) {
      // Shake the input to indicate error
      if (this.inputElement) {
        this.inputElement.style.borderColor = '#ff0000';
        this.inputElement.placeholder = 'Bitte gib deinen Namen ein!';
        setTimeout(() => {
          if (this.inputElement) {
            this.inputElement.style.borderColor = '#ff69b4';
          }
        }, 1000);
      }
      return;
    }

    // Save player
    setPlayer(name);

    // Remove overlay
    this.removeOverlay();

    // Transition to Menu
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(400, () => {
      this.scene.start('Menu');
    });
  }

  private removeOverlay(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.inputElement = null;
  }

  shutdown(): void {
    this.removeOverlay();
  }

  destroy(): void {
    this.removeOverlay();
  }
}
