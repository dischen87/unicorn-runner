import Phaser from 'phaser';

export class FloatingText {
  static show(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    color: string = '#ffffff'
  ): void {
    const floatingText = scene.add.text(x, y, text, {
      fontFamily: 'Arial Rounded MT Bold, Arial, sans-serif',
      fontSize: '20px',
      color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
    });
    floatingText.setOrigin(0.5);
    floatingText.setDepth(100);

    scene.tweens.add({
      targets: floatingText,
      y: y - 50,
      alpha: { from: 1, to: 0 },
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        floatingText.destroy();
      },
    });
  }
}
