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
import { StoryEnemy, storyEnemyNeedsFire } from '../entities/StoryEnemy';
import { BossShip } from '../entities/BossShip';
import { Wormhole } from '../entities/Wormhole';
import { WarpPanel } from '../entities/WarpPanel';
import { Comet } from '../entities/Comet';
import { getBossConfigForLevel, getBossSpawnMsForLevel } from '../levelConfig';
import { computeBossHealth, computeSurvivalBossHealth } from '../bossHealth';
import {
  getBossDefinition,
  getLevelMeta,
  getBackgroundTheme,
  getStoryEnemyDefinition,
  resolveWorldId,
  type BossDefinition,
} from '../levelResolver';
import {
  BOSS_SPECIAL_LASER_DAMAGE,
  isEnemyLaserOffScreen,
  LASER_DAMAGE,
  spawnEnemyLaser,
  type EnemyLaserOptions,
} from '../entities/EnemyLaser';
import { HealthBar, MAX_HP } from '../ui/HealthBar';
import { BossHealthBar } from '../ui/BossHealthBar';
import {
  getDifficultyTier,
  getEscalatedAsteroidSpawnInterval,
  getEscalationLevel,
  HEART_SPAWN_MS,
  type DifficultyTier,
} from '../difficulty';
import {
  getEnemySpawnInterval,
  pickEnemyToSpawn,
  type EnemyKind,
} from '../enemies';
import {
  canSpawnStoryEnemy,
  getStoryEnemySpawnInterval,
} from '../storyEnemySpawn';
import {
  getStoryEnemySpawnInterval as getSurvivalStoryEnemySpawnInterval,
  pickStoryEnemyToSpawn,
  scaleStoryEnemyDefinition,
  getSurvivalBossSpawnDelayMs,
  pickSurvivalBossLevel,
  computeSurvivalBossPoints,
} from '../survivalSpawn';
import { createMenuOverlay, createMenuButton } from '../ui/MenuButtons';
import {
  formatHighScoreLabel,
  goToLevelSelect,
  goToTitleScreen,
  restartGame,
  saveScoreAndGoToTitle,
  updateHighScore,
} from '../gameFlow';
import { addCoins, formatRunCoinsLabel } from '../coins';
import {
  GOLD_ASTEROID_SPAWN_CHANCE,
  MAX_GOLD_ASTEROIDS_ON_SCREEN,
  rollEnemyCoinDrop,
  COMET_SPAWN_CHANCE,
  GOLD_COMET_SPAWN_CHANCE,
  MAX_COMETS_ON_SCREEN,
} from '../coinDrops';
import { unlockLevel, isLevelUnlocked, getMaxLevelSlots } from '../storyProgress';
import {
  unlockWorld2Story,
  unlockSecretIss,
  completeSecretIss,
  unlockSecretDawn,
  completeSecretDawn,
  onLevel20Cleared,
} from '../worldProgress';
import { getSecretLevel, SECRET_LEVELS } from '../world1/secretLevels';
import { getWorldIdFromLevel } from '../gameMode';
import { getWorldNumber } from '../worlds';
import { applyStoryBackground } from '../ui/StoryThemeBackground';
import {
  applyAudioSettings,
  initAudio,
  pauseMusic,
  playExplosionSfx,
  playSfx,
  resumeMusic,
  setRocketEngineActive,
  startMusic,
  stopInvincibilityTheme,
  stopRocketEngineSfx,
} from '../audioManager';
import { normalizeGameSceneData, type GameMode } from '../gameMode';
import { getAutoFire } from '../settings';
import { createSettingsPanel } from '../ui/SettingsPanel';
import { createAlmanacPanel } from '../ui/AlmanacPanel';
import { LootBox } from '../entities/LootBox';
import { getNextLootMilestone, LOOT_MILESTONE_STEP, shouldSpawnLootAtScore } from '../loot';
import { rollWeaponChoices } from '../weapons';
import { createWeaponSelectPanel } from '../ui/WeaponSelectPanel';
import {
  FuelTankPickup,
  InvisibilityPickup,
  ShieldPickup,
} from '../entities/PowerUpPickup';
import {
  consumeInventoryItem,
  getInventoryCount,
  getPowerUpLevel,
  isDeathBombUnlocked,
  isPowerUpOwned,
} from '../playerPowerUps';
import { detonateDeathBomb } from '../deathBomb';
import {
  ENGINE_SCORE_CAP,
  getFuelTankScoreCap,
  getInvisibilityDurationMs,
  getShieldDurationMs,
  HYPERDRIVE_SCORE_CAP,
  POST_SCORE_BOOST_INVISIBILITY_MS,
  POST_SCORE_BOOST_MERCY_INVINCIBILITY_MS,
} from '../powerUpEffects';
import { BoostPointMeter } from '../ui/BoostPointMeter';
import { updateBoostVacuum, type BoostVacuumAbsorbPayload } from '../boostVacuum';

const STAR_BOOST_SPEED_MULTIPLIER = 2.75;
const SURVIVAL_INVENTORY_BOOST_WINDOW_MS = 5000;

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private asteroids!: Phaser.Physics.Arcade.Group;
  private bullets!: Phaser.Physics.Arcade.Group;
  private hearts!: Phaser.Physics.Arcade.Group;
  private powerStars!: Phaser.Physics.Arcade.Group;
  private shieldPickups!: Phaser.Physics.Arcade.Group;
  private invisibilityPickups!: Phaser.Physics.Arcade.Group;
  private fuelTankPickups!: Phaser.Physics.Arcade.Group;
  private spiderShips!: Phaser.Physics.Arcade.Group;
  private seekerDrones!: Phaser.Physics.Arcade.Group;
  private kamikazeWasps!: Phaser.Physics.Arcade.Group;
  private plasmaTurrets!: Phaser.Physics.Arcade.Group;
  private storyEnemies!: Phaser.Physics.Arcade.Group;
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
  private runCoins = 0;
  private coinText!: Phaser.GameObjects.Text;
  private hp = MAX_HP;
  private healthBar!: HealthBar;
  private bossHealthBar!: BossHealthBar;
  private isGameOver = false;
  private isPlayerDying = false;
  private gameOverScreenShown = false;
  private isPaused = false;
  private pauseMenu?: Phaser.GameObjects.Container;
  private settingsPanel?: Phaser.GameObjects.Container;
  private almanacPanelCleanup?: () => void;
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
  private enemySpawnTimer = 0;
  private storyEnemySpawnTimer = 0;
  private isHitStunned = false;
  private isChoosingWeapon = false;
  private weaponSelectPanel?: Phaser.GameObjects.Container;
  private weaponHudText?: Phaser.GameObjects.Text;
  private nextLootMilestone = LOOT_MILESTONE_STEP;
  private lastClaimedLootMilestone = 0;
  private pendingLootSpawns = 0;
  private gameMode: GameMode = 'survival';
  private storyLevel = 1;
  private worldId = 'world1';
  private secretId?: string;
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
  private survivalBossesDefeated = 0;
  private survivalBossCooldownTimer = 0;
  private lastDefeatedBossX = 0;
  private lastDefeatedBossY = 0;
  private wormholes!: Phaser.Physics.Arcade.Group;
  private warpPanels!: Phaser.Physics.Arcade.Group;
  private comets!: Phaser.Physics.Arcade.Group;
  private wormholeSpawned = false;
  private pendingSecretId?: string;
  private warpPanelSpawned = false;
  private cometSpawnTimer = 0;
  private shieldSpawnTimer = 0;
  private invisibilitySpawnTimer = 0;
  private fuelTankSpawnTimer = 0;
  private engineHudBtn?: Phaser.GameObjects.Container;
  private hyperdriveHudBtn?: Phaser.GameObjects.Container;
  private engineKey?: Phaser.Input.Keyboard.Key;
  private hyperdriveKey?: Phaser.Input.Keyboard.Key;

  private touchTarget: Phaser.Math.Vector2 | null = null;
  private isDragging = false;
  private dragIndicator?: Phaser.GameObjects.Graphics;
  private autoFire = false;
  private manualFireHeld = false;
  private fireButton?: Phaser.GameObjects.Text;
  private moveHint?: Phaser.GameObjects.Text;
  private stars: Phaser.GameObjects.Image[] = [];
  private starSpeeds: number[] = [];
  private starSpeedBoostMultiplier = 1;
  private boostPointMeter!: BoostPointMeter;
  private inventoryBoostWindowClosed = false;
  private deathBombArmed = false;
  private deathBombHudBtn?: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { mode?: GameMode; level?: number; worldId?: string; secretId?: string }): void {
    const normalized = normalizeGameSceneData(data);
    this.gameMode = normalized.mode;
    this.storyLevel = normalized.level;
    this.worldId = resolveWorldId(normalized.worldId, normalized.level, normalized.secretId);
    this.secretId = normalized.secretId;
  }

  create(): void {
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.isGameOver = false;
    this.isPlayerDying = false;
    this.gameOverScreenShown = false;
    this.isPaused = false;
    this.pauseMenu?.destroy();
    this.pauseMenu = undefined;
    this.settingsPanel?.destroy();
    this.settingsPanel = undefined;
    this.destroyAlmanacPanel();
    this.score = 0;
    this.runCoins = 0;
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
    this.enemySpawnTimer = 0;
    this.storyEnemySpawnTimer = 0;
    this.survivalBossesDefeated = 0;
    this.survivalBossCooldownTimer = 0;
    this.wormholeSpawned = false;
    this.pendingSecretId = undefined;
    this.warpPanelSpawned = false;
    this.cometSpawnTimer = 0;
    this.shieldSpawnTimer = 0;
    this.invisibilitySpawnTimer = 0;
    this.fuelTankSpawnTimer = 0;
    this.engineHudBtn?.destroy();
    this.engineHudBtn = undefined;
    this.hyperdriveHudBtn?.destroy();
    this.hyperdriveHudBtn = undefined;
    this.inventoryBoostWindowClosed = false;
    this.deathBombArmed = false;
    this.deathBombHudBtn?.destroy();
    this.deathBombHudBtn = undefined;
    this.starSpeedBoostMultiplier = 1;
    this.boostPointMeter?.destroy();

    this.createStarfield();
    if (this.gameMode === 'story') {
      const levelMeta = getLevelMeta(this.worldId, this.storyLevel, this.secretId);
      const theme = getBackgroundTheme(this.worldId, levelMeta.themeId);
      applyStoryBackground(this, GAME_WIDTH, GAME_HEIGHT, theme);
    } else if (this.worldId === 'world2') {
      const theme = getBackgroundTheme('world2', 'jupiter');
      applyStoryBackground(this, GAME_WIDTH, GAME_HEIGHT, theme);
    }
    this.createGroups();
    this.createPlayer();
    this.createUI();
    this.setupInput();
    this.setupCollisions();

    initAudio();
    startMusic();
    stopRocketEngineSfx();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      stopRocketEngineSfx();
      stopInvincibilityTheme();
    });

    this.spawnAsteroid('lg');
    for (let i = 0; i < 4; i++) {
      this.time.delayedCall(100 + i * 400, () => this.spawnAsteroid());
    }
  }

  private createStarfield(): void {
    this.stars = [];
    this.starSpeeds = [];

    const starTint = this.gameMode === 'story'
      ? getBackgroundTheme(this.worldId, getLevelMeta(this.worldId, this.storyLevel, this.secretId).themeId).starColor
      : this.worldId === 'world2'
        ? getBackgroundTheme('world2', 'jupiter').starColor
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
    const speedMult = this.starSpeedBoostMultiplier;
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      star.y += this.starSpeeds[i] * speedMult * dt;
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
    this.shieldPickups = this.physics.add.group();
    this.invisibilityPickups = this.physics.add.group();
    this.fuelTankPickups = this.physics.add.group();
    this.spiderShips = this.physics.add.group();
    this.seekerDrones = this.physics.add.group();
    this.kamikazeWasps = this.physics.add.group();
    this.plasmaTurrets = this.physics.add.group();
    this.storyEnemies = this.physics.add.group();
    this.enemyLasers = this.physics.add.group();
    this.lootBoxes = this.physics.add.group();
    this.bossShips = this.physics.add.group();
    this.wormholes = this.physics.add.group();
    this.warpPanels = this.physics.add.group();
    this.comets = this.physics.add.group();
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

    const coinY = this.gameMode === 'story' ? 44 : 36;
    this.coinText = this.add.text(16, coinY, formatRunCoinsLabel(0), {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '12px',
      color: '#ffcc00',
    }).setScrollFactor(0).setDepth(hudTextDepth);

    if (this.gameMode === 'story') {
      const levelMeta = getLevelMeta(this.worldId, this.storyLevel, this.secretId);
      const theme = getBackgroundTheme(this.worldId, levelMeta.themeId);

      this.timeText = this.add.text(16, 32, 'TIME 0:00', {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '11px',
        color: '#8899bb',
      }).setScrollFactor(0).setDepth(hudTextDepth);

      const locationLabel = this.secretId
        ? 'ISS'
        : levelMeta.location.toUpperCase();

      this.add.text(GAME_WIDTH - 16, 12, locationLabel, {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '10px',
        fontStyle: '700',
        color: `#${theme.accentColor.toString(16).padStart(6, '0')}`,
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(hudTextDepth);
    } else if (this.worldId === 'world2') {
      this.add.text(GAME_WIDTH - 16, 12, 'WORLD 2 SURVIVAL', {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '10px',
        fontStyle: '700',
        color: '#ddaa55',
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(hudTextDepth);
    }

    this.healthBar = new HealthBar(this, GAME_WIDTH / 2, 58);
    this.boostPointMeter = new BoostPointMeter(this, GAME_WIDTH / 2, 78);
    this.bossHealthBar = new BossHealthBar(this, 96);
    this.weaponHudText = this.add.text(GAME_WIDTH / 2, 112, '', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '9px',
      color: '#556677',
      align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(hudTextDepth);
    this.createPauseButton();
    this.updateFireModeUI();
    this.createSurvivalPowerUpHud();
    this.createDeathBombHud();
    if (this.gameMode === 'survival') {
      this.time.delayedCall(SURVIVAL_INVENTORY_BOOST_WINDOW_MS, () => {
        this.inventoryBoostWindowClosed = true;
        this.engineHudBtn?.setVisible(false);
        this.hyperdriveHudBtn?.setVisible(false);
      });
    }

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
    btn.on('pointerup', () => {
      playSfx('ui');
      this.togglePause();
    });
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

      this.engineKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
      this.hyperdriveKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H);
      this.engineKey.on('down', () => this.tryActivateEngine());
      this.hyperdriveKey.on('down', () => this.tryActivateHyperdrive());
    }

    this.dragIndicator = this.add.graphics().setDepth(50).setScrollFactor(0);

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isGameOver || this.isPaused || this.isChoosingWeapon) return;
      this.isDragging = true;
      this.touchTarget = new Phaser.Math.Vector2(pointer.x, pointer.y);
      if (!this.isHitStunned) {
        this.player.moveTowardTarget(pointer.x, pointer.y);
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging || this.isGameOver || this.isPaused || this.isChoosingWeapon) return;
      this.touchTarget = new Phaser.Math.Vector2(pointer.x, pointer.y);
      if (!this.isHitStunned) {
        this.player.moveTowardTarget(pointer.x, pointer.y);
      }
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
      this.touchTarget = null;
      this.player.stopMove();
      stopRocketEngineSfx();
      this.dragIndicator?.clear();
    });

    this.input.on('pointerupoutside', () => {
      this.isDragging = false;
      this.touchTarget = null;
      this.player.stopMove();
      stopRocketEngineSfx();
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
      this.player,
      this.shieldPickups,
      this.onPlayerCollectShield as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.player,
      this.invisibilityPickups,
      this.onPlayerCollectInvisibility as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.player,
      this.fuelTankPickups,
      this.onPlayerCollectFuelTank as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
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
      this.storyEnemies,
      this.onBulletHitStoryEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
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
      this.storyEnemies,
      this.onPlayerHitStoryEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
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

    this.physics.add.overlap(
      this.bullets,
      this.comets,
      this.onBulletHitComet as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.player,
      this.comets,
      this.onPlayerHitComet as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.player,
      this.wormholes,
      this.onPlayerEnterWormhole as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.player,
      this.warpPanels,
      this.onPlayerEnterWarpPanel as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
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

    const explosionCount = asteroid.size === 'lg' ? 12 : asteroid.size === 'md' ? 8 : 5;
    const { x, y, points, coinReward } = asteroid;

    if (asteroid.takeDamage(damage)) {
      this.finalizeAsteroidRewards(x, y, points, coinReward, explosionCount);
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

  private onBulletHitStoryEnemy(
    bulletObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    this.applyBulletToScoredEnemy(
      bulletObj as Phaser.Physics.Arcade.Sprite,
      enemyObj as StoryEnemy,
      8,
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
      const { x, y } = boss;
      this.bossHealthBar.hide();
      this.addScore(boss.points);
      this.spawnBigExplosion(x, y);
      this.lastDefeatedBossX = x;
      this.lastDefeatedBossY = y;
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
      this.tryAwardEnemyCoins(enemy.x, enemy.y);
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
    if (this.player.isGhostMode()) return;
    const laser = laserObj as Phaser.Physics.Arcade.Sprite;
    const fromX = laser.x;
    const fromY = laser.y;
    const damage = (laser.getData('damage') as number) ?? LASER_DAMAGE;
    laser.destroy();
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

  private onPlayerHitStoryEnemy(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    enemyObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    const enemy = enemyObj as StoryEnemy;
    this.handleEnemyRam(enemy, enemy.bodyDamage, 8);
  }

  private onPlayerHitBoss(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    bossObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    if (this.isGameOver || this.isPaused || this.isChoosingWeapon) return;
    if (this.player.isGhostMode() || this.player.isBoosting() || this.player.isInvincible()) return;

    const boss = bossObj as BossShip;
    if (this.player.absorbHit()) return;

    this.takeDamage(boss.bodyDamage);
  }

  private handleEnemyRam(
    enemy: Phaser.Physics.Arcade.Sprite & { points: number },
    bodyDamage: number,
    explosionCount: number,
  ): void {
    if (this.isGameOver || this.isPaused || this.isChoosingWeapon) return;
    if (this.player.isGhostMode()) return;

    const { x, y } = enemy;

    if (this.player.isInvincible() || this.player.isBoosting()) {
      enemy.destroy();
      if (this.player.isBoosting()) {
        this.addBoostScore(enemy.points);
      } else {
        this.addScore(enemy.points);
      }
      this.spawnExplosion(x, y, explosionCount);
      this.tryAwardEnemyCoins(x, y);
      return;
    }

    enemy.destroy();
    this.spawnExplosion(x, y, explosionCount);
    this.tryAwardEnemyCoins(x, y);
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
    stopRocketEngineSfx();
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
        onClick: () => {
          this.bankRunCoins();
          restartGame(this, this.score, this.gameMode, this.storyLevel, this.worldId, this.secretId);
        },
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
      { label: 'ALMANAC', y: 0, color: 0x8899bb, onClick: () => this.showAlmanacFromPause() },
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

  private showAlmanacFromPause(): void {
    this.pauseMenu?.setVisible(false);

    const panel = createAlmanacPanel(this, 260, {
      onBack: () => {
        this.destroyAlmanacPanel();
        this.pauseMenu?.setVisible(true);
      },
    });
    this.almanacPanelCleanup = panel.destroy;
  }

  private destroyAlmanacPanel(): void {
    this.almanacPanelCleanup?.();
    this.almanacPanelCleanup = undefined;
  }

  private resumeGame(): void {
    if (!this.isPaused) return;

    this.isPaused = false;
    this.pauseMenu?.destroy();
    this.pauseMenu = undefined;
    this.settingsPanel?.destroy();
    this.settingsPanel = undefined;
    this.destroyAlmanacPanel();
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
    this.destroyAlmanacPanel();
    this.bankRunCoins();
    saveScoreAndGoToTitle(this, this.score, this.gameMode);
  }

  private quitToLevelSelect(): void {
    this.isPaused = false;
    this.pauseMenu?.destroy();
    this.pauseMenu = undefined;
    this.settingsPanel?.destroy();
    this.settingsPanel = undefined;
    this.destroyAlmanacPanel();
    this.bankRunCoins();
    goToLevelSelect(this);
  }

  private onPlayerHitAsteroid(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    asteroidObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    if (this.isGameOver || this.isPaused) return;
    if (this.player.isGhostMode()) return;
    const asteroid = asteroidObj as Asteroid;
    const explosionCount = asteroid.size === 'lg' ? 12 : asteroid.size === 'md' ? 8 : 5;

    if (asteroid.isGold) {
      const { x, y, points, coinReward, size } = asteroid;
      asteroid.destroy();
      if (this.player.isBoosting()) {
        this.addBoostScore(points);
      } else {
        this.addScore(points);
      }
      this.awardCoins(coinReward, x, y);
      this.spawnExplosion(x, y, explosionCount);

      if (!this.player.isDamageImmune()) {
        this.takeDamage(ASTEROID_DAMAGE[size]);
      }
      return;
    }

    if (this.player.isInvincible() || this.player.isBoosting()) {
      asteroid.destroy();
      if (this.player.isBoosting()) {
        this.addBoostScore(asteroid.points);
      } else {
        this.addScore(asteroid.points);
      }
      this.spawnExplosion(asteroid.x, asteroid.y, explosionCount);
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
    }

    const newEscalation = getEscalationLevel(this.score);
    if (newEscalation !== this.escalationLevel) {
      this.escalationLevel = newEscalation;
      this.spawnTimer = 0;
      this.enemySpawnTimer = 0;
    }

    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 100,
      yoyo: true,
    });

    this.checkLootMilestones();
    this.checkSecretMilestones();
  }

  private addBoostScore(points: number): void {
    if (!this.player.isBoosting() || points <= 0) {
      this.addScore(points);
      return;
    }

    const remaining = this.player.getBoostScoreCap() - this.player.getBoostPointsEarned();
    if (remaining <= 0) return;

    const awarded = Math.min(points, remaining);
    this.addScore(awarded);
    this.player.addBoostPoints(awarded);
    if (this.player.isBoosting()) {
      this.boostPointMeter.update(this.player.getBoostPointsEarned(), this.player.getBoostScoreCap());
    }
  }

  private startScoreBoost(scoreCap: number, flashDuration = 120, flashRgb = { r: 255, g: 204, b: 0 }): void {
    this.starSpeedBoostMultiplier = STAR_BOOST_SPEED_MULTIPLIER;
    this.player.activateBoostMode({
      scoreCap,
      onEnd: () => this.endScoreBoost(),
    });
    this.boostPointMeter.show(scoreCap);
    this.cameras.main.flash(flashDuration, flashRgb.r, flashRgb.g, flashRgb.b, false);
  }

  private endScoreBoost(): void {
    this.starSpeedBoostMultiplier = 1;
    this.boostPointMeter.hide();
    this.applyPostScoreBoostInvisibility();
  }

  private applyPostScoreBoostInvisibility(): void {
    if (this.isGameOver || this.isPaused) return;
    this.player.grantMercyInvincibility(POST_SCORE_BOOST_MERCY_INVINCIBILITY_MS);
    this.player.activateInvisibility(POST_SCORE_BOOST_INVISIBILITY_MS);
  }

  private onBoostVacuumAbsorb(payload: BoostVacuumAbsorbPayload): void {
    this.addBoostScore(payload.points);
    if (payload.coinReward != null && payload.coinReward > 0) {
      this.awardCoins(payload.coinReward, payload.x, payload.y);
    }
    this.spawnExplosion(payload.x, payload.y, payload.explosionCount);
    this.tryAwardEnemyCoins(payload.x, payload.y);
  }

  private checkSecretMilestones(): void {
    if (this.isGameOver || this.isPaused) return;

    if (this.gameMode === 'story' && !this.secretId && this.worldId === 'world1') {
      for (const secret of Object.values(SECRET_LEVELS)) {
        if (
          this.storyLevel === secret.entryLevel
          && this.score >= secret.scoreThreshold
          && !this.wormholeSpawned
        ) {
          this.wormholeSpawned = true;
          this.pendingSecretId = secret.id;
          this.spawnWormhole();
          break;
        }
      }
    }

    if (this.gameMode === 'story' && this.secretId) {
      const secret = getSecretLevel(this.secretId);
      if (secret && this.score >= secret.scoreThreshold && !this.warpPanelSpawned) {
        this.warpPanelSpawned = true;
        this.spawnWarpPanel();
      }
    }
  }

  private spawnWormhole(): void {
    const { x, y } = Wormhole.randomSpawnPosition();
    const wormhole = new Wormhole(this, x, y);
    this.wormholes.add(wormhole);

    const hint = this.add.text(GAME_WIDTH / 2, 90, 'WORMHOLE DETECTED', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '14px',
      fontStyle: '700',
      color: '#aa66ff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(150);

    this.tweens.add({
      targets: hint,
      alpha: 0,
      duration: 2500,
      onComplete: () => hint.destroy(),
    });
  }

  private spawnWarpPanel(): void {
    const { x, y } = WarpPanel.randomSpawnPosition();
    const panel = new WarpPanel(this, x, y);
    this.warpPanels.add(panel);

    const hint = this.add.text(GAME_WIDTH / 2, 90, 'WARP PANEL ONLINE', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '14px',
      fontStyle: '700',
      color: '#00d4ff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(150);

    this.tweens.add({
      targets: hint,
      alpha: 0,
      duration: 2500,
      onComplete: () => hint.destroy(),
    });
  }

  private onPlayerEnterWormhole(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    wormholeObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    if (this.isGameOver || this.isPaused || this.secretId) return;
    const secretId = this.pendingSecretId;
    if (!secretId) return;

    const wormhole = wormholeObj as Wormhole;
    wormhole.destroy();

    if (secretId === 'iss') unlockSecretIss();
    else if (secretId === 'dawn') unlockSecretDawn();

    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene', { mode: 'story', secretId, worldId: 'world1', level: 1 });
    });
  }

  private onPlayerEnterWarpPanel(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    panelObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    if (this.isGameOver || this.isPaused || !this.secretId) return;
    const panel = panelObj as WarpPanel;
    panel.destroy();
    this.triggerSecretVictory();
  }

  private triggerSecretVictory(): void {
    if (this.secretId === 'iss') {
      completeSecretIss();
    } else if (this.secretId === 'dawn') {
      completeSecretDawn();
    }
    this.triggerVictory(true);
  }

  private onBulletHitComet(
    bulletObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    cometObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    const bullet = bulletObj as Phaser.Physics.Arcade.Sprite;
    const comet = cometObj as Comet;
    const { x, y, points, coinReward } = comet;
    comet.destroy();
    this.finalizeAsteroidRewards(x, y, points, coinReward, 8);
    this.consumeBulletHit(bullet);
  }

  private onPlayerHitComet(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    cometObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    if (this.isGameOver || this.isPaused) return;
    if (this.player.isGhostMode() || this.player.isBoosting() || this.player.isInvincible()) return;
    const comet = cometObj as Comet;
    comet.destroy();
    this.takeDamage(comet.bodyDamage);
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
    stopRocketEngineSfx();
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
    if (this.player.isGhostMode() || this.isHitStunned) return;
    if (this.player.absorbHit()) return;

    this.hp = Math.max(0, this.hp - amount);
    this.healthBar.setHp(this.hp);
    this.cameras.main.shake(200, 0.005);
    this.cameras.main.flash(100, 255, 80, 80);

    const angle = Phaser.Math.Angle.Between(fromX, fromY, this.player.x, this.player.y);
    this.player.setVelocity(Math.cos(angle) * 120, Math.sin(angle) * 120);
    this.player.stopMove();

    if (this.hp <= 0) {
      this.triggerPlayerDeath();
      return;
    }

    this.isHitStunned = true;
    this.time.delayedCall(500, () => {
      this.isHitStunned = false;
      this.player.setVelocity(0, 0);
    });
  }

  private takeDamage(amount: number): void {
    if (this.player.absorbHit()) return;

    this.hp = Math.max(0, this.hp - amount);
    this.healthBar.setHp(this.hp);
    this.cameras.main.shake(200, 0.01);
    this.cameras.main.flash(150, 255, 50, 50);

    if (this.hp <= 0) {
      this.triggerPlayerDeath();
      return;
    }

    this.spawnExplosion(this.player.x, this.player.y, 20);

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

  private triggerPlayerDeath(): void {
    if (this.isPlayerDying) return;
    this.isPlayerDying = true;
    this.isGameOver = true;
    this.isPaused = false;
    this.isChoosingWeapon = false;
    this.pauseMenu?.destroy();
    this.pauseMenu = undefined;
    this.weaponSelectPanel?.destroy();
    this.weaponSelectPanel = undefined;

    const deathX = this.player.x;
    const deathY = this.player.y;

    if (this.deathBombArmed && getInventoryCount('deathBomb') > 0) {
      if (consumeInventoryItem('deathBomb')) {
        this.detonateDeathBombAt(deathX, deathY);
      }
      this.deathBombArmed = false;
    }

    this.physics.pause();
    this.player.hideForDeath();
    stopRocketEngineSfx();
    this.spawnBigExplosion(deathX, deathY);
    this.cameras.main.shake(400, 0.025);
    this.cameras.main.flash(250, 255, 120, 60);

    this.time.delayedCall(850, () => this.triggerGameOver());
  }

  private triggerGameOver(): void {
    if (this.gameOverScreenShown) return;
    this.gameOverScreenShown = true;
    this.isGameOver = true;
    this.isPaused = false;
    this.isChoosingWeapon = false;
    this.pauseMenu?.destroy();
    this.pauseMenu = undefined;
    this.weaponSelectPanel?.destroy();
    this.weaponSelectPanel = undefined;

    if (this.gameMode === 'survival') {
      updateHighScore(this.score, this.worldId);
    }

    const bankedCoins = this.bankRunCoins();

    this.physics.pause();
    this.player.stopMove();

    const buttons = [
      {
        label: 'RESTART',
        y: 0,
        onClick: () => {
          this.bankRunCoins();
          restartGame(this, this.score, this.gameMode, this.storyLevel, this.worldId, this.secretId);
        },
      },
      {
        label: 'QUIT',
        y: 0,
        color: 0xff4466,
        onClick: () => {
          this.bankRunCoins();
          goToTitleScreen(this);
        },
      },
    ];

    createMenuOverlay(this, 'GAME OVER', buttons, 200, GAME_HEIGHT / 2 + 40);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 85, `Score: ${this.score}`, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '18px',
      color: '#8899bb',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    if (bankedCoins > 0) {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 58, `+${bankedCoins} COINS SAVED`, {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '14px',
        color: '#ffcc00',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    } else if (this.gameMode === 'survival') {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 58, formatHighScoreLabel(this.worldId), {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '14px',
        color: '#00d4ff',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
    }
  }

  private onBossDefeated(): void {
    if (this.gameMode === 'story') {
      if (this.bossDefeated) return;

      this.bossDefeated = true;
      this.bossActive = false;
      this.activeBossDefinition = null;
      this.bossChargeRing?.destroy();
      this.bossChargeRing = undefined;
      this.bossSkillText?.destroy();
      this.bossSkillText = undefined;
      this.bossHealthBar.hide();
      this.triggerVictory();
      return;
    }

    this.onSurvivalBossDefeated();
  }

  private onSurvivalBossDefeated(): void {
    this.bossActive = false;
    this.activeBossDefinition = null;
    this.bossChargeRing?.destroy();
    this.bossChargeRing = undefined;
    this.bossSkillText?.destroy();
    this.bossSkillText = undefined;
    this.bossHealthBar.hide();

    this.awardCoins(this.lastBossCoinReward, this.lastDefeatedBossX, this.lastDefeatedBossY);
    this.survivalBossesDefeated += 1;
    this.survivalBossCooldownTimer = 0;
  }

  private triggerVictory(isSecretClear = false): void {
    this.isGameOver = true;
    this.isPaused = false;
    this.isChoosingWeapon = false;
    this.pauseMenu?.destroy();
    this.pauseMenu = undefined;
    this.weaponSelectPanel?.destroy();
    this.weaponSelectPanel = undefined;
    this.physics.pause();
    this.player.stopMove();

    if (!isSecretClear) {
      this.awardCoins(this.lastBossCoinReward);
    }
    const bankedCoins = this.bankRunCoins();

    if (this.storyLevel === 10 && !this.secretId) {
      unlockWorld2Story();
    }

    if (this.storyLevel === 20 && !this.secretId) {
      onLevel20Cleared();
    }

    if (isSecretClear && this.secretId === 'iss') {
      unlockLevel(11);
    }

    const nextLevel = this.secretId ? null : this.storyLevel + 1;
    if (nextLevel !== null && nextLevel <= getMaxLevelSlots()) {
      unlockLevel(nextLevel);
    }

    this.cameras.main.flash(300, 255, 204, 0, false);

    const root = this.add.container(0, 0).setDepth(270).setScrollFactor(0);
    this.victoryMenu = root;

    root.add(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8));

    const levelMeta = getLevelMeta(this.worldId, this.storyLevel, this.secretId);
    let victoryTitle: string;
    if (isSecretClear && this.secretId === 'iss') {
      victoryTitle = 'ISS CLEAR!';
    } else if (isSecretClear && this.secretId === 'dawn') {
      victoryTitle = 'DAWN CLEAR!';
    } else if (this.storyLevel === getMaxLevelSlots()) {
      victoryTitle = 'STORY COMPLETE!';
    } else {
      victoryTitle = `${levelMeta.location.toUpperCase()} CLEAR!`;
    }

    root.add(this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120, victoryTitle, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '32px',
      fontStyle: '900',
      color: '#00d4ff',
    }).setOrigin(0.5));

    if (bankedCoins > 0) {
      root.add(this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 70, `+${bankedCoins} COINS SAVED`, {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '18px',
        color: '#ffcc00',
      }).setOrigin(0.5));
    }

    let buttonY = GAME_HEIGHT / 2 - 10;

    if (nextLevel !== null && nextLevel <= getMaxLevelSlots() && isLevelUnlocked(nextLevel)) {
      const { container: continueBtn } = createMenuButton(this, {
        label: `CONTINUE TO LEVEL ${nextLevel}`,
        y: buttonY,
        color: 0x00d4ff,
        onClick: () => {
          this.cameras.main.fadeOut(300, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('GameScene', {
              mode: 'story',
              level: nextLevel,
              worldId: getWorldIdFromLevel(nextLevel),
            });
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
      onClick: () => {
        this.bankRunCoins();
        goToLevelSelect(this, isSecretClear || this.secretId ? 'world1' : this.worldId);
      },
    });
    selectBtn.setX(GAME_WIDTH / 2);
    root.add(selectBtn);
  }

  private createBossInstance(
    definition: BossDefinition,
    health?: number,
    maxHealth?: number,
    pointsOverride?: number,
  ): BossShip {
    const boss = new BossShip(
      this,
      GAME_WIDTH / 2,
      100,
      definition,
      (lx, ly, angle) => this.fireEnemyLaser(lx, ly, angle),
      () => this.fireBossSpecial(boss),
      health,
      maxHealth,
      pointsOverride,
    );
    this.bossShips.add(boss);
    this.bossHealthRemaining = boss.health;
    this.bossHealthBar.show(boss.maxHealth, boss.health, definition.bossName);
    return boss;
  }

  private spawnBoss(): void {
    if (this.secretId || this.bossSpawned || this.bossDefeated || this.bossShips.countActive(true) > 0) return;

    const levelConfig = getBossConfigForLevel(this.storyLevel);
    const definition = getBossDefinition(this.worldId, this.storyLevel);
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

  private spawnSurvivalBoss(): void {
    if (this.bossActive || this.bossShips.countActive(true) > 0) return;

    const level = pickSurvivalBossLevel(this.score, this.survivalBossesDefeated, this.worldId);
    if (level === null) return;

    const levelConfig = getBossConfigForLevel(level);
    const definition = getBossDefinition(this.worldId, level);
    const scaledHealth = computeSurvivalBossHealth(
      definition.baseHealth,
      this.player.getPowerScore(),
      this.score,
    );
    const scaledPoints = computeSurvivalBossPoints(definition.points, this.score);

    this.activeBossDefinition = definition;
    this.bossMaxHealth = scaledHealth;
    this.lastBossCoinReward = levelConfig.coinReward;
    this.bossActive = true;

    this.createBossInstance(definition, scaledHealth, scaledHealth, scaledPoints);

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

  private updateSurvivalBossSpawn(delta: number): void {
    if (this.gameMode !== 'survival' || this.bossActive || this.bossShips.countActive(true) > 0) {
      return;
    }

    if (pickSurvivalBossLevel(this.score, this.survivalBossesDefeated, this.worldId) === null) {
      return;
    }

    this.survivalBossCooldownTimer += delta;
    const delay = getSurvivalBossSpawnDelayMs(this.score, this.survivalBossesDefeated);
    if (this.survivalBossCooldownTimer >= delay) {
      this.spawnSurvivalBoss();
    }
  }

  private fireBossSpecial(boss: BossShip): void {
    const special = boss.definition.special;
    const tx = this.player.x;
    const ty = this.player.y;
    const baseAngle = Phaser.Math.Angle.Between(boss.x, boss.y, tx, ty);
    const specialOpts: EnemyLaserOptions = {
      damage: BOSS_SPECIAL_LASER_DAMAGE,
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
    const accentColor = this.activeBossDefinition
      ? getBackgroundTheme(this.worldId, this.activeBossDefinition.themeId).accentColor
      : 0xff2244;
    this.bossChargeRing.lineStyle(3, accentColor, 0.85);
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
    if (this.gameMode !== 'story' || this.secretId) return;

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

    if (
      this.countGoldAsteroidsOnScreen() < MAX_GOLD_ASTEROIDS_ON_SCREEN &&
      Math.random() < GOLD_ASTEROID_SPAWN_CHANCE
    ) {
      config.variant = 'gold';
    }

    const asteroid = new Asteroid(this, config);
    this.asteroids.add(asteroid);
    asteroid.setVelocity(config.velocityX, config.velocityY);
  }

  private countGoldAsteroidsOnScreen(): number {
    let count = 0;
    this.asteroids.children.each((child) => {
      if ((child as Asteroid).isGold) count += 1;
      return true;
    });
    return count;
  }

  private showCoinPickup(x: number, y: number, amount: number): void {
    const text = this.add.text(x, y, `+${amount} COINS`, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '12px',
      fontStyle: '700',
      color: '#ffcc00',
    }).setOrigin(0.5).setDepth(120);

    this.tweens.add({
      targets: text,
      y: y - 36,
      alpha: 0,
      duration: 900,
      onComplete: () => text.destroy(),
    });
  }

  private awardCoins(amount: number, x?: number, y?: number): void {
    if (amount <= 0) return;
    this.runCoins += amount;
    this.updateCoinHud(true);
    if (x !== undefined && y !== undefined) {
      this.showCoinPickup(x, y, amount);
    }
  }

  private updateCoinHud(animate = false): void {
    this.coinText.setText(formatRunCoinsLabel(this.runCoins));
    if (animate) {
      this.tweens.add({
        targets: this.coinText,
        scaleX: 1.12,
        scaleY: 1.12,
        duration: 100,
        yoyo: true,
      });
    }
  }

  private bankRunCoins(): number {
    const amount = this.runCoins;
    if (amount > 0) {
      addCoins(amount);
    }
    this.runCoins = 0;
    this.updateCoinHud();
    return amount;
  }

  private finalizeAsteroidRewards(
    x: number,
    y: number,
    points: number,
    coinReward: number,
    explosionCount: number,
  ): void {
    this.addScore(points);
    if (coinReward > 0) {
      this.awardCoins(coinReward, x, y);
    }
    this.spawnExplosion(x, y, explosionCount);
  }

  private tryAwardEnemyCoins(x: number, y: number): void {
    const reward = rollEnemyCoinDrop();
    if (reward !== null) {
      this.awardCoins(reward, x, y);
    }
  }

  private spawnHeart(): void {
    if (this.isGameOver || this.isPaused) return;
    if (this.hearts.countActive(true) >= this.maxHeartsOnScreen) return;

    const { x, y } = Heart.randomSpawnPosition();
    const heart = new Heart(this, x, y);
    this.hearts.add(heart);
    heart.setVelocity(
      Phaser.Math.Between(-18, 18),
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
      Phaser.Math.Between(-18, 18),
      Phaser.Math.Between(20, 45),
    );
  }

  private spawnShieldPickup(): void {
    if (this.isGameOver || this.isPaused || !isPowerUpOwned('shield')) return;
    if (this.shieldPickups.countActive(true) >= 1) return;

    const { x, y } = ShieldPickup.randomSpawnPosition();
    const pickup = new ShieldPickup(this, x, y);
    this.shieldPickups.add(pickup);
  }

  private spawnInvisibilityPickup(): void {
    if (this.isGameOver || this.isPaused || !isPowerUpOwned('invisibility')) return;
    if (this.invisibilityPickups.countActive(true) >= 1) return;

    const { x, y } = InvisibilityPickup.randomSpawnPosition();
    const pickup = new InvisibilityPickup(this, x, y);
    this.invisibilityPickups.add(pickup);
  }

  private spawnFuelTankPickup(): void {
    if (this.isGameOver || this.isPaused || this.gameMode !== 'survival') return;
    if (!isPowerUpOwned('fuelTank')) return;
    if (this.fuelTankPickups.countActive(true) >= 1) return;

    const { x, y } = FuelTankPickup.randomSpawnPosition();
    const pickup = new FuelTankPickup(this, x, y);
    this.fuelTankPickups.add(pickup);
  }

  private onPlayerCollectShield(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    pickupObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    if (this.isGameOver || this.isPaused) return;
    (pickupObj as ShieldPickup).destroy();
    const level = getPowerUpLevel('shield');
    this.player.activateShield(getShieldDurationMs(level));
    this.spawnPowerStarCollectEffect(this.player.x, this.player.y);
  }

  private onPlayerCollectInvisibility(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    pickupObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    if (this.isGameOver || this.isPaused) return;
    (pickupObj as InvisibilityPickup).destroy();
    const level = getPowerUpLevel('invisibility');
    this.player.activateInvisibility(getInvisibilityDurationMs(level));
    this.spawnPowerStarCollectEffect(this.player.x, this.player.y);
  }

  private onPlayerCollectFuelTank(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    pickupObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    if (this.isGameOver || this.isPaused || this.gameMode !== 'survival') return;
    (pickupObj as FuelTankPickup).destroy();
    const level = getPowerUpLevel('fuelTank');
    this.startScoreBoost(getFuelTankScoreCap(level));
  }

  private createSurvivalPowerUpHud(): void {
    this.engineHudBtn?.destroy();
    this.hyperdriveHudBtn?.destroy();
    this.engineHudBtn = undefined;
    this.hyperdriveHudBtn = undefined;

    if (this.gameMode !== 'survival' || this.inventoryBoostWindowClosed) return;

    const engineCount = getInventoryCount('engine');
    const hyperCount = getInventoryCount('hyperdrive');
    if (engineCount === 0 && hyperCount === 0) return;

    let y = GAME_HEIGHT - 24;
    if (this.fireButton) y = GAME_HEIGHT - 56;

    if (engineCount > 0) {
      this.engineHudBtn = this.createPowerUpTriggerButton(
        GAME_WIDTH - 16,
        y,
        `ENG x${engineCount}`,
        0xffcc00,
        () => this.tryActivateEngine(),
      );
      y -= 40;
    }

    if (hyperCount > 0) {
      this.hyperdriveHudBtn = this.createPowerUpTriggerButton(
        GAME_WIDTH - 16,
        y,
        `HYP x${hyperCount}`,
        0x00d4ff,
        () => this.tryActivateHyperdrive(),
      );
    }
  }

  private createDeathBombHud(): void {
    this.deathBombHudBtn?.destroy();
    this.deathBombHudBtn = undefined;

    if (!isDeathBombUnlocked() || this.deathBombArmed) return;

    const charges = getInventoryCount('deathBomb');
    let y = GAME_HEIGHT - 24;
    if (this.fireButton) y = GAME_HEIGHT - 56;

    const label = charges > 0 ? `BOMB x${charges}` : 'BOMB 0';
    const enabled = charges > 0;
    this.deathBombHudBtn = this.createPowerUpTriggerButton(
      16 + 104,
      y,
      label,
      0xff4466,
      () => this.tryArmDeathBomb(),
      enabled,
    );
  }

  private canArmDeathBomb(): boolean {
    return !this.isGameOver && !this.isPaused && !this.isChoosingWeapon;
  }

  private tryArmDeathBomb(): void {
    if (!this.canArmDeathBomb()) return;
    if (getInventoryCount('deathBomb') <= 0) return;
    this.deathBombArmed = true;
    this.deathBombHudBtn?.destroy();
    this.deathBombHudBtn = undefined;
  }

  private detonateDeathBombAt(x: number, y: number): void {
    const level = getPowerUpLevel('deathBomb');
    detonateDeathBomb(
      x,
      y,
      level,
      {
        asteroids: this.asteroids,
        comets: this.comets,
        spiderShips: this.spiderShips,
        seekerDrones: this.seekerDrones,
        kamikazeWasps: this.kamikazeWasps,
        plasmaTurrets: this.plasmaTurrets,
        storyEnemies: this.storyEnemies,
        bossShips: this.bossShips,
      },
      {
        onAsteroidDestroyed: (ax, ay, points, coinReward, explosionCount) => {
          this.finalizeAsteroidRewards(ax, ay, points, coinReward, explosionCount);
        },
        onEnemyDestroyed: (ex, ey, points, explosionCount) => {
          this.addScore(points);
          this.spawnExplosion(ex, ey, explosionCount);
          this.tryAwardEnemyCoins(ex, ey);
        },
        onBossDamaged: (bx, by) => {
          this.spawnExplosion(bx, by, 4);
        },
        spawnBlastRing: (bx, by, radius) => {
          const ring = this.add.graphics().setDepth(95);
          ring.lineStyle(3, 0xff6644, 0.95);
          ring.strokeCircle(bx, by, 8);
          ring.lineStyle(2, 0xffaa66, 0.7);
          ring.strokeCircle(bx, by, radius * 0.55);
          ring.lineStyle(1, 0xffcc88, 0.45);
          ring.strokeCircle(bx, by, radius);
          this.tweens.add({
            targets: ring,
            alpha: 0,
            duration: 450,
            onComplete: () => ring.destroy(),
          });
        },
      },
    );
  }

  private createPowerUpTriggerButton(
    x: number,
    y: number,
    label: string,
    color: number,
    onClick: () => void,
    interactive = true,
  ): Phaser.GameObjects.Container {
    const btn = this.add.container(x, y).setScrollFactor(0).setDepth(100);
    const bg = this.add.graphics();
    const width = 104;
    const height = 28;
    const drawBg = (alpha: number) => {
      bg.clear();
      bg.fillStyle(color, interactive ? alpha : alpha * 0.35);
      bg.fillRoundedRect(-width, -height / 2, width, height, 8);
      bg.lineStyle(1, color, interactive ? 0.9 : 0.35);
      bg.strokeRoundedRect(-width, -height / 2, width, height, 8);
    };
    drawBg(0.18);

    const textColor = interactive ? color : 0x556677;
    const text = this.add.text(-width / 2, 0, label, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '10px',
      fontStyle: '700',
      color: `#${textColor.toString(16).padStart(6, '0')}`,
    }).setOrigin(0.5);

    btn.add([bg, text]);
    btn.setSize(width, height);
    if (interactive) {
      btn.setInteractive(
        new Phaser.Geom.Rectangle(-width, -height / 2, width, height),
        Phaser.Geom.Rectangle.Contains,
      );
      btn.input!.cursor = 'pointer';
      btn.on('pointerover', () => drawBg(0.32));
      btn.on('pointerout', () => drawBg(0.18));
      btn.on('pointerup', () => {
        playSfx('ui');
        onClick();
      });
    }
    return btn;
  }

  private canActivateInventoryPowerUp(): boolean {
    return !this.isGameOver
      && !this.isPaused
      && !this.isChoosingWeapon
      && !this.player.isBoosting()
      && !this.player.isGhostMode();
  }

  private tryActivateEngine(): void {
    if (this.inventoryBoostWindowClosed) return;
    if (!this.canActivateInventoryPowerUp()) return;
    if (getInventoryCount('engine') <= 0) return;
    if (!consumeInventoryItem('engine')) return;

    this.startScoreBoost(ENGINE_SCORE_CAP);
    this.engineHudBtn?.setVisible(false);
    this.hyperdriveHudBtn?.setVisible(false);
  }

  private tryActivateHyperdrive(): void {
    if (this.inventoryBoostWindowClosed) return;
    if (!this.canActivateInventoryPowerUp()) return;
    if (getInventoryCount('hyperdrive') <= 0) return;
    if (!consumeInventoryItem('hyperdrive')) return;

    this.startScoreBoost(HYPERDRIVE_SCORE_CAP, 160, { r: 0, g: 212, b: 255 });
    this.engineHudBtn?.setVisible(false);
    this.hyperdriveHudBtn?.setVisible(false);
  }

  private fireEnemyLaser(x: number, y: number, angle: number, options?: EnemyLaserOptions): void {
    spawnEnemyLaser(this.enemyLasers, x, y, angle, options);
  }

  private spawnStoryEnemy(): void {
    if (this.isGameOver || this.isPaused || this.isChoosingWeapon) return;

    const definition = getStoryEnemyDefinition(this.worldId, this.storyLevel);
    const activeCount = this.storyEnemies.countActive(true);
    if (!canSpawnStoryEnemy(this.storyLevel, activeCount)) return;

    this.addStoryEnemy(definition);
  }

  private spawnSurvivalStoryEnemy(level: number): void {
    if (this.isGameOver || this.isPaused || this.isChoosingWeapon) return;

    const scaled = scaleStoryEnemyDefinition(getStoryEnemyDefinition(this.worldId, level), this.score);
    this.addStoryEnemy(scaled);
  }

  private addStoryEnemy(definition: ReturnType<typeof getStoryEnemyDefinition>): void {
    const config = StoryEnemy.randomConfig(definition, this.player.x, this.player.y);
    const onFire = storyEnemyNeedsFire(definition.behavior)
      ? (lx: number, ly: number, angle: number) => this.fireEnemyLaser(lx, ly, angle)
      : null;
    const enemy = new StoryEnemy(this, definition, config, onFire);
    this.storyEnemies.add(enemy);
    enemy.setVelocity(config.velocityX, config.velocityY);
  }

  private getStoryEnemyCounts(): Record<number, number> {
    const counts: Record<number, number> = {};
    this.storyEnemies.children.each((child) => {
      const level = (child as StoryEnemy).level;
      counts[level] = (counts[level] ?? 0) + 1;
      return true;
    });
    return counts;
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

    this.storyEnemies.children.each((child) => {
      (child as StoryEnemy).updateEnemy(time, px, py, delta);
      return true;
    });

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

  private spawnBigExplosion(x: number, y: number): void {
    playExplosionSfx();
    const burst = this.add.particles(x, y, 'particle', {
      speed: { min: 90, max: 300 },
      scale: { start: 1.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 750,
      tint: [0xff6b35, 0xffcc00, 0xff4466, 0xffffff],
      quantity: 45,
      emitting: false,
    });
    burst.explode(45);

    const debris = this.add.particles(x, y, 'particle', {
      speed: { min: 30, max: 120 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.85, end: 0 },
      lifespan: 900,
      tint: [0xffaa44, 0xff6600, 0xffcc88],
      quantity: 18,
      emitting: false,
    });
    debris.explode(18);

    this.time.delayedCall(1000, () => {
      burst.destroy();
      debris.destroy();
    });
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

    this.shieldPickups.children.each((child) => {
      const pickup = child as ShieldPickup;
      if (pickup.isOffScreen()) pickup.destroy();
      return true;
    });

    this.invisibilityPickups.children.each((child) => {
      const pickup = child as InvisibilityPickup;
      if (pickup.isOffScreen()) pickup.destroy();
      return true;
    });

    this.fuelTankPickups.children.each((child) => {
      const pickup = child as FuelTankPickup;
      if (pickup.isOffScreen()) pickup.destroy();
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

    this.storyEnemies.children.each((child) => {
      const enemy = child as StoryEnemy;
      if (enemy.isOffScreen()) enemy.destroy();
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
      this.gameMode === 'story' &&
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

    this.comets.children.each((child) => {
      const comet = child as Comet;
      if (comet.isOffScreen()) comet.destroy();
      return true;
    });
  }

  private shouldSpawnComets(): boolean {
    if (this.secretId) return false;
    if (getWorldNumber(this.worldId) >= 3) return true;
    if (this.gameMode === 'story') {
      return this.storyLevel >= 16;
    }
    return this.worldId === 'world2';
  }

  private countCometsOnScreen(): number {
    return this.comets.countActive(true);
  }

  private spawnComet(): void {
    if (this.isGameOver || this.isPaused || !this.shouldSpawnComets()) return;
    if (this.countCometsOnScreen() >= MAX_COMETS_ON_SCREEN) return;

    let variant: 'normal' | 'gold' | undefined;
    if (Math.random() < GOLD_COMET_SPAWN_CHANCE) {
      variant = 'gold';
    } else if (Math.random() < COMET_SPAWN_CHANCE) {
      variant = 'normal';
    } else {
      return;
    }

    const config = Comet.randomConfig(variant);
    const comet = new Comet(this, config);
    this.comets.add(comet);
    comet.setVelocity(config.velocityX, config.velocityY);
  }

  private isMovementInputHeld(): boolean {
    if (this.isDragging) return true;
    if (!this.input.keyboard) return false;

    return (
      this.cursors.left.isDown
      || this.cursors.right.isDown
      || this.cursors.up.isDown
      || this.cursors.down.isDown
      || this.wasd.A.isDown
      || this.wasd.D.isDown
      || this.wasd.W.isDown
      || this.wasd.S.isDown
    );
  }

  private syncRocketEngineSound(): void {
    const shouldPlay =
      !this.isGameOver
      && !this.isPaused
      && !this.isChoosingWeapon
      && !this.isHitStunned
      && this.isMovementInputHeld();
    setRocketEngineActive(shouldPlay);
  }

  update(time: number, delta: number): void {
    if (this.isGameOver || this.isPaused || this.isChoosingWeapon) {
      stopRocketEngineSfx();
      return;
    }

    this.updateStarfield(delta);

    if (this.player.isBoosting()) {
      updateBoostVacuum(
        this.player,
        {
          asteroids: this.asteroids,
          comets: this.comets,
          spiderShips: this.spiderShips,
          seekerDrones: this.seekerDrones,
          kamikazeWasps: this.kamikazeWasps,
          plasmaTurrets: this.plasmaTurrets,
          storyEnemies: this.storyEnemies,
        },
        delta,
        (payload) => this.onBoostVacuumAbsorb(payload),
      );
      this.boostPointMeter.update(
        this.player.getBoostPointsEarned(),
        this.player.getBoostScoreCap(),
      );
    }

    if (!this.isHitStunned) {
      this.handleKeyboardMovement();
      this.handleTouchMovement();
      this.handleShooting(time);
    } else {
      stopRocketEngineSfx();
    }

    this.syncRocketEngineSound();
    this.player.updateThruster(time, delta);
    if (!this.isHitStunned) {
      this.player.clampToBounds();
    }
    this.updateEnemies(time, delta);
    if (this.bossActive) {
      this.updateBoss(time);
    }
    this.updateStoryTimer(delta);
    this.updateSurvivalBossSpawn(delta);
    this.cleanupOffscreen();

    this.spawnTimer += delta;
    const asteroidInterval = getEscalatedAsteroidSpawnInterval(this.spawnInterval, this.score);
    if (this.spawnTimer >= asteroidInterval) {
      this.spawnTimer = 0;
      this.spawnCount += 1;
      const spawnLarge = this.spawnCount % 4 === 0;
      this.spawnAsteroid(spawnLarge ? 'lg' : undefined);
      if (this.shouldSpawnComets()) {
        this.spawnComet();
      }
    }

    this.cometSpawnTimer += delta;
    if (this.shouldSpawnComets() && this.cometSpawnTimer >= 3500) {
      this.cometSpawnTimer = 0;
      this.spawnComet();
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

    this.shieldSpawnTimer += delta;
    if (this.shieldSpawnTimer >= 45000) {
      this.shieldSpawnTimer = 0;
      this.spawnShieldPickup();
    }

    this.invisibilitySpawnTimer += delta;
    if (this.invisibilitySpawnTimer >= 55000) {
      this.invisibilitySpawnTimer = 0;
      this.spawnInvisibilityPickup();
    }

    this.fuelTankSpawnTimer += delta;
    if (this.gameMode === 'survival' && this.fuelTankSpawnTimer >= 50000) {
      this.fuelTankSpawnTimer = 0;
      this.spawnFuelTankPickup();
    }

    if (this.gameMode === 'story') {
      this.storyEnemySpawnTimer += delta;
      if (!this.bossActive) {
        const interval = getStoryEnemySpawnInterval(this.storyLevel);
        if (this.storyEnemySpawnTimer >= interval) {
          this.storyEnemySpawnTimer = 0;
          this.spawnStoryEnemy();
        }
      }

      // Survival enemies also appear in story levels, unlocked/escalated by score.
      this.enemySpawnTimer += delta;
      if (!this.bossActive) {
        const enemyInterval = getEnemySpawnInterval(this.score);
        if (this.enemySpawnTimer >= enemyInterval) {
          this.enemySpawnTimer = 0;
          const kind = pickEnemyToSpawn(this.score, this.getEnemyCounts());
          if (kind) this.spawnEnemy(kind);
        }
      }
    } else {
      this.enemySpawnTimer += delta;
      if (!this.bossActive) {
        const enemyInterval = getEnemySpawnInterval(this.score);
        if (this.enemySpawnTimer >= enemyInterval) {
          this.enemySpawnTimer = 0;
          const kind = pickEnemyToSpawn(this.score, this.getEnemyCounts(), true);
          if (kind) this.spawnEnemy(kind);
        }
      }

      this.storyEnemySpawnTimer += delta;
      if (!this.bossActive) {
        const storyInterval = getSurvivalStoryEnemySpawnInterval(this.score);
        if (this.storyEnemySpawnTimer >= storyInterval) {
          this.storyEnemySpawnTimer = 0;
          const level = pickStoryEnemyToSpawn(this.score, this.getStoryEnemyCounts(), this.worldId);
          if (level !== null) this.spawnSurvivalStoryEnemy(level);
        }
      }
    }
  }
}
