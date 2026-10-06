import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';

export const ICE_PANEL_WIDTH = 120;
export const ICE_PANEL_HEIGHT = 72;

export interface IcePanelConfig {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
}

export class IcePanel extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, config: IcePanelConfig) {
    super(scene, config.x, config.y, 'ice-panel');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(4);
    this.setVelocity(config.velocityX, config.velocityY);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(ICE_PANEL_WIDTH, ICE_PANEL_HEIGHT);
    body.setOffset(0, 0);
  }

  static randomConfig(): IcePanelConfig {
    return {
      x: Phaser.Math.Between(70, GAME_WIDTH - 70),
      y: Phaser.Math.Between(-90, -40),
      velocityX: Phaser.Math.Between(-20, 20),
      velocityY: Phaser.Math.Between(50, 80),
    };
  }

  containsPoint(x: number, y: number): boolean {
    const hw = ICE_PANEL_WIDTH / 2;
    const hh = ICE_PANEL_HEIGHT / 2;
    return x >= this.x - hw && x <= this.x + hw && y >= this.y - hh && y <= this.y + hh;
  }

  isOffScreen(): boolean {
    const margin = 100;
    return (
      this.x < -margin
      || this.x > GAME_WIDTH + margin
      || this.y < -margin
      || this.y > GAME_HEIGHT + margin
    );
  }
}
