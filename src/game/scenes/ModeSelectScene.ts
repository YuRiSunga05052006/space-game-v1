import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { createMenuButton } from '../ui/MenuButtons';

export class ModeSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ModeSelectScene' });
  }

  create(): void {
    this.cameras.main.fadeIn(400, 0, 0, 0);

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x0a0e27);

    for (let i = 0; i < 40; i++) {
      const star = this.add.image(
        Phaser.Math.Between(0, GAME_WIDTH),
        Phaser.Math.Between(0, GAME_HEIGHT),
        'star',
      );
      star.setAlpha(Phaser.Math.FloatBetween(0.2, 0.7));
      star.setScale(Phaser.Math.FloatBetween(0.5, 1.5));
    }

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 160, 'SELECT MODE', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '28px',
      fontStyle: '900',
      color: '#00d4ff',
    }).setOrigin(0.5);

    const startY = GAME_HEIGHT / 2 - 50;
    const gap = 58;

    const buttons = [
      {
        label: 'STORY',
        color: 0x00d4ff,
        onClick: () => this.transitionTo('WorldSelectScene', { mode: 'story' }),
      },
      {
        label: 'SURVIVAL',
        color: 0xffcc00,
        onClick: () => this.transitionTo('WorldSelectScene', { mode: 'survival' }),
      },
      {
        label: 'BACK',
        color: 0x8899bb,
        onClick: () => this.transitionTo('MenuScene'),
      },
    ];

    buttons.forEach((btn, i) => {
      const { container } = createMenuButton(this, {
        label: btn.label,
        y: startY + i * gap,
        color: btn.color,
        onClick: btn.onClick,
      });
      container.setX(GAME_WIDTH / 2);
    });
  }

  private transitionTo(sceneKey: string, data?: object): void {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(sceneKey, data);
    });
  }
}
