import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { Player } from '../entities/Player';
import { Asteroid, ASTEROID_DAMAGE, type AsteroidSize } from '../entities/Asteroid';
import { Heart, HEART_HEAL } from '../entities/Heart';
import { PowerStar, INVINCIBILITY_DURATION } from '../entities/PowerStar';
import { SpiderShip, SPIDER_BODY_DAMAGE } from '../entities/SpiderShip';
import { SeekerDrone, SEEKER_BODY_DAMAGE } from '../entities/SeekerDrone';
import { KamikazeWasp, WASP_BODY_DAMAGE } from '../entities/KamikazeWasp';
import { PlasmaTurret, TURRET_BODY_DAMAGE } from '../entities/PlasmaTurret';
import { BossShip } from '../entities/BossShip';
import { getBossConfigForLevel, getBossSpawnMsForLevel } from '../levelConfig';
import { computeBossHealth } from '../bossHealth';
import {
<<<<<<< Updated upstream
  BOSS_SPECIAL_DAMAGE,
  getBossDefinition,
  type BossDefinition,
} from '../world1/bosses';
import { isEnemyLaserOffScreen, LASER_DAMAGE, spawnEnemyLaser, type EnemyLaserOptions } from '../entities/EnemyLaser';
=======
  getBossDefinition,
  type BossDefinition,
} from '../world1/bosses';
import {
  BOSS_SPECIAL_LASER_DAMAGE,
  isEnemyLaserOffScreen,
  LASER_DAMAGE,
  spawnEnemyLaser,
  type EnemyLaserOptions,
} from '../entities/EnemyLaser';
>>>>>>> Stashed changes
import { HealthBar, MAX_HP } from '../ui/HealthBar';
import { BossHealthBar } from '../ui/BossHealthBar';
import {
  getDifficultyTier,
  getEscalatedAsteroidSpawnInterval,
  getEscalationLevel,
  HEART_SPAWN_MS,
  shouldSpawnSpiders,
  getSpiderSpawnMs,
  getMaxSpidersOnScreen,
  type DifficultyTier,
} from '../difficulty';
import {
  getEnemySpawnInterval,
  pickEnemyToSpawn,
  type EnemyKind,
} from '../enemies';
import { createMenuOverlay, createMenuButton } from '../ui/MenuButtons';
import {
  formatHighScoreLabel,
  goToLevelSelect,
  goToTitleScreen,
  restartGame,
  saveScoreAndGoToTitle,
  updateHighScore,
} from '../gameFlow';
import { addCoins } from '../coins';
import { unlockLevel, isLevelUnlocked, getMaxLevelSlots } from '../storyProgress';
import { getWorld1Level } from '../world1/levels';
import { getBackgroundTheme } from '../world1/backgrounds';
import { applyStoryBackground } from '../ui/StoryThemeBackground';
import { applyAudioSettings, initAudio, pauseMusic, playSfx, resumeMusic, startMusic } from '../audioManager';
import { normalizeGameSceneData, type GameMode } from '../gameMode';
import { getAutoFire } from '../settings';
import { createSettingsPanel } from '../ui/SettingsPanel';
import { LootBox } from '../entities/LootBox';
import { getNextLootMilestone, LOOT_MILESTONE_STEP, shouldSpawnLootAtScore } from '../loot';
import { rollWeaponChoices } from '../weapons';
import { createWeaponSelectPanel } from '../ui/WeaponSelectPanel';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private asteroids!: Phaser.Physics.Arcade.Group;
  private bullets!: Phaser.Physics.Arcade.Group;
  private hearts!: Phaser.Physics.Arcade.Group;
  private powerStars!: Phaser.Physics.Arcade.Group;
  private spiderShips!: Phaser.Physics.Arcade.Group;
  private seekerDrones!: Phaser.Physics.Arcade.Group;
  private kamikazeWasps!: Phaser.Physics.Arcade.Group;
  private plasmaTurrets!: Phaser.Physics.Arcade.Group;
  private enemyLasers!: Phaser.Physics.Arcade.Group;
  private lootBoxes!: Phaser.Physics.Arcade.Group;
  private bossShips!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private spaceKey!: Phaser.Input.Keyboard.Key;

  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private hp = MAX_HP;
  private healthBar!: HealthBar;
  private bossHealthBar!: BossHealthBar;
  private isGameOver = false;
  private isPaused = false;
  private pauseMenu?: Phaser.GameObjects.Container;
  private settingsPanel?: Phaser.GameObjects.Container;
  private escKey?: Phaser.Input.Keyboard.Key;
  private spawnTimer = 0;
  private spawnInterval = 1200;
  private difficultyTimer = 0;
  private spawnCount = 0;
  private heartSpawnTimer = 0;
  private difficultyTier: DifficultyTier = 'easy';
  private escalationLevel = 0;
  private maxHeartsOnScreen = 3;
  private powerStarSpawnTimer = 15000;
  private powerStarSpawnInterval = 30000;
  private maxPowerStarsOnScreen = 1;
  private spiderSpawnTimer = 0;
  private enemySpawnTimer = 0;
  private isHitStunned = false;
  private isChoosingWeapon = false;
  private weaponSelectPanel?: Phaser.GameObjects.Container;
  private weaponHudText?: Phaser.GameObjects.Text;
  private nextLootMilestone = LOOT_MILESTONE_STEP;
  private lastClaimedLootMilestone = 0;
  private pendingLootSpawns = 0;
  private gameMode: GameMode = 'survival';
  private storyLevel = 1;
  private levelTimer = 0;
  private bossSpawned = false;
  private bossDefeated = false;
  private bossActive = false;
  private timeText?: Phaser.GameObjects.Text;
  private victoryMenu?: Phaser.GameObjects.Container;
  private lastBossCoinReward = 0;
  private activeBossDefinition: BossDefinition | null = null;
  private bossMaxHealth = 0;
  private bossHealthRemaining = 0;
  private bossChargeRing?: Phaser.GameObjects.Graphics;
  private bossSkillText?: Phaser.GameObjects.Text;

  private touchTarget: Phaser.Math.Vector2 | null = null;
  private isDragging = false;
  private dragIndicator?: Phaser.GameObjects.Graphics;
  private autoFire = false;
  private manualFireHeld = false;
  private fireButton?: Phaser.GameObjects.Text;
  private moveHint?: Phaser.GameObjects.Text;
  private stars: Phaser.GameObjects.Image[] = [];
  private starSpeeds: number[] = [];

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { mode?: GameMode; level?: number }): void {
    const normalized = normalizeGameSceneData(data);
    this.gameMode = normalized.mode;
    this.storyLevel = normalized.level;
  }

  create(): void {
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.isGameOver = false;
    this.isPaused = false;
    this.pauseMenu?.destroy();
    this.pauseMenu = undefined;
    this.settingsPanel?.destroy();
    this.settingsPanel = undefined;
    this.score = 0;
    this.hp = MAX_HP;
    this.spawnInterval = 1200;
    this.spawnTimer = 0;
    this.difficultyTimer = 0;
    this.spawnCount = 0;
    this.heartSpawnTimer = 0;
    this.difficultyTier = 'easy';
    this.escalationLevel = 0;
    this.powerStarSpawnTimer = 15000;
    this.enemySpawnTimer = 0;
    this.isHitStunned = false;
    this.isChoosingWeapon = false;
    this.weaponSelectPanel?.destroy();
    this.weaponSelectPanel = undefined;
    this.weaponHudText?.destroy();
    this.weaponHudText = undefined;
    this.nextLootMilestone = LOOT_MILESTONE_STEP;
    this.lastClaimedLootMilestone = 0;
    this.pendingLootSpawns = 0;
    this.levelTimer = 0;
    this.bossSpawned = false;
    this.bossDefeated = false;
    this.bossActive = false;
    this.activeBossDefinition = null;
    this.bossMaxHealth = 0;
    this.bossHealthRemaining = 0;
    this.bossChargeRing?.destroy();
    this.bossChargeRing = undefined;
    this.bossSkillText?.destroy();
    this.bossSkillText = undefined;
    this.victoryMenu?.destroy();
    this.victoryMenu = undefined;
    this.autoFire = getAutoFire();

    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.createStarfield();
    if (this.gameMode === 'story') {
      const theme = getBackgroundTheme(getWorld1Level(this.storyLevel).themeId);
      applyStoryBackground(this, GAME_WIDTH, GAME_HEIGHT, theme);
    }
    this.createGroups();
    this.createPlayer();
    this.createUI();
    this.setupInput();
    this.setupCollisions();

    initAudio();
    startMusic();

    this.spawnAsteroid('lg');
    for (let i = 0; i < 4; i++) {
      this.time.delayedCall(100 + i * 400, () => this.spawnAsteroid());
    }
  }

  private createStarfield(): void {
    this.stars = [];
    this.starSpeeds = [];

    const starTint = this.gameMode === 'story'
      ? getBackgroundTheme(getWorld1Level(this.storyLevel).themeId).starColor
      : 0xffffff;

    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, GAME_WIDTH);
      const y = Phaser.Math.Between(0, GAME_HEIGHT);
      const star = this.add.image(x, y, 'star');
      star.setTint(starTint);
      star.setAlpha(Phaser.Math.FloatBetween(0.2, 0.8));
      star.setScale(Phaser.Math.FloatBetween(0.5, 2));
      star.setDepth(-1);
      this.stars.push(star);
      this.starSpeeds.push(Phaser.Math.FloatBetween(40, 140));
    }
  }

  private updateStarfield(delta: number): void {
    const dt = delta / 1000;
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      star.y += this.starSpeeds[i] * dt;
      if (star.y > GAME_HEIGHT + 10) {
        star.y = -10;
        star.x = Phaser.Math.Between(0, GAME_WIDTH);
      }
    }
  }

  private createGroups(): void {
    this.asteroids = this.physics.add.group();
    this.bullets = this.physics.add.group({
      defaultKey: 'bullet',
      maxSize: 80,
      runChildUpdate: false,
    });
    this.hearts = this.physics.add.group();
    this.powerStars = this.physics.add.group();
    this.spiderShips = this.physics.add.group();
    this.seekerDrones = this.physics.add.group();
    this.kamikazeWasps = this.physics.add.group();
    this.plasmaTurrets = this.physics.add.group();
    this.enemyLasers = this.physics.add.group();
    this.lootBoxes = this.physics.add.group();
    this.bossShips = this.physics.add.group();
  }

  private createPlayer(): void {
    this.player = new Player(this, GAME_WIDTH / 2, GAME_HEIGHT - 120);
    this.player.setAlpha(1);
  }

  private createUI(): void {
    const hudStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '16px',
      color: '#00d4ff',
    };

    const hudTextDepth = 110;

    this.scoreText = this.add.text(16, 12, 'SCORE 0', hudStyle)
      .setScrollFactor(0).setDepth(hudTextDepth);

    if (this.gameMode === 'story') {
      const levelMeta = getWorld1Level(this.storyLevel);
      const theme = getBackgroundTheme(levelMeta.themeId);

      this.timeText = this.add.text(16, 32, 'TIME 0:00', {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '11px',
        color: '#8899bb',
      }).setScrollFactor(0).setDepth(hudTextDepth);

      this.add.text(GAME_WIDTH - 16, 12, levelMeta.location.toUpperCase(), {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '10px',
        fontStyle: '700',
        color: `#${theme.accentColor.toString(16).padStart(6, '0')}`,
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(hudTextDepth);
    }

    this.healthBar = new HealthBar(this, GAME_WIDTH / 2, 58);
    this.bossHealthBar = new BossHealthBar(this, 82);
    this.weaponHudText = this.add.text(GAME_WIDTH / 2, 98, '', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '9px',
      color: '#556677',
      align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(hudTextDepth);
    this.createPauseButton();
    this.updateFireModeUI();

    if (this.sys.game.device.input.touch) {
      this.moveHint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 24, 'Drag to move', {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '11px',
        color: '#445566',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
    }
  }

  private updateFireModeUI(): void {
    this.fireButton?.destroy();
    this.fireButton = undefined;

    if (!this.autoFire && this.sys.game.device.input.touch) {
      this.fireButton = this.add
        .text(GAME_WIDTH - 16, GAME_HEIGHT - 24, 'FIRE', {
          fontFamily: 'Orbitron, sans-serif',
          fontSize: '14px',
          fontStyle: '700',
          color: '#00ffcc',
          backgroundColor: '#00ffcc22',
          padding: { x: 16, y: 8 },
        })
        .setOrigin(1, 0.5)
        .setScrollFactor(0)
        .setDepth(100)
        .setInteractive({ useHandCursor: true });

      this.fireButton.on('pointerdown', () => {
        this.manualFireHeld = true;
      });
      this.fireButton.on('pointerup', () => {
        this.manualFireHeld = false;
      });
      this.fireButton.on('pointerout', () => {
        this.manualFireHeld = false;
      });
    }

    if (this.moveHint) {
      this.moveHint.setY(this.fireButton ? GAME_HEIGHT - 48 : GAME_HEIGHT - 24);
    }
  }

  private applyFireMode(autoFire: boolean): void {
    this.autoFire = autoFire;
    this.manualFireHeld = false;
    this.updateFireModeUI();
  }

  private createPauseButton(): void {
    const btn = this.add.text(GAME_WIDTH - 16, 12, '⏸', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '22px',
      color: '#8899bb',
      backgroundColor: '#1a1f3a',
      padding: { x: 10, y: 6 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(110).setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setColor('#00d4ff'));
    btn.on('pointerout', () => btn.setColor('#8899bb'));
    btn.on('pointerup', () => this.togglePause());
  }

  private setupInput(): void {
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasd = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      };
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

      this.escKey.on('down', () => {
        if (this.isGameOver || this.isChoosingWeapon) return;
        this.togglePause();
      });
    }

    this.dragIndicator = this.add.graphics().setDepth(50).setScrollFactor(0);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isGameOver || this.isPaused || this.isChoosingWeapon) return;
      this.isDragging = true;
      this.touchTarget = new Phaser.Math.Vector2(pointer.x, pointer.y);
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging || this.isGameOver || this.isPaused || this.isChoosingWeapon) return;
      this.touchTarget = new Phaser.Math.Vector2(pointer.x, pointer.y);
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
      this.touchTarget = null;
      this.player.stopMove();
      this.dragIndicator?.clear();
    });

    this.input.on('pointerupoutside', () => {
      this.isDragging = false;
      this.touchTarget = null;
      this.player.stopMove();
      this.dragIndicator?.clear();
    });
  }

  private setupCollisions(): void {
    this.physics.add.overlap(
      this.bullets,
      this.asteroids,
      this.onBulletHitAsteroid as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.player,
      this.asteroids,
      this.onPlayerHitAsteroid as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.player,
      this.hearts,
      this.onPlayerCollectHeart as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.player,
      this.powerStars,
      this.onPlayerCollectPowerStar as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.bullets,
      this.spiderShips,
      this.onBulletHitSpider as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.bullets,
      this.seekerDrones,
      this.onBulletHitSeeker as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.bullets,
      this.kamikazeWasps,
      this.onBulletHitWasp as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.bullets,
      this.plasmaTurrets,
      this.onBulletHitTurret as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.bullets,
      this.bossShips,
      this.onBulletHitBoss as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.player,
      this.enemyLasers,
      this.onPlayerHitLaser as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.player,
      this.spiderShips,
      this.onPlayerHitSpider as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.player,
      this.seekerDrones,
      this.onPlayerHitSeeker as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.player,
      this.kamikazeWasps,
      this.onPlayerHitWasp as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.player,
      this.plasmaTurrets,
      this.onPlayerHitTurret as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.player,
      this.bossShips,
      this.onPlayerHitBoss as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.player,
      this.lootBoxes,
      this.onPlayerCollectLootBox as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );
  }

  private onBulletHitAsteroid(
    bulletObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    asteroidObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    const bullet = bulletObj as Phaser.Physics.Arcade.Sprite;
    const asteroid = asteroidObj as Asteroid;
    const damage = (bullet.getData('damage') as number) ?? 1;

    if (asteroid.takeDamage(damage)) {
      this.addScore(asteroid.points);
      this.spawnExplosion(asteroid.x, asteroid.y, asteroid.size === 'lg' ? 12 : asteroid.size === 'md' ? 8 : 5);
    }
    this.consumeBulletHit(bullet);
  }

  private onBulletHitSpider(
    bulletObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    spiderObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    this.applyBulletToScoredEnemy(
      bulletObj as Phaser.Physics.Arcade.Sprite,
      spiderObj as SpiderShip,
      10,
    );
  }

  private onBulletHitSeeker(
    bulletObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    seekerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    this.applyBulletToScoredEnemy(
      bulletObj as Phaser.Physics.Arcade.Sprite,
      seekerObj as SeekerDrone,
      6,
    );
  }

  private onBulletHitWasp(
    bulletObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    waspObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    this.applyBulletToScoredEnemy(
      bulletObj as Phaser.Physics.Arcade.Sprite,
      waspObj as KamikazeWasp,
      6,
    );
  }

  private onBulletHitTurret(
    bulletObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    turretObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    this.applyBulletToScoredEnemy(
      bulletObj as Phaser.Physics.Arcade.Sprite,
      turretObj as PlasmaTurret,
      10,
    );
  }

  private onBulletHitBoss(
    bulletObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    bossObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    const bullet = bulletObj as Phaser.Physics.Arcade.Sprite;
    const boss = bossObj as BossShip;
    const damage = (bullet.getData('damage') as number) ?? 1;

    if (boss.takeDamage(damage)) {
      this.bossHealthBar.hide();
      this.addScore(boss.points);
      this.spawnExplosion(boss.x, boss.y, 20);
      this.onBossDefeated();
    } else {
      this.bossHealthRemaining = boss.health;
      this.bossHealthBar.setHp(boss.health);
    }
    this.consumeBulletHit(bullet);
  }

  private applyBulletToScoredEnemy(
    bullet: Phaser.Physics.Arcade.Sprite,
    enemy: { takeDamage(amount: number): boolean; points: number; x: number; y: number },
    explosionCount: number,
  ): void {
    const damage = (bullet.getData('damage') as number) ?? 1;
    if (enemy.takeDamage(damage)) {
      this.addScore(enemy.points);
      this.spawnExplosion(enemy.x, enemy.y, explosionCount);
    }
    this.consumeBulletHit(bullet);
  }

  private consumeBulletHit(bullet: Phaser.Physics.Arcade.Sprite): void {
    const pierce = (bullet.getData('pierce') as number) ?? 0;
    if (pierce > 0) {
      bullet.setData('pierce', pierce - 1);
      return;
    }
    bullet.destroy();
  }

  private onPlayerHitLaser(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    laserObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    if (this.isGameOver || this.isPaused || this.isChoosingWeapon) return;
    const laser = laserObj as Phaser.Physics.Arcade.Sprite;
    const fromX = laser.x;
    const fromY = laser.y;
    laser.destroy();
    const damage = (laser.getData('damage') as number) ?? LASER_DAMAGE;
    this.takeLaserDamage(damage, fromX, fromY);
  }

  private onPlayerHitSpider(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    spiderObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    this.handleEnemyRam(spiderObj as SpiderShip, SPIDER_BODY_DAMAGE, 10);
  }

  private onPlayerHitSeeker(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    seekerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    this.handleEnemyRam(seekerObj as SeekerDrone, SEEKER_BODY_DAMAGE, 6);
  }

  private onPlayerHitWasp(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    waspObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    this.handleEnemyRam(waspObj as KamikazeWasp, WASP_BODY_DAMAGE, 6);
  }

  private onPlayerHitTurret(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    turretObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    this.handleEnemyRam(turretObj as PlasmaTurret, TURRET_BODY_DAMAGE, 10);
  }

  private onPlayerHitBoss(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    bossObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    if (this.isGameOver || this.isPaused || this.isChoosingWeapon) return;

    const boss = bossObj as BossShip;
    if (this.player.isInvincible()) return;

    this.takeDamage(boss.bodyDamage);
  }

  private handleEnemyRam(
    enemy: Phaser.Physics.Arcade.Sprite & { points: number },
    bodyDamage: number,
    explosionCount: number,
  ): void {
    if (this.isGameOver || this.isPaused || this.isChoosingWeapon) return;

    if (this.player.isInvincible()) {
      enemy.destroy();
      this.addScore(enemy.points);
      this.spawnExplosion(enemy.x, enemy.y, explosionCount);
      return;
    }

    enemy.destroy();
    this.takeDamage(bodyDamage);
  }

  private togglePause(): void {
    if (this.isGameOver || this.isChoosingWeapon) return;
    if (this.isPaused) {
      this.resumeGame();
    } else {
      this.showPauseMenu();
    }
  }

  private showPauseMenu(): void {
    if (this.isPaused || this.isGameOver) return;

    this.isPaused = true;
    this.isDragging = false;
    this.touchTarget = null;
    this.player.stopMove();
    this.dragIndicator?.clear();
    this.physics.pause();
    this.time.paused = true;
    this.tweens.pauseAll();
    pauseMusic();

    const pauseButtons = [
      { label: 'CONTINUE', y: 0, onClick: () => this.resumeGame() },
      {
        label: 'RESTART',
        y: 0,
        color: 0xffcc00,
        onClick: () => restartGame(this, this.score, this.gameMode, this.storyLevel),
      },
    ];

    if (this.gameMode === 'story') {
      pauseButtons.push({
        label: 'LEVEL SELECT',
        y: 0,
        color: 0x8899bb,
        onClick: () => this.quitToLevelSelect(),
      });
    }

    pauseButtons.push(
      { label: 'SETTINGS', y: 0, color: 0x8899bb, onClick: () => this.showSettingsFromPause() },
      { label: 'QUIT', y: 0, color: 0xff4466, onClick: () => this.quitToTitle() },
    );

    const buttonStartY = this.gameMode === 'story'
      ? GAME_HEIGHT / 2 - 20
      : GAME_HEIGHT / 2 - 40;

    this.pauseMenu = createMenuOverlay(this, 'PAUSED', pauseButtons, 200, buttonStartY);
  }

  private showSettingsFromPause(): void {
    this.pauseMenu?.setVisible(false);

    const panel = createSettingsPanel(this, 260, {
      onBack: () => {
        panel.destroy();
        this.settingsPanel = undefined;
        this.pauseMenu?.setVisible(true);
      },
      onAutoFireChange: (autoFire) => this.applyFireMode(autoFire),
      onSoundVolumeChange: () => applyAudioSettings(),
      onMusicVolumeChange: () => applyAudioSettings(),
    });
    this.settingsPanel = panel.root;
  }

  private resumeGame(): void {
    if (!this.isPaused) return;

    this.isPaused = false;
    this.pauseMenu?.destroy();
    this.pauseMenu = undefined;
    this.settingsPanel?.destroy();
    this.settingsPanel = undefined;
    this.time.paused = false;
    this.tweens.resumeAll();
    this.physics.resume();
    resumeMusic();
  }

  private quitToTitle(): void {
    this.isPaused = false;
    this.pauseMenu?.destroy();
    this.pauseMenu = undefined;
    this.settingsPanel?.destroy();
    this.settingsPanel = undefined;
    saveScoreAndGoToTitle(this, this.score, this.gameMode);
  }

  private quitToLevelSelect(): void {
    this.isPaused = false;
    this.pauseMenu?.destroy();
    this.pauseMenu = undefined;
    this.settingsPanel?.destroy();
    this.settingsPanel = undefined;
    goToLevelSelect(this);
  }

  private onPlayerHitAsteroid(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    asteroidObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    if (this.isGameOver || this.isPaused) return;
    const asteroid = asteroidObj as Asteroid;

    if (this.player.isInvincible()) {
      asteroid.destroy();
      this.addScore(asteroid.points);
      this.spawnExplosion(
        asteroid.x,
        asteroid.y,
        asteroid.size === 'lg' ? 12 : asteroid.size === 'md' ? 8 : 5,
      );
      return;
    }

    const damage = ASTEROID_DAMAGE[asteroid.size];
    asteroid.destroy();
    this.takeDamage(damage);
  }

  private onPlayerCollectPowerStar(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    starObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    if (this.isGameOver || this.isPaused) return;
    const star = starObj as PowerStar;
    star.destroy();
    this.player.activateInvincibility(INVINCIBILITY_DURATION);
    this.spawnPowerStarCollectEffect(this.player.x, this.player.y);
  }

  private spawnPowerStarCollectEffect(x: number, y: number): void {
    const emitter = this.add.particles(x, y, 'particle', {
      speed: { min: 50, max: 150 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 500,
      tint: [0xffcc00, 0xff9900, 0xffffff, 0xffee88],
      quantity: 12,
      emitting: false,
    });
    emitter.explode(12);
    this.time.delayedCall(600, () => emitter.destroy());
    this.cameras.main.flash(100, 255, 204, 0, false);
  }

  private onPlayerCollectHeart(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    heartObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    if (this.isGameOver || this.isPaused) return;
    const heart = heartObj as Heart;
    heart.destroy();
    this.heal(HEART_HEAL);
  }

  private heal(amount: number): void {
    const prevHp = this.hp;
    this.hp = Math.min(MAX_HP, this.hp + amount);
    if (this.hp === prevHp) return;

    this.healthBar.setHp(this.hp);
    this.spawnHealEffect(this.player.x, this.player.y);
  }

  private spawnHealEffect(x: number, y: number): void {
    const emitter = this.add.particles(x, y, 'particle', {
      speed: { min: 30, max: 80 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 400,
      tint: [0xff4466, 0xff8899, 0xffffff],
      quantity: 8,
      emitting: false,
    });
    emitter.explode(8);
    this.time.delayedCall(500, () => emitter.destroy());

    this.tweens.add({
      targets: this.healthBar,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 120,
      yoyo: true,
    });
  }

  private addScore(points: number): void {
    this.score += points;
    this.scoreText.setText(`SCORE ${this.score}`);

    const newTier = getDifficultyTier(this.score);
    if (newTier !== this.difficultyTier) {
      this.difficultyTier = newTier;
      this.heartSpawnTimer = 0;
      this.spiderSpawnTimer = 0;
    }

    const newEscalation = getEscalationLevel(this.score);
    if (newEscalation !== this.escalationLevel) {
      this.escalationLevel = newEscalation;
      this.spawnTimer = 0;
      this.spiderSpawnTimer = 0;
    }

    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 100,
      yoyo: true,
    });

    this.checkLootMilestones();
  }

  private checkLootMilestones(): void {
    while (shouldSpawnLootAtScore(this.score, this.nextLootMilestone)) {
      this.pendingLootSpawns += 1;
      this.lastClaimedLootMilestone = this.nextLootMilestone;
      this.nextLootMilestone = getNextLootMilestone(this.lastClaimedLootMilestone);
    }
    this.trySpawnLootBox();
  }

  private trySpawnLootBox(): void {
    if (this.pendingLootSpawns <= 0) return;
    if (this.isGameOver || this.isPaused || this.isChoosingWeapon) return;
    if (this.lootBoxes.countActive(true) >= 1) return;

    this.pendingLootSpawns -= 1;
    this.spawnLootBox();
  }

  private spawnLootBox(): void {
    if (this.lootBoxes.countActive(true) >= 1) return;

    const { x, y } = LootBox.randomSpawnPosition();
    const box = new LootBox(this, x, y);
    this.lootBoxes.add(box);
  }

  private onPlayerCollectLootBox(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    boxObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    if (this.isGameOver || this.isPaused || this.isChoosingWeapon) return;
    const box = boxObj as LootBox;
    box.destroy();
    this.openWeaponSelect();
  }

  private openWeaponSelect(): void {
    if (this.isChoosingWeapon || this.isGameOver) return;

    this.isChoosingWeapon = true;
    this.isDragging = false;
    this.manualFireHeld = false;
    this.touchTarget = null;
    this.player.stopMove();
    this.dragIndicator?.clear();
    this.physics.pause();
    this.time.paused = true;
    this.tweens.pauseAll();

    const choices = rollWeaponChoices(this.player.getOwnedWeaponIds(), 3);
    if (choices.length === 0) {
      this.closeWeaponSelect();
      return;
    }

    const panel = createWeaponSelectPanel(this, 260, {
      weapons: choices,
      onSelect: (weaponId) => {
        this.player.addWeapon(weaponId);
        this.updateWeaponHud();
        panel.destroy();
        this.weaponSelectPanel = undefined;
        this.closeWeaponSelect();
        this.cameras.main.flash(150, 0, 212, 255, false);
      },
    });
    this.weaponSelectPanel = panel.root;
  }

  private closeWeaponSelect(): void {
    if (!this.isChoosingWeapon) return;

    this.isChoosingWeapon = false;
    if (!this.isPaused && !this.isGameOver) {
      this.time.paused = false;
      this.tweens.resumeAll();
      this.physics.resume();
    }

    this.trySpawnLootBox();
  }

  private updateWeaponHud(): void {
    if (!this.weaponHudText) return;
    const names = this.player.getOwnedWeaponNames();
    if (names.length === 0) {
      this.weaponHudText.setText('');
      return;
    }
    const maxShown = 3;
    const shown = names.slice(0, maxShown);
    const extra = names.length - maxShown;
    this.weaponHudText.setText(
      extra > 0 ? `${shown.join(' · ')} +${extra}` : shown.join(' · '),
    );
  }

  private takeLaserDamage(amount: number, fromX: number, fromY: number): void {
    if (this.player.isInvincible() || this.isHitStunned) return;

    this.hp = Math.max(0, this.hp - amount);
    this.healthBar.setHp(this.hp);
    this.cameras.main.shake(200, 0.005);
    this.cameras.main.flash(100, 255, 80, 80);

    const angle = Phaser.Math.Angle.Between(fromX, fromY, this.player.x, this.player.y);
    this.player.setVelocity(Math.cos(angle) * 120, Math.sin(angle) * 120);
    this.player.stopMove();

    if (this.hp <= 0) {
      this.triggerGameOver();
      return;
    }

    this.isHitStunned = true;
    this.time.delayedCall(500, () => {
      this.isHitStunned = false;
      this.player.setVelocity(0, 0);
    });
  }

  private takeDamage(amount: number): void {
    if (this.player.isInvincible()) return;

    this.hp = Math.max(0, this.hp - amount);
    this.healthBar.setHp(this.hp);
    this.spawnExplosion(this.player.x, this.player.y, 20);
    this.cameras.main.shake(200, 0.01);
    this.cameras.main.flash(150, 255, 50, 50);

    if (this.hp <= 0) {
      this.triggerGameOver();
      return;
    }

    this.player.setPosition(GAME_WIDTH / 2, GAME_HEIGHT - 120);
    this.player.setVelocity(0, 0);
    this.player.setAlpha(0.35);
    this.physics.pause();

    this.time.delayedCall(1000, () => {
      if (this.isGameOver) return;
      this.physics.resume();
      this.tweens.killTweensOf(this.player);
      this.player.setAlpha(1);
    });
  }

  private triggerGameOver(): void {
    this.isGameOver = true;
    this.isPaused = false;
    this.isChoosingWeapon = false;
    this.pauseMenu?.destroy();
    this.pauseMenu = undefined;
    this.weaponSelectPanel?.destroy();
    this.weaponSelectPanel = undefined;

    if (this.gameMode === 'survival') {
      updateHighScore(this.score);
    }

    this.physics.pause();
    this.player.stopMove();

    const buttons = [
      {
        label: 'RESTART',
        y: 0,
        onClick: () => restartGame(this, this.score, this.gameMode, this.storyLevel),
      },
      {
        label: 'QUIT',
        y: 0,
        color: 0xff4466,
        onClick: () => goToTitleScreen(this),
      },
    ];

    createMenuOverlay(this, 'GAME OVER', buttons, 200, GAME_HEIGHT / 2 + 40);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 85, `Score: ${this.score}`, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '18px',
      color: '#8899bb',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    if (this.gameMode === 'survival') {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 58, formatHighScoreLabel(), {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '14px',
        color: '#00d4ff',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    }
  }

  private onBossDefeated(): void {
    if (this.bossDefeated || this.gameMode !== 'story') return;

    this.bossDefeated = true;
    this.bossActive = false;
    this.activeBossDefinition = null;
    this.bossChargeRing?.destroy();
    this.bossChargeRing = undefined;
    this.bossSkillText?.destroy();
    this.bossSkillText = undefined;
    this.bossHealthBar.hide();
    this.triggerVictory();
  }

  private triggerVictory(): void {
    this.isGameOver = true;
    this.isPaused = false;
    this.isChoosingWeapon = false;
    this.pauseMenu?.destroy();
    this.pauseMenu = undefined;
    this.weaponSelectPanel?.destroy();
    this.weaponSelectPanel = undefined;
    this.physics.pause();
    this.player.stopMove();

    addCoins(this.lastBossCoinReward);
    const nextLevel = this.storyLevel + 1;
    if (nextLevel <= getMaxLevelSlots()) {
      unlockLevel(nextLevel);
    }

    this.cameras.main.flash(300, 255, 204, 0, false);

    const root = this.add.container(0, 0).setDepth(270).setScrollFactor(0);
    this.victoryMenu = root;

    root.add(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8));

    const levelMeta = getWorld1Level(this.storyLevel);
    const victoryTitle = this.storyLevel === getMaxLevelSlots()
      ? 'STORY COMPLETE!'
      : `${levelMeta.location.toUpperCase()} CLEAR!`;

    root.add(this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120, victoryTitle, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '32px',
      fontStyle: '900',
      color: '#00d4ff',
    }).setOrigin(0.5));

    root.add(this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 70, `+${this.lastBossCoinReward} COINS`, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '18px',
      color: '#ffcc00',
    }).setOrigin(0.5));

    let buttonY = GAME_HEIGHT / 2 - 10;

    if (nextLevel <= getMaxLevelSlots() && isLevelUnlocked(nextLevel)) {
      const { container: continueBtn } = createMenuButton(this, {
        label: `CONTINUE TO LEVEL ${nextLevel}`,
        y: buttonY,
        color: 0x00d4ff,
        onClick: () => {
          this.cameras.main.fadeOut(300, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('GameScene', { mode: 'story', level: nextLevel });
          });
        },
      });
      continueBtn.setX(GAME_WIDTH / 2);
      root.add(continueBtn);
      buttonY += 64;
    }

    const { container: selectBtn } = createMenuButton(this, {
      label: 'LEVEL SELECT',
      y: buttonY,
      color: 0x8899bb,
      onClick: () => goToLevelSelect(this),
    });
    selectBtn.setX(GAME_WIDTH / 2);
    root.add(selectBtn);
  }

  private createBossInstance(definition: BossDefinition, health?: number, maxHealth?: number): BossShip {
    const boss = new BossShip(
      this,
      GAME_WIDTH / 2,
      100,
      definition,
      (lx, ly, angle) => this.fireEnemyLaser(lx, ly, angle),
      () => this.fireBossSpecial(boss),
      health,
      maxHealth,
    );
    this.bossShips.add(boss);
    this.bossHealthRemaining = boss.health;
    this.bossHealthBar.show(boss.maxHealth, boss.health, definition.bossName);
    return boss;
  }

  private spawnBoss(): void {
    if (this.bossSpawned || this.bossDefeated || this.bossShips.countActive(true) > 0) return;

    const levelConfig = getBossConfigForLevel(this.storyLevel);
    const definition = getBossDefinition(this.storyLevel);
    const scaledHealth = computeBossHealth(definition.baseHealth, this.player.getPowerScore());

    this.activeBossDefinition = definition;
    this.bossMaxHealth = scaledHealth;
    this.lastBossCoinReward = levelConfig.coinReward;
    this.bossSpawned = true;
    this.bossActive = true;

    this.createBossInstance(definition, scaledHealth, scaledHealth);

    this.cameras.main.shake(400, 0.012);
    const warning = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, definition.bossName.toUpperCase(), {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '24px',
      fontStyle: '900',
      color: '#ff2244',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(150);

    this.tweens.add({
      targets: warning,
      alpha: 0,
      duration: 2000,
      onComplete: () => warning.destroy(),
    });
  }

  private fireBossSpecial(boss: BossShip): void {
    const special = boss.definition.special;
    const tx = this.player.x;
    const ty = this.player.y;
    const baseAngle = Phaser.Math.Angle.Between(boss.x, boss.y, tx, ty);
    const specialOpts: EnemyLaserOptions = {
<<<<<<< Updated upstream
      damage: BOSS_SPECIAL_DAMAGE,
=======
      damage: BOSS_SPECIAL_LASER_DAMAGE,
>>>>>>> Stashed changes
      isSpecial: true,
    };

    const fireSpecial = (angle: number, speed = 240) => {
      spawnEnemyLaser(this.enemyLasers, boss.x, boss.y, angle, { ...specialOpts, speed });
    };

    switch (special.pattern) {
      case 'beam':
        fireSpecial(baseAngle, 300);
        break;
      case 'fan': {
        const spread = (special.spreadDeg ?? 28) * (Math.PI / 180);
        const count = special.count ?? 3;
        const half = (count - 1) / 2;
        for (let i = 0; i < count; i++) {
          const t = half === 0 ? 0 : (i / half) - 1;
          fireSpecial(baseAngle + t * spread, 260);
        }
        break;
      }
      case 'ring': {
        const count = special.count ?? 8;
        for (let i = 0; i < count; i++) {
          fireSpecial((i / count) * Math.PI * 2, 200);
        }
        break;
      }
      case 'solarFan': {
        const spread = (special.spreadDeg ?? 50) * (Math.PI / 180);
        const count = special.count ?? 5;
        const down = Math.PI / 2;
        const half = (count - 1) / 2;
        for (let i = 0; i < count; i++) {
          const t = half === 0 ? 0 : (i / half) - 1;
          fireSpecial(down + t * spread, 220);
        }
        break;
      }
      case 'tripleLine': {
        const tight = 6 * (Math.PI / 180);
        fireSpecial(baseAngle - tight, 280);
        fireSpecial(baseAngle, 280);
        fireSpecial(baseAngle + tight, 280);
        break;
      }
      case 'sniper':
        fireSpecial(baseAngle, 360);
        break;
      case 'heavyTriple': {
        const spread = 10 * (Math.PI / 180);
        fireSpecial(baseAngle - spread, 180);
        fireSpecial(baseAngle, 180);
        fireSpecial(baseAngle + spread, 180);
        break;
      }
      case 'cross': {
        fireSpecial(baseAngle, 250);
        fireSpecial(baseAngle + Math.PI / 2, 250);
        fireSpecial(baseAngle + Math.PI, 250);
        fireSpecial(baseAngle - Math.PI / 2, 250);
        break;
      }
      case 'converge': {
        const count = special.count ?? 5;
        const spread = 20 * (Math.PI / 180);
        const half = (count - 1) / 2;
        for (let i = 0; i < count; i++) {
          const t = half === 0 ? 0 : (i / half) - 1;
          fireSpecial(baseAngle + t * spread, 250);
        }
        break;
      }
      case 'doubleRing': {
        const count = special.count ?? 10;
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2;
          fireSpecial(a, 210);
          fireSpecial(a + Math.PI / count, 190);
        }
        break;
      }
    }

    this.showBossSkillName(special.name);
  }

  private showBossSkillName(name: string): void {
    this.bossSkillText?.destroy();
    this.bossSkillText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, name.toUpperCase(), {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '18px',
      fontStyle: '900',
      color: '#ff44aa',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(160);

    this.tweens.add({
      targets: this.bossSkillText,
      alpha: 0,
      duration: 1800,
      onComplete: () => {
        this.bossSkillText?.destroy();
        this.bossSkillText = undefined;
      },
    });
  }

  private updateBossChargeRing(boss: BossShip): void {
    if (!boss.isCharging()) {
      this.bossChargeRing?.clear();
      return;
    }

    if (!this.bossChargeRing) {
      this.bossChargeRing = this.add.graphics().setDepth(9);
    }

    this.bossChargeRing.clear();
    this.bossChargeRing.lineStyle(3, 0xff2244, 0.85);
    this.bossChargeRing.strokeCircle(boss.x, boss.y, 42);
  }

  private updateBoss(time: number): void {
    this.bossShips.children.each((child) => {
      const boss = child as BossShip;
      boss.updateMovement();
      boss.updateSpecial(time);
      boss.tryFire(time, this.player.x, this.player.y);
      this.updateBossChargeRing(boss);
      return true;
    });
  }

  private updateStoryTimer(delta: number): void {
    if (this.gameMode !== 'story') return;

    this.levelTimer += delta;

    if (this.timeText) {
      const totalSec = Math.floor(this.levelTimer / 1000);
      const min = Math.floor(totalSec / 60);
      const sec = totalSec % 60;
      this.timeText.setText(`TIME ${min}:${sec.toString().padStart(2, '0')}`);
    }

    if (
      !this.bossSpawned &&
      !this.bossDefeated &&
      this.levelTimer >= getBossSpawnMsForLevel(this.storyLevel)
    ) {
      this.spawnBoss();
    }
  }

  private spawnAsteroid(forcedSize?: AsteroidSize): void {
    if (this.isGameOver || this.isPaused) return;
    const config = Asteroid.randomConfig(forcedSize);
    const asteroid = new Asteroid(this, config);
    this.asteroids.add(asteroid);
    asteroid.setVelocity(config.velocityX, config.velocityY);
  }

  private spawnHeart(): void {
    if (this.isGameOver || this.isPaused) return;
    if (this.hearts.countActive(true) >= this.maxHeartsOnScreen) return;

    const { x, y } = Heart.randomSpawnPosition();
    const heart = new Heart(this, x, y);
    this.hearts.add(heart);
    heart.setVelocity(
      Phaser.Math.Between(-30, 30),
      Phaser.Math.Between(25, 55),
    );
  }

  private spawnPowerStar(): void {
    if (this.isGameOver || this.isPaused) return;
    if (this.powerStars.countActive(true) >= this.maxPowerStarsOnScreen) return;

    const { x, y } = PowerStar.randomSpawnPosition();
    const star = new PowerStar(this, x, y);
    this.powerStars.add(star);
    star.setVelocity(
      Phaser.Math.Between(-25, 25),
      Phaser.Math.Between(20, 45),
    );
  }

  private fireEnemyLaser(x: number, y: number, angle: number, options?: EnemyLaserOptions): void {
    spawnEnemyLaser(this.enemyLasers, x, y, angle, options);
  }

  private spawnSpiderShip(): void {
    if (this.isGameOver || this.isPaused) return;
    if (!shouldSpawnSpiders(this.score)) return;
    if (this.spiderShips.countActive(true) >= getMaxSpidersOnScreen(this.score)) return;

    const config = SpiderShip.randomConfig();
    const spider = new SpiderShip(this, config, (lx, ly, angle) => {
      this.fireEnemyLaser(lx, ly, angle);
    });
    this.spiderShips.add(spider);
    spider.setVelocity(config.velocityX, config.velocityY);
  }

  private getEnemyCounts(): Record<EnemyKind, number> {
    return {
      spider: this.spiderShips.countActive(true),
      seeker: this.seekerDrones.countActive(true),
      wasp: this.kamikazeWasps.countActive(true),
      turret: this.plasmaTurrets.countActive(true),
    };
  }

  private spawnEnemy(kind: EnemyKind): void {
    if (this.isGameOver || this.isPaused || this.isChoosingWeapon) return;

    switch (kind) {
      case 'spider': {
        const config = SpiderShip.randomConfig();
        const spider = new SpiderShip(this, config, (lx, ly, angle) => {
          this.fireEnemyLaser(lx, ly, angle);
        });
        this.spiderShips.add(spider);
        spider.setVelocity(config.velocityX, config.velocityY);
        break;
      }
      case 'seeker': {
        const config = SeekerDrone.randomConfig();
        const seeker = new SeekerDrone(this, config);
        this.seekerDrones.add(seeker);
        seeker.setVelocity(config.velocityX, config.velocityY);
        break;
      }
      case 'wasp': {
        const config = KamikazeWasp.randomConfig();
        const wasp = new KamikazeWasp(this, config);
        this.kamikazeWasps.add(wasp);
        wasp.setVelocity(0, config.velocityY);
        break;
      }
      case 'turret': {
        const config = PlasmaTurret.randomConfig();
        const turret = new PlasmaTurret(this, config, (lx, ly, angle) => {
          this.fireEnemyLaser(lx, ly, angle);
        });
        this.plasmaTurrets.add(turret);
        turret.setVelocity(config.velocityX, config.velocityY);
        break;
      }
    }
  }

  private updateEnemies(time: number, delta: number): void {
    const px = this.player.x;
    const py = this.player.y;

    this.spiderShips.children.each((child) => {
      (child as SpiderShip).tryFire(time, px, py);
      return true;
    });

    this.seekerDrones.children.each((child) => {
      (child as SeekerDrone).updateSeeker(px, py, delta);
      return true;
    });

    this.kamikazeWasps.children.each((child) => {
      (child as KamikazeWasp).updateWasp(time, delta);
      return true;
    });

    this.plasmaTurrets.children.each((child) => {
      (child as PlasmaTurret).tryFire(time, px, py);
      return true;
    });
  }

  private spawnExplosion(x: number, y: number, count: number): void {
    playSfx('explosion');
    const emitter = this.add.particles(x, y, 'particle', {
      speed: { min: 60, max: 200 },
      scale: { start: 1, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 500,
      tint: [0xff6b35, 0xffcc00, 0xff4466, 0xffffff],
      quantity: count,
      emitting: false,
    });
    emitter.explode(count);
    this.time.delayedCall(600, () => emitter.destroy());
  }

  private handleKeyboardMovement(): void {
    if (!this.input.keyboard || this.isDragging) return;

    let vx = 0;
    let vy = 0;

    if (this.cursors.left.isDown || this.wasd.A.isDown) vx -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) vy += 1;

    if (vx !== 0 || vy !== 0) {
      this.player.moveByVector(vx, vy);
    } else if (!this.isDragging) {
      this.player.stopMove();
    }
  }

  private handleTouchMovement(): void {
    if (!this.isDragging || !this.touchTarget) {
      this.dragIndicator?.clear();
      return;
    }

    const tx = this.touchTarget.x;
    const ty = this.touchTarget.y;
    this.player.moveTowardTarget(tx, ty);

    this.dragIndicator?.clear();
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, tx, ty);
    if (dist > 20) {
      this.dragIndicator!.lineStyle(2, 0x00d4ff, 0.3);
      this.dragIndicator!.lineBetween(this.player.x, this.player.y, tx, ty);
      this.dragIndicator!.fillStyle(0x00d4ff, 0.5);
      this.dragIndicator!.fillCircle(tx, ty, 8);
      this.dragIndicator!.lineStyle(1, 0x00d4ff, 0.6);
      this.dragIndicator!.strokeCircle(tx, ty, 16);
    }
  }

  private handleShooting(time: number): void {
    const shouldFire = this.autoFire || this.spaceKey?.isDown || this.manualFireHeld;
    if (!shouldFire || !this.player.canFire(time)) return;

    this.player.consumeFire(time);
    playSfx('shoot');
    const { x, y } = this.player.getBulletSpawnPoint();
    const pattern = this.player.getFirePattern();

    for (const spawn of pattern) {
      const bullet = this.bullets.create(
        x + spawn.offsetX,
        y + spawn.offsetY,
        spawn.texture,
      ) as Phaser.Physics.Arcade.Sprite | null;
      if (!bullet) continue;

      bullet.setActive(true);
      bullet.setVisible(true);
      bullet.setDepth(8);
      const body = bullet.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      const isHeavy = spawn.texture === 'bullet-heavy';
      body.setSize(isHeavy ? 8 : 4, isHeavy ? 16 : 12);
      body.setOffset(isHeavy ? 1 : 2, isHeavy ? 2 : 2);
      bullet.setData('damage', spawn.damage);
      bullet.setData('pierce', spawn.pierce);
      bullet.setRotation(spawn.angle + Math.PI / 2);
      bullet.setVelocity(
        Math.cos(spawn.angle) * spawn.speed,
        Math.sin(spawn.angle) * spawn.speed,
      );
    }
  }

  private cleanupOffscreen(): void {
    this.bullets.children.each((child) => {
      const bullet = child as Phaser.Physics.Arcade.Sprite;
      if (bullet.y < -20) bullet.destroy();
      return true;
    });

    this.asteroids.children.each((child) => {
      const asteroid = child as Asteroid;
      if (asteroid.isOffScreen()) asteroid.destroy();
      return true;
    });

    this.hearts.children.each((child) => {
      const heart = child as Heart;
      if (heart.isOffScreen()) heart.destroy();
      return true;
    });

    this.powerStars.children.each((child) => {
      const star = child as PowerStar;
      if (star.isOffScreen()) star.destroy();
      return true;
    });

    this.enemyLasers.children.each((child) => {
      const laser = child as Phaser.Physics.Arcade.Sprite;
      if (isEnemyLaserOffScreen(laser)) laser.destroy();
      return true;
    });

    this.spiderShips.children.each((child) => {
      const spider = child as SpiderShip;
      if (spider.isOffScreen()) spider.destroy();
      return true;
    });

    this.seekerDrones.children.each((child) => {
      const seeker = child as SeekerDrone;
      if (seeker.isOffScreen()) seeker.destroy();
      return true;
    });

    this.kamikazeWasps.children.each((child) => {
      const wasp = child as KamikazeWasp;
      if (wasp.isOffScreen()) wasp.destroy();
      return true;
    });

    this.plasmaTurrets.children.each((child) => {
      const turret = child as PlasmaTurret;
      if (turret.isOffScreen()) turret.destroy();
      return true;
    });

    this.bossShips.children.each((child) => {
      const boss = child as BossShip;
      if (boss.isOffScreen()) {
        this.bossHealthRemaining = boss.health;
        boss.respawnFromTop();
        this.bossHealthBar.setHp(boss.health);
      }
      return true;
    });

    if (
      this.bossActive &&
      !this.bossDefeated &&
      this.activeBossDefinition &&
      this.bossShips.countActive(true) === 0
    ) {
      this.createBossInstance(
        this.activeBossDefinition,
        this.bossHealthRemaining,
        this.bossMaxHealth,
      );
    }

    this.lootBoxes.children.each((child) => {
      const box = child as LootBox;
      if (box.isOffScreen()) {
        box.destroy();
        this.pendingLootSpawns += 1;
        this.trySpawnLootBox();
      }
      return true;
    });
  }

  update(time: number, delta: number): void {
    if (this.isGameOver || this.isPaused || this.isChoosingWeapon) return;

    this.updateStarfield(delta);

    if (!this.isHitStunned) {
      this.handleKeyboardMovement();
      this.handleTouchMovement();
      this.handleShooting(time);
    }

    this.player.updateThruster(time, delta);
    if (!this.isHitStunned) {
      this.player.clampToBounds();
    }
    this.updateEnemies(time, delta);
    if (this.bossActive) {
      this.updateBoss(time);
    }
    this.updateStoryTimer(delta);
    this.cleanupOffscreen();

    this.spawnTimer += delta;
    const asteroidInterval = getEscalatedAsteroidSpawnInterval(this.spawnInterval, this.score);
    if (this.spawnTimer >= asteroidInterval) {
      this.spawnTimer = 0;
      this.spawnCount += 1;
      const spawnLarge = this.spawnCount % 4 === 0;
      this.spawnAsteroid(spawnLarge ? 'lg' : undefined);
    }

    this.difficultyTimer += delta;
    if (this.difficultyTimer >= 10000) {
      this.difficultyTimer = 0;
      this.spawnInterval = Math.max(600, this.spawnInterval - 80);
    }

    this.heartSpawnTimer += delta;
    const heartInterval = HEART_SPAWN_MS[getDifficultyTier(this.score)];
    if (this.heartSpawnTimer >= heartInterval) {
      this.heartSpawnTimer = 0;
      this.spawnHeart();
    }

    this.powerStarSpawnTimer += delta;
    if (this.powerStarSpawnTimer >= this.powerStarSpawnInterval) {
      this.powerStarSpawnTimer = 0;
      this.spawnPowerStar();
    }

    if (shouldSpawnSpiders(this.score)) {
      this.spiderSpawnTimer += delta;
      if (this.spiderSpawnTimer >= getSpiderSpawnMs(this.score)) {
        this.spiderSpawnTimer = 0;
        this.spawnSpiderShip();
      }
    } else {
      this.spiderSpawnTimer = 0;
    }

    this.enemySpawnTimer += delta;
    if (!this.bossActive) {
      const enemyInterval = getEnemySpawnInterval(this.score);
      if (this.enemySpawnTimer >= enemyInterval) {
        this.enemySpawnTimer = 0;
        const kind = pickEnemyToSpawn(this.score, this.getEnemyCounts());
        if (kind) this.spawnEnemy(kind);
      }
    }
  }
}
