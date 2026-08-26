import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { Player } from '../entities/Player';
import { Asteroid, ASTEROID_DAMAGE, type AsteroidSize } from '../entities/Asteroid';
import { Heart, HEART_HEAL } from '../entities/Heart';
import { SpaceDebris, computeSpaceDebrisVitality } from '../entities/SpaceDebris';
import { rollSpaceDebrisInsteadOfHeart } from '../armorDrops';
import { PowerStar } from '../entities/PowerStar';
import { SpiderShip, SPIDER_BODY_DAMAGE } from '../entities/SpiderShip';
import { SeekerDrone, SEEKER_BODY_DAMAGE } from '../entities/SeekerDrone';
import { KamikazeWasp, WASP_BODY_DAMAGE } from '../entities/KamikazeWasp';
import { PlasmaTurret, TURRET_BODY_DAMAGE } from '../entities/PlasmaTurret';
import {
  FlamethrowerShip,
  FLAMETHROWER_BODY_DAMAGE,
} from '../entities/FlamethrowerShip';
import { FirePlume, FIRE_DAMAGE, FIRE_TICK_MS } from '../entities/FirePlume';
import { StoryEnemy, storyEnemyNeedsFire } from '../entities/StoryEnemy';
import { BossShip } from '../entities/BossShip';
import {
  applyChill,
  applyChillAfterAi,
  applyChillDriftVelocity,
  applyChillScaleToVelocity,
} from '../chill';
import { Wormhole } from '../entities/Wormhole';
import { FinishPanel } from '../entities/FinishPanel';
import { WarpPanel } from '../entities/WarpPanel';
import { Comet } from '../entities/Comet';
import { Mine, type MineVariant } from '../entities/Mine';
import { MineCarrier } from '../entities/MineCarrier';
import { Planet } from '../entities/Planet';
import { Moon } from '../entities/Moon';
import { BlackHole } from '../entities/BlackHole';
import { GravityField, type GravityFieldSize } from '../entities/GravityField';
import {
  approximateMineRadius,
  approximatePlayerRadius,
  resolveCirclePenetration,
  shouldBlueMineSolidCollidePlanet,
  shouldPlayerSolidCollideCelestial,
} from '../celestialCollision';
import { PLANET_BODY_RADIUS } from '../entities/Planet';
import { MOON_BODY_RADIUS } from '../entities/Moon';
import { detonateMineBlast, blastDamageForRadius, type MineBlastSource } from '../mineBlast';
import { applyGravitySources, type GravitySource } from '../gravityField';
import { getBossConfigForLevel, getBossSpawnMsForLevel } from '../levelConfig';
import { computeBossHealth, computeSurvivalBossHealth } from '../bossHealth';
import {
  getBossDefinition,
  getLevelMeta,
  getBackgroundTheme,
  getStoryEnemyDefinition,
  getSurvivalBackgroundTheme,
  getSurvivalHudLabel,
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
import { ArmorBar, MAX_ARMOR } from '../ui/ArmorBar';
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
  goToEditorHub,
  goToLevelSelect,
  goToTitleScreen,
  restartGame,
  saveScoreAndGoToTitle,
  updateHighScore,
} from '../gameFlow';
import {
  canUseComets,
  canUseFlamethrowers,
  canUseMineCarriers,
  canUsePurpleMines,
  canUseRedMines,
  getAreaContent,
  getCustomLevel,
  getEffectiveIntervalMs,
  type CustomAreaContent,
  type CustomLevelDefinition,
} from '../editor/customLevels';
import {
  isBossIdUnlocked,
  isStoryEnemyIdUnlocked,
  parseEditorBossId,
  parseEditorStoryId,
} from '../editor/editorCatalog';
import { addCoins, formatRunCoinsLabel } from '../coins';
import { hasSurvivalGoldSpawnBonus } from '../playerSkins';
import {
  getGoldAsteroidSpawnChance,
  getGoldCometSpawnChance,
  getGoldPlanetSpawnChance,
  getGoldMoonSpawnChance,
  getCometSpawnChance,
  getCometSpawnIntervalMs,
  MAX_GOLD_ASTEROIDS_ON_SCREEN,
  rollEnemyCoinDrop,
  MAX_COMETS_ON_SCREEN,
  MINE_SPAWN_CHANCE,
  MAX_MINES_ON_SCREEN,
  MAX_MINES_PER_VARIANT_EDITOR,
  MAX_PLANETS_ON_SCREEN,
  MAX_MOONS_ON_SCREEN,
  MAX_BLACK_HOLES_ON_SCREEN,
  PLANET_SPAWN_INTERVAL_MS,
  MOON_SPAWN_INTERVAL_MS,
  PLANET_SPAWN_CHANCE,
  MOON_SPAWN_CHANCE,
} from '../coinDrops';
import { unlockLevel, isLevelUnlocked, getMaxLevelSlots } from '../storyProgress';
import {
  unlockWorld2Story,
  unlockSecretIss,
  completeSecretIss,
  unlockSecretDawn,
  completeSecretDawn,
  unlockSecretGalilean,
  completeSecretGalilean,
  unlockSecretWise0855,
  completeSecretWise0855,
  onLevel20Cleared,
} from '../worldProgress';
import { getSecretLevel, getSecretsForWorld, getSecretWorldId } from '../secretLevels';
import {
  DarknessOverlay,
  LIGHT_RADIUS,
  beamLengthToScreenEdge,
  type CircleLight,
  type BeamLight,
} from '../lighting/DarknessOverlay';
import { getWorldIdFromLevel } from '../gameMode';
import { getWorldNumber } from '../worlds';
import { applyStoryBackground } from '../ui/StoryThemeBackground';
import {
  getGalileanMoonEnemyDefinition,
  isGalileanMoonLevel,
  pickGalileanSecretEnemy,
} from '../world2/galileanEnemies';
import {
  getWorld3VariantDefinition,
  hasWorld3Variants,
  isWorld3VariantLevel,
  pickWorld3StoryEnemyVariant,
} from '../world3/storyEnemyVariants';
import {
  applyAudioSettings,
  initAudio,
  pauseMusic,
  ensureMusic,
  playExplosionSfx,
  playBossAppearAlarmSfx,
  playHitSfx,
  playLowHpAlarmSfx,
  playRockBreakSfx,
  playRockSfx,
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
  FUEL_TANK_SPAWN_INTERVAL_BOOST_MS,
  FUEL_TANK_SPAWN_INTERVAL_MS,
  getFuelTankScoreCap,
  getInvisibilityDurationMs,
  getPowerStarDurationMs,
  getShieldDurationMs,
  HYPERDRIVE_SCORE_CAP,
  POST_SCORE_BOOST_INVISIBILITY_MS,
  POST_SCORE_BOOST_MERCY_INVINCIBILITY_MS,
} from '../powerUpEffects';
import { BoostPointMeter } from '../ui/BoostPointMeter';
import { updateBoostVacuum, type BoostVacuumAbsorbPayload } from '../boostVacuum';

const STAR_BOOST_SPEED_MULTIPLIER = 2.75;
const SURVIVAL_INVENTORY_BOOST_WINDOW_MS = 5000;
/** Top-center HUD stack (boss / boost / weapon labels). */
const BOSS_HEALTH_BAR_Y = 96;
const BOOST_METER_Y_DEFAULT = 78;
/** Below boss bar (center 96, half-height 7 → bottom ~103). */
const BOOST_METER_Y_BELOW_BOSS = 118;
const WEAPON_HUD_Y_DEFAULT = 112;
/** Boost score label sits ~15px under the bar center; keep weapon text under that. */
const BOOST_METER_LABEL_OFFSET = 25;
const WEAPON_HUD_GAP_BELOW_BOOST = 10;
const HEALTH_BAR_Y = 58;
const ARMOR_BAR_Y = 76;
/** Vertical space the armor row adds below the health bar (shift boss/boost down while armor is shown). */
const ARMOR_BAR_STACK_OFFSET = ARMOR_BAR_Y - HEALTH_BAR_Y;
/** Play the low-HP alarm once when damage brings HP to this value or below. */
const LOW_HP_ALARM_THRESHOLD = 4;

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private asteroids!: Phaser.Physics.Arcade.Group;
  private bullets!: Phaser.Physics.Arcade.Group;
  private hearts!: Phaser.Physics.Arcade.Group;
  private spaceDebris!: Phaser.Physics.Arcade.Group;
  private powerStars!: Phaser.Physics.Arcade.Group;
  private shieldPickups!: Phaser.Physics.Arcade.Group;
  private invisibilityPickups!: Phaser.Physics.Arcade.Group;
  private fuelTankPickups!: Phaser.Physics.Arcade.Group;
  private spiderShips!: Phaser.Physics.Arcade.Group;
  private seekerDrones!: Phaser.Physics.Arcade.Group;
  private kamikazeWasps!: Phaser.Physics.Arcade.Group;
  private plasmaTurrets!: Phaser.Physics.Arcade.Group;
  private flamethrowerShips!: Phaser.Physics.Arcade.Group;
  private firePlumes!: Phaser.Physics.Arcade.Group;
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
  private armor = 0;
  private healthBar!: HealthBar;
  private armorBar!: ArmorBar;
  private bossHealthBar!: BossHealthBar;
  private isGameOver = false;
  private isPlayerDying = false;
  private gameOverScreenShown = false;
  private isPaused = false;
  private pauseBtnHit?: Phaser.GameObjects.Zone;
  private pauseBtnDrawIcon?: (color: number) => void;
  private pauseMenu?: Phaser.GameObjects.Container;
  private pauseConfirmOverlay?: Phaser.GameObjects.Container;
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
  private maxHeartsOnScreen = 5;
  private powerStarSpawnTimer = 15000;
  private powerStarSpawnInterval = 30000;
  private maxPowerStarsOnScreen = 1;
  private enemySpawnTimer = 0;
  private storyEnemySpawnTimer = 0;
  private isHitStunned = false;
  /** Global fire DoT gate — 1 damage every FIRE_TICK_MS while overlapping any plume. */
  private lastFireDamageAt = Number.NEGATIVE_INFINITY;
  /** Prevents hit-SFX spam while overlapping a boss under invincibility/boost/shield. */
  private bossRamHitSfxAt = 0;
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
  private continueMusic = false;
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
  private mines!: Phaser.Physics.Arcade.Group;
  private mineCarriers!: Phaser.Physics.Arcade.Group;
  private planets!: Phaser.Physics.Arcade.Group;
  private moons!: Phaser.Physics.Arcade.Group;
  private blackHoles!: Phaser.Physics.Arcade.Group;
  private gravityFields!: Phaser.GameObjects.Group;
  private wormholeSpawned = false;
  private pendingSecretId?: string;
  private warpPanelSpawned = false;
  private darknessOverlay?: DarknessOverlay;
  private cometSpawnTimer = 0;
  private mineSpawnTimer = 0;
  private planetSpawnTimer = 0;
  private moonSpawnTimer = 0;
  private shieldSpawnTimer = 0;
  private invisibilitySpawnTimer = 0;
  private fuelTankSpawnTimer = 0;
  private engineHudBtn?: Phaser.GameObjects.Container;
  private hyperdriveHudBtn?: Phaser.GameObjects.Container;

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

  private customSlotIndex = 0;
  private customSubAreaId?: string;
  private carryScoreOnStart = 0;
  private editorLevel: CustomLevelDefinition | null = null;
  private editorArea: CustomAreaContent | null = null;
  private editorBossesDefeated = 0;
  private editorBonusPoints = 0;
  private editorPendingWarpSubAreaId?: string;
  private editorSpawnedMiscIds = new Set<string>();
  private editorSurvivalTimers: Record<string, number> = {};
  private editorStoryTimers: Record<string, number> = {};
  private editorMineTimers: Record<string, number> = {};
  /** Cap-blocked editor mine spawns waiting for a free slot (chance already rolled). */
  private editorMinePending: Record<string, boolean> = {};
  private editorBlackHoleTimer = 0;
  private editorSmallGravityTimer = 0;
  private editorLargeGravityTimer = 0;
  private editorBossTimer = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: {
    mode?: GameMode;
    level?: number;
    worldId?: string;
    secretId?: string;
    continueMusic?: boolean;
    customSlotIndex?: number;
    customSubAreaId?: string;
    carryScore?: number;
  }): void {
    const normalized = normalizeGameSceneData(data);
    this.gameMode = normalized.mode;
    this.storyLevel = normalized.level;
    this.worldId = resolveWorldId(normalized.worldId, normalized.level, normalized.secretId);
    this.secretId = normalized.secretId;
    this.continueMusic = normalized.continueMusic === true;
    this.customSlotIndex = typeof normalized.customSlotIndex === 'number' ? normalized.customSlotIndex : 0;
    this.customSubAreaId = normalized.customSubAreaId;
    this.carryScoreOnStart = typeof normalized.carryScore === 'number' ? normalized.carryScore : 0;

    if (this.gameMode === 'editor') {
      this.editorLevel = getCustomLevel(this.customSlotIndex);
      this.editorArea = this.editorLevel
        ? getAreaContent(this.editorLevel, this.customSubAreaId)
        : null;
      this.worldId = 'world1';
    } else {
      this.editorLevel = null;
      this.editorArea = null;
    }
  }

  create(): void {
    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.isGameOver = false;
    this.isPlayerDying = false;
    this.gameOverScreenShown = false;
    this.isPaused = false;
    this.time.paused = false;
    this.pauseBtnHit = undefined;
    this.pauseBtnDrawIcon = undefined;
    this.pauseMenu?.destroy();
    this.pauseMenu = undefined;
    this.pauseConfirmOverlay?.destroy();
    this.pauseConfirmOverlay = undefined;
    this.settingsPanel?.destroy();
    this.settingsPanel = undefined;
    this.destroyAlmanacPanel();
    this.score = 0;
    this.runCoins = 0;
    this.hp = MAX_HP;
    this.armor = 0;
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
    this.mineSpawnTimer = 0;
    this.planetSpawnTimer = 0;
    this.moonSpawnTimer = 0;
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
    this.editorBossesDefeated = 0;
    this.editorBonusPoints = 0;
    this.editorPendingWarpSubAreaId = undefined;
    this.editorSpawnedMiscIds = new Set();
    this.editorSurvivalTimers = {};
    this.editorStoryTimers = {};
    this.editorMineTimers = {};
    this.editorMinePending = {};
    this.editorBlackHoleTimer = 0;
    this.editorSmallGravityTimer = 0;
    this.editorLargeGravityTimer = 0;
    this.editorBossTimer = 0;

    if (this.gameMode === 'editor' && !this.editorArea) {
      goToEditorHub(this, this.customSlotIndex);
      return;
    }

    const secretDef = this.secretId ? getSecretLevel(this.secretId) : undefined;
    const editorBg = this.editorArea?.background;
    const isDarkLevel = secretDef?.darkLevel === true
      || (this.gameMode === 'editor'
        && editorBg != null
        && !editorBg.starsEnabled
        && editorBg.obstructionEnabled);

    const showStars = this.gameMode === 'editor'
      ? editorBg?.starsEnabled !== false
      : !isDarkLevel;

    if (showStars) {
      this.createStarfield();
    } else {
      this.stars = [];
      this.starSpeeds = [];
    }

    if (this.gameMode === 'editor' && editorBg) {
      applyStoryBackground(this, GAME_WIDTH, GAME_HEIGHT, {
        id: 'editor',
        skyTop: editorBg.skyTop,
        skyBottom: editorBg.skyBottom,
        starColor: editorBg.starColor,
        planetColor: 0x000000,
        planetSize: 0,
        planetX: 0.5,
        accentColor: 0x44ff88,
      });
    } else if (this.gameMode === 'story') {
      const levelMeta = getLevelMeta(this.worldId, this.storyLevel, this.secretId);
      const theme = getBackgroundTheme(this.worldId, levelMeta.themeId);
      applyStoryBackground(this, GAME_WIDTH, GAME_HEIGHT, theme);
    } else {
      const theme = getSurvivalBackgroundTheme(this.worldId);
      applyStoryBackground(this, GAME_WIDTH, GAME_HEIGHT, theme);
    }
    this.createGroups();
    this.createPlayer();
    this.createUI();
    this.setupInput();
    this.setupCollisions();

    this.darknessOverlay?.destroy();
    this.darknessOverlay = undefined;
    if (isDarkLevel) {
      const obstructionColor = this.gameMode === 'editor'
        ? (editorBg?.obstructionColor ?? 0x000000)
        : (secretDef?.darkObstructionColor ?? 0x000000);
      this.darknessOverlay = new DarknessOverlay(this, obstructionColor);
    }

    initAudio();
    if (this.continueMusic) {
      ensureMusic();
    } else {
      startMusic();
    }
    this.continueMusic = false;
    stopRocketEngineSfx();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      stopRocketEngineSfx();
      stopInvincibilityTheme();
      this.darknessOverlay?.destroy();
      this.darknessOverlay = undefined;
      this.input.keyboard?.removeCapture([
        Phaser.Input.Keyboard.KeyCodes.W,
        Phaser.Input.Keyboard.KeyCodes.A,
        Phaser.Input.Keyboard.KeyCodes.S,
        Phaser.Input.Keyboard.KeyCodes.D,
      ]);
    });

    if (this.carryScoreOnStart > 0) {
      this.score = this.carryScoreOnStart;
      this.scoreText.setText(`SCORE ${this.score}`);
      this.carryScoreOnStart = 0;
    }

    const shouldBootstrapAsteroids =
      this.gameMode !== 'editor'
      || this.editorArea?.obstacles.asteroids.enabled === true;

    if (shouldBootstrapAsteroids) {
      this.spawnAsteroid('lg');
      for (let i = 0; i < 4; i++) {
        this.time.delayedCall(100 + i * 400, () => this.spawnAsteroid());
      }
    }
  }

  private createStarfield(): void {
    this.stars = [];
    this.starSpeeds = [];

    const starTint = this.gameMode === 'editor' && this.editorArea
      ? this.editorArea.background.starColor
      : this.gameMode === 'story'
        ? getBackgroundTheme(this.worldId, getLevelMeta(this.worldId, this.storyLevel, this.secretId).themeId).starColor
        : getSurvivalBackgroundTheme(this.worldId).starColor;

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
    this.spaceDebris = this.physics.add.group();
    this.powerStars = this.physics.add.group();
    this.shieldPickups = this.physics.add.group();
    this.invisibilityPickups = this.physics.add.group();
    this.fuelTankPickups = this.physics.add.group();
    this.spiderShips = this.physics.add.group();
    this.seekerDrones = this.physics.add.group();
    this.kamikazeWasps = this.physics.add.group();
    this.plasmaTurrets = this.physics.add.group();
    this.flamethrowerShips = this.physics.add.group();
    this.firePlumes = this.physics.add.group();
    this.storyEnemies = this.physics.add.group();
    this.enemyLasers = this.physics.add.group();
    this.lootBoxes = this.physics.add.group();
    this.bossShips = this.physics.add.group();
    this.wormholes = this.physics.add.group();
    this.warpPanels = this.physics.add.group();
    this.comets = this.physics.add.group();
    this.mines = this.physics.add.group();
    this.mineCarriers = this.physics.add.group();
    this.planets = this.physics.add.group();
    this.moons = this.physics.add.group();
    this.blackHoles = this.physics.add.group();
    this.gravityFields = this.add.group();
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

    const pauseBtn = this.createPauseButton();
    const topLabelX = pauseBtn.x - pauseBtn.width / 2 - 8;
    const topLabelMaxWidth = Math.max(80, topLabelX - 16);

    this.scoreText = this.add.text(16, 12, 'SCORE 0', hudStyle)
      .setScrollFactor(0).setDepth(hudTextDepth);

    const coinY = this.gameMode === 'story' ? 44 : 36;
    const coinLabel = this.gameMode === 'editor' ? 'BONUS 0' : formatRunCoinsLabel(0);
    this.coinText = this.add.text(16, coinY, coinLabel, {
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

      const locationLabel = levelMeta.location.toUpperCase();

      this.add.text(topLabelX, 12, locationLabel, {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '10px',
        fontStyle: '700',
        color: `#${theme.accentColor.toString(16).padStart(6, '0')}`,
        align: 'right',
        wordWrap: { width: topLabelMaxWidth },
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(hudTextDepth);
    } else if (this.gameMode === 'survival') {
      const survivalTheme = getSurvivalBackgroundTheme(this.worldId);
      this.add.text(topLabelX, 12, getSurvivalHudLabel(this.worldId), {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '10px',
        fontStyle: '700',
        color: `#${survivalTheme.accentColor.toString(16).padStart(6, '0')}`,
        align: 'right',
        wordWrap: { width: topLabelMaxWidth },
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(hudTextDepth);
    } else if (this.gameMode === 'editor') {
      const name = this.editorLevel?.name ?? 'CUSTOM';
      this.add.text(topLabelX, 12, name.toUpperCase(), {
        fontFamily: 'Orbitron, sans-serif',
        fontSize: '10px',
        fontStyle: '700',
        color: '#44ff88',
        align: 'right',
        wordWrap: { width: topLabelMaxWidth },
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(hudTextDepth);
    }

    this.healthBar = new HealthBar(this, GAME_WIDTH / 2, HEALTH_BAR_Y);
    this.armorBar = new ArmorBar(this, GAME_WIDTH / 2, ARMOR_BAR_Y);
    this.boostPointMeter = new BoostPointMeter(this, GAME_WIDTH / 2, BOOST_METER_Y_DEFAULT);
    this.bossHealthBar = new BossHealthBar(this, BOSS_HEALTH_BAR_Y);
    this.weaponHudText = this.add.text(GAME_WIDTH / 2, WEAPON_HUD_Y_DEFAULT, '', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '9px',
      color: '#556677',
      align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(hudTextDepth);
    this.layoutTopCenterHud();
    this.updateFireModeUI();
    if (this.gameMode !== 'editor') {
      this.createSurvivalPowerUpHud();
      this.createDeathBombHud();
    }
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

  private createPauseButton(): Phaser.GameObjects.Container {
    const btnW = 42;
    const btnH = 36;
    const barW = 5;
    const barH = 16;
    const barGap = 6;
    const idleColor = 0x8899bb;
    const hoverColor = 0x00d4ff;

    const container = this.add.container(GAME_WIDTH - 16 - btnW / 2, 12 + btnH / 2);
    container.setSize(btnW, btnH);
    container.setScrollFactor(0).setDepth(110);

    const bg = this.add.graphics();
    bg.fillStyle(0x1a1f3a, 1);
    bg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 4);

    const icon = this.add.graphics();
    const drawIcon = (color: number) => {
      icon.clear();
      icon.fillStyle(color, 1);
      const barsLeft = -(barW * 2 + barGap) / 2;
      const barsTop = -barH / 2;
      icon.fillRect(barsLeft, barsTop, barW, barH);
      icon.fillRect(barsLeft + barW + barGap, barsTop, barW, barH);
    };
    drawIcon(idleColor);
    this.pauseBtnDrawIcon = drawIcon;

    // Zone owns input so the full button is hit-tested (Container custom
    // hit areas get double-offset by the default 0.5 origin).
    const hit = this.add.zone(0, 0, btnW, btnH);
    hit.setInteractive({ useHandCursor: true });
    this.pauseBtnHit = hit;

    container.add([bg, icon, hit]);

    hit.on('pointerover', () => drawIcon(hoverColor));
    hit.on('pointerout', () => drawIcon(idleColor));
    hit.on('pointerup', () => {
      playSfx('ui');
      this.togglePause();
    });
    return container;
  }

  private syncPauseButtonInteractive(): void {
    const enabled = !this.isPaused && !this.isChoosingWeapon && !this.isGameOver;
    if (!this.pauseBtnHit) return;

    if (enabled) {
      this.pauseBtnHit.setInteractive({ useHandCursor: true });
    } else {
      this.pauseBtnHit.disableInteractive();
      this.pauseBtnDrawIcon?.(0x8899bb);
      // disableInteractive while hovered leaves the hand cursor stuck
      this.input.setDefaultCursor('default');
    }
  }

  private setupInput(): void {
    if (this.input.keyboard) {
      this.input.keyboard.enabled = true;
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
      this.spaceDebris,
      this.onPlayerCollectSpaceDebris as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
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
      this.flamethrowerShips,
      this.onBulletHitFlamethrower as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
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
      this.flamethrowerShips,
      this.onPlayerHitFlamethrower as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
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
      this.mines,
      this.onPlayerHitMine as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.bullets,
      this.mineCarriers,
      this.onBulletHitMineCarrier as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.player,
      this.mineCarriers,
      this.onPlayerHitMineCarrier as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    const kickMineDetonationGroups = [
      this.spiderShips,
      this.seekerDrones,
      this.kamikazeWasps,
      this.plasmaTurrets,
      this.flamethrowerShips,
      this.storyEnemies,
      this.mineCarriers,
      this.bossShips,
      this.asteroids,
      this.comets,
      this.moons,
    ];
    for (const group of kickMineDetonationGroups) {
      this.physics.add.overlap(
        this.mines,
        group,
        this.onArmedKickMineHitHazard as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
        undefined,
        this,
      );
    }

    this.physics.add.overlap(
      this.mines,
      this.planets,
      this.onArmedKickMineHitPlanet as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.player,
      this.planets,
      this.onPlayerHitPlanet as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.player,
      this.moons,
      this.onPlayerHitMoon as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.physics.add.collider(
      this.player,
      this.planets,
      undefined,
      () => shouldPlayerSolidCollideCelestial(this.player),
      this,
    );

    this.physics.add.collider(
      this.player,
      this.moons,
      undefined,
      () => shouldPlayerSolidCollideCelestial(this.player),
      this,
    );

    this.physics.add.collider(
      this.mines,
      this.planets,
      undefined,
      (_mineObj) => shouldBlueMineSolidCollidePlanet(_mineObj as Mine),
      this,
    );

    this.physics.add.overlap(
      this.player,
      this.blackHoles,
      this.onPlayerHitBlackHole as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this,
    );

    this.physics.add.overlap(
      this.mines,
      this.mines,
      this.onMineHitMine as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
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
    } else {
      playRockSfx();
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

  private onBulletHitFlamethrower(
    bulletObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    shipObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    this.applyBulletToScoredEnemy(
      bulletObj as Phaser.Physics.Arcade.Sprite,
      shipObj as FlamethrowerShip,
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
    const chill = bullet.getData('chill') === true;

    if (boss.takeDamage(damage)) {
      const { x, y } = boss;
      this.bossHealthBar.hide();
      this.layoutTopCenterHud();
      this.addScore(boss.points);
      // Boss kill: explosion only (no hit SFX).
      this.spawnBigExplosion(x, y);
      this.lastDefeatedBossX = x;
      this.lastDefeatedBossY = y;
      this.onBossDefeated();
    } else {
      playHitSfx();
      this.bossHealthRemaining = boss.health;
      this.bossHealthBar.setHp(boss.health);
      if (chill) applyChill(boss);
    }
    this.consumeBulletHit(bullet);
  }

  private applyBulletToScoredEnemy(
    bullet: Phaser.Physics.Arcade.Sprite,
    enemy: Phaser.Physics.Arcade.Sprite & {
      takeDamage(amount: number): boolean;
      points: number;
    },
    explosionCount: number,
  ): void {
    const damage = (bullet.getData('damage') as number) ?? 1;
    const chill = bullet.getData('chill') === true;
    playHitSfx();
    if (enemy.takeDamage(damage)) {
      this.addScore(enemy.points);
      this.spawnExplosion(enemy.x, enemy.y, explosionCount);
      this.tryAwardEnemyCoins(enemy.x, enemy.y);
    } else if (chill) {
      applyChill(enemy);
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

  private onPlayerHitFlamethrower(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    shipObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    this.handleEnemyRam(shipObj as FlamethrowerShip, FLAMETHROWER_BODY_DAMAGE, 10);
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
    if (this.player.isGhostMode()) return;

    const boss = bossObj as BossShip;

    // Shield / invincibility / boost: hit SFX only (boss is not destroyed by ramming).
    // Overlap fires every frame while contacting, so throttle the SFX.
    if (this.player.isInvincible() || this.player.isBoosting() || this.player.isShielded()) {
      const now = this.time.now;
      if (now - this.bossRamHitSfxAt >= 450) {
        this.bossRamHitSfxAt = now;
        playHitSfx();
      }
      if (this.player.isShielded() && !this.player.isInvincible() && !this.player.isBoosting()) {
        this.player.absorbHit();
      }
      return;
    }

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
      playHitSfx();
      this.spawnExplosion(x, y, explosionCount);
      this.tryAwardEnemyCoins(x, y);
      return;
    }

    if (this.player.isShielded()) {
      enemy.destroy();
      playHitSfx();
      this.spawnExplosion(x, y, explosionCount);
      this.tryAwardEnemyCoins(x, y);
      this.player.absorbHit();
      return;
    }

    enemy.destroy();
    this.spawnExplosion(x, y, explosionCount);
    this.tryAwardEnemyCoins(x, y);
    this.takeDamage(bodyDamage);
  }

  private togglePause(): void {
    if (this.isGameOver || this.isChoosingWeapon) return;
    if (this.pauseConfirmOverlay) {
      this.cancelPauseConfirm();
      return;
    }
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
        onClick: () => this.showPauseConfirm('Restart level?', () => this.confirmRestartFromPause()),
      },
    ];

    if (this.gameMode === 'story') {
      pauseButtons.push({
        label: 'LEVEL SELECT',
        y: 0,
        color: 0x8899bb,
        onClick: () => this.showPauseConfirm('Return to level select?', () => this.quitToLevelSelect()),
      });
    }

    pauseButtons.push(
      { label: 'ALMANAC', y: 0, color: 0x8899bb, onClick: () => this.showAlmanacFromPause() },
      { label: 'SETTINGS', y: 0, color: 0x8899bb, onClick: () => this.showSettingsFromPause() },
    );

    if (this.gameMode === 'editor') {
      pauseButtons.push({
        label: 'EDITOR',
        y: 0,
        color: 0xff4466,
        onClick: () => this.showPauseConfirm('Return to the editor?', () => this.quitToEditor()),
      });
    } else {
      pauseButtons.push({
        label: 'QUIT',
        y: 0,
        color: 0xff4466,
        onClick: () => this.showPauseConfirm('Return to main menu?', () => this.quitToTitle()),
      });
    }

    const buttonStartY = this.gameMode === 'story'
      ? GAME_HEIGHT / 2 - 20
      : GAME_HEIGHT / 2 - 40;

    this.pauseMenu = createMenuOverlay(this, 'PAUSED', pauseButtons, 200, buttonStartY);
    this.syncPauseButtonInteractive();
  }

  private showPauseConfirm(message: string, onYes: () => void): void {
    this.pauseMenu?.setVisible(false);
    this.settingsPanel?.destroy();
    this.settingsPanel = undefined;
    this.destroyAlmanacPanel();
    this.pauseConfirmOverlay?.destroy();

    const root = this.add.container(0, 0).setDepth(260).setScrollFactor(0);

    root.add(this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x000000,
      0.8,
    ));

    root.add(this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, message, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '22px',
      fontStyle: '700',
      color: '#00d4ff',
    }).setOrigin(0.5));

    const { container: yesBtn } = createMenuButton(this, {
      label: 'YES',
      y: GAME_HEIGHT / 2 + 10,
      color: 0xff4466,
      onClick: () => {
        this.pauseConfirmOverlay?.destroy();
        this.pauseConfirmOverlay = undefined;
        onYes();
      },
    });
    yesBtn.setX(GAME_WIDTH / 2);
    root.add(yesBtn);

    const { container: noBtn } = createMenuButton(this, {
      label: 'NO',
      y: GAME_HEIGHT / 2 + 74,
      onClick: () => this.cancelPauseConfirm(),
    });
    noBtn.setX(GAME_WIDTH / 2);
    root.add(noBtn);

    this.pauseConfirmOverlay = root;
  }

  private cancelPauseConfirm(): void {
    this.pauseConfirmOverlay?.destroy();
    this.pauseConfirmOverlay = undefined;
    this.pauseMenu?.setVisible(true);
  }

  private confirmRestartFromPause(): void {
    this.isPaused = false;
    this.pauseMenu?.destroy();
    this.pauseMenu = undefined;
    this.settingsPanel?.destroy();
    this.settingsPanel = undefined;
    this.destroyAlmanacPanel();
    this.bankRunCoins();
    // GameScene.create() restarts main theme from the beginning.
    restartGame(
      this,
      this.score,
      this.gameMode,
      this.storyLevel,
      this.worldId,
      this.secretId,
      this.customSlotIndex,
      this.customSubAreaId,
    );
  }

  private quitToEditor(): void {
    this.isPaused = false;
    this.pauseMenu?.destroy();
    this.pauseMenu = undefined;
    this.settingsPanel?.destroy();
    this.settingsPanel = undefined;
    this.destroyAlmanacPanel();
    this.pauseConfirmOverlay?.destroy();
    this.pauseConfirmOverlay = undefined;
    goToEditorHub(this, this.customSlotIndex);
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
    this.pauseConfirmOverlay?.destroy();
    this.pauseConfirmOverlay = undefined;
    this.settingsPanel?.destroy();
    this.settingsPanel = undefined;
    this.destroyAlmanacPanel();
    this.time.paused = false;
    this.tweens.resumeAll();
    this.physics.resume();
    resumeMusic();
    this.syncPauseButtonInteractive();
  }

  private quitToTitle(): void {
    this.isPaused = false;
    this.pauseMenu?.destroy();
    this.pauseMenu = undefined;
    this.pauseConfirmOverlay?.destroy();
    this.pauseConfirmOverlay = undefined;
    this.settingsPanel?.destroy();
    this.settingsPanel = undefined;
    this.destroyAlmanacPanel();
    this.bankRunCoins();
    // Destination scene starts main theme from the beginning.
    saveScoreAndGoToTitle(this, this.score, this.gameMode, this.worldId);
  }

  private quitToLevelSelect(): void {
    this.isPaused = false;
    this.pauseMenu?.destroy();
    this.pauseMenu = undefined;
    this.pauseConfirmOverlay?.destroy();
    this.pauseConfirmOverlay = undefined;
    this.settingsPanel?.destroy();
    this.settingsPanel = undefined;
    this.destroyAlmanacPanel();
    this.bankRunCoins();
    // Destination scene starts main theme from the beginning.
    goToLevelSelect(this, this.worldId);
  }

  private onPlayerHitAsteroid(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    asteroidObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    if (this.isGameOver || this.isPaused) return;
    if (this.player.isGhostMode()) return;
    const asteroid = asteroidObj as Asteroid;
    const explosionCount = asteroid.size === 'lg' ? 12 : asteroid.size === 'md' ? 8 : 5;
    const poweredBreak =
      this.player.isInvincible()
      || this.player.isBoosting()
      || this.player.isShielded();

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
      if (poweredBreak) playRockBreakSfx();

      if (!this.player.isDamageImmune()) {
        this.takeDamage(ASTEROID_DAMAGE[size]);
      } else if (this.player.isShielded() && !this.player.isInvincible() && !this.player.isBoosting()) {
        this.player.absorbHit();
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
      playRockBreakSfx();
      this.spawnExplosion(asteroid.x, asteroid.y, explosionCount);
      return;
    }

    if (this.player.isShielded()) {
      const { x, y, points } = asteroid;
      asteroid.destroy();
      this.addScore(points);
      playRockBreakSfx();
      this.spawnExplosion(x, y, explosionCount);
      this.player.absorbHit();
      return;
    }

    // Unpowered ram: destroy silently (no rock-break) and damage the player.
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
    const level = getPowerUpLevel('powerStar');
    this.player.activateInvincibility(getPowerStarDurationMs(level));
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

  private onPlayerCollectSpaceDebris(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    debrisObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    if (this.isGameOver || this.isPaused) return;
    const debris = debrisObj as SpaceDebris;
    debris.destroy();

    const prevHp = this.hp;
    const prevArmor = this.armor;
    const result = computeSpaceDebrisVitality(this.hp, this.armor, MAX_HP, MAX_ARMOR);
    if (result.hp === prevHp && result.armor === prevArmor) return;

    this.hp = result.hp;
    this.armor = result.armor;
    this.syncVitalityHud();

    if (this.hp > prevHp) {
      this.spawnHealEffect(this.player.x, this.player.y);
    }
    if (this.armor > prevArmor) {
      this.spawnArmorEffect(this.player.x, this.player.y);
    }
  }

  private syncVitalityHud(): void {
    const armorWasVisible = this.armorBar.visible;
    this.healthBar.setHp(this.hp);
    this.armorBar.setArmor(this.armor);
    if (this.armorBar.visible !== armorWasVisible) {
      this.layoutTopCenterHud();
    }
  }

  private heal(amount: number): void {
    const prevHp = this.hp;
    this.hp = Math.min(MAX_HP, this.hp + amount);
    if (this.hp === prevHp) return;

    this.syncVitalityHud();
    this.spawnHealEffect(this.player.x, this.player.y);
  }

  private spawnArmorEffect(x: number, y: number): void {
    const emitter = this.add.particles(x, y, 'particle', {
      speed: { min: 30, max: 80 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 400,
      tint: [0x4488ff, 0x88bbff, 0xffffff],
      quantity: 8,
      emitting: false,
    });
    emitter.explode(8);
    this.time.delayedCall(500, () => emitter.destroy());

    this.tweens.add({
      targets: this.armorBar,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 120,
      yoyo: true,
    });
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
    this.layoutTopCenterHud();
    this.cameras.main.flash(flashDuration, flashRgb.r, flashRgb.g, flashRgb.b, false);
  }

  private endScoreBoost(): void {
    this.starSpeedBoostMultiplier = 1;
    this.boostPointMeter.hide();
    this.layoutTopCenterHud();
    this.applyPostScoreBoostInvisibility();
  }

  /** Keep Boost under Boss HP, and weapon labels under the Boost score text. */
  private layoutTopCenterHud(): void {
    const bossVisible = this.bossHealthBar?.visible === true;
    const boostVisible = this.boostPointMeter?.visible === true;
    const armorOffset = this.armor > 0 ? ARMOR_BAR_STACK_OFFSET : 0;

    this.bossHealthBar.y = BOSS_HEALTH_BAR_Y + armorOffset;
    const boostY = (bossVisible ? BOOST_METER_Y_BELOW_BOSS : BOOST_METER_Y_DEFAULT) + armorOffset;
    this.boostPointMeter.y = boostY;

    if (!this.weaponHudText) return;
    if (boostVisible) {
      this.weaponHudText.y = boostY + BOOST_METER_LABEL_OFFSET + WEAPON_HUD_GAP_BELOW_BOOST;
    } else {
      this.weaponHudText.y = WEAPON_HUD_Y_DEFAULT;
    }
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
    if (payload.rockBreak) playRockBreakSfx();
    this.spawnExplosion(payload.x, payload.y, payload.explosionCount);
    this.tryAwardEnemyCoins(payload.x, payload.y);
    if (payload.spawnBlueMine) {
      this.spawnBlueMineAt(payload.x, payload.y);
    }
  }

  private checkSecretMilestones(): void {
    if (this.isGameOver || this.isPaused) return;

    if (this.gameMode === 'editor') {
      this.checkEditorMilestones();
      return;
    }

    if (this.gameMode === 'story' && !this.secretId) {
      for (const secret of getSecretsForWorld(this.worldId)) {
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
      if (secret && this.score >= secret.exitScoreThreshold && !this.warpPanelSpawned) {
        this.warpPanelSpawned = true;
        if (secret.exitPanel === 'finish') {
          this.spawnFinishPanel();
        } else {
          this.spawnWarpPanel();
        }
      }
    }
  }

  private checkEditorMilestones(): void {
    if (!this.editorArea) return;

    for (const finish of this.editorArea.misc.finishPanels) {
      if (this.score >= finish.scoreThreshold && !this.editorSpawnedMiscIds.has(finish.id)) {
        this.editorSpawnedMiscIds.add(finish.id);
        this.spawnFinishPanel();
      }
    }

    for (const warp of this.editorArea.misc.warpHoles) {
      if (this.score >= warp.scoreThreshold && !this.editorSpawnedMiscIds.has(warp.id)) {
        this.editorSpawnedMiscIds.add(warp.id);
        this.editorPendingWarpSubAreaId = warp.subAreaId;
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

  private spawnFinishPanel(): void {
    const { x, y } = FinishPanel.randomSpawnPosition();
    const panel = new FinishPanel(this, x, y);
    this.warpPanels.add(panel);

    const hint = this.add.text(GAME_WIDTH / 2, 90, 'FINISH PANEL ONLINE', {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '14px',
      fontStyle: '700',
      color: '#88ff44',
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
    else if (secretId === 'galilean') unlockSecretGalilean();
    else if (secretId === 'wise0855') unlockSecretWise0855();

    const secretWorldId = getSecretWorldId(secretId);
    const entryLevel = getSecretLevel(secretId)?.entryLevel ?? 1;

    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene', {
        mode: 'story',
        secretId,
        worldId: secretWorldId,
        level: entryLevel,
        continueMusic: true,
      });
    });
  }

  private onPlayerEnterWarpPanel(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    panelObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    if (this.isGameOver || this.isPaused) return;

    if (this.gameMode === 'editor') {
      const panel = panelObj as WarpPanel | FinishPanel;
      const isFinish = panel instanceof FinishPanel;
      panel.destroy();
      if (isFinish) {
        this.triggerVictory(true);
        return;
      }
      const subAreaId = this.editorPendingWarpSubAreaId;
      if (!subAreaId) return;
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameScene', {
          mode: 'editor',
          customSlotIndex: this.customSlotIndex,
          customSubAreaId: subAreaId,
          continueMusic: true,
          carryScore: this.score,
          level: 1,
          worldId: 'world1',
        });
      });
      return;
    }

    if (!this.secretId) return;
    const panel = panelObj as WarpPanel | FinishPanel;
    panel.destroy();
    this.triggerSecretVictory();
  }

  private triggerSecretVictory(): void {
    if (this.secretId === 'iss') {
      completeSecretIss();
    } else if (this.secretId === 'dawn') {
      completeSecretDawn();
    } else if (this.secretId === 'galilean') {
      completeSecretGalilean();
      const unlockLevelId = getSecretLevel('galilean')?.finishUnlockLevel ?? 15;
      unlockLevel(unlockLevelId);
    } else if (this.secretId === 'wise0855') {
      completeSecretWise0855();
      const unlockLevelId = getSecretLevel('wise0855')?.finishUnlockLevel ?? 32;
      unlockLevel(unlockLevelId);
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
    if (this.player.isGhostMode()) return;

    const comet = cometObj as Comet;
    if (!comet.active) return;

    if (this.player.isInvincible() || this.player.isBoosting()) {
      const { x, y, points, coinReward } = comet;
      comet.destroy();
      if (this.player.isBoosting()) this.addBoostScore(points);
      else this.addScore(points);
      if (coinReward > 0) this.awardCoins(coinReward, x, y);
      playRockBreakSfx();
      this.spawnExplosion(x, y, 8);
      return;
    }

    if (this.player.isShielded()) {
      const { x, y, points, coinReward } = comet;
      comet.destroy();
      this.addScore(points);
      if (coinReward > 0) this.awardCoins(coinReward, x, y);
      playRockBreakSfx();
      this.spawnExplosion(x, y, 8);
      this.player.absorbHit();
      return;
    }

    // Unpowered ram: no rock-break.
    comet.destroy();
    this.takeDamage(comet.bodyDamage);
  }

  private onPlayerHitMine(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    mineObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    if (this.isGameOver || this.isPaused || this.isChoosingWeapon) return;
    if (this.player.isGhostMode()) return;

    const mine = mineObj as Mine;
    if (!mine.active) return;

    if (mine.isKickMine) {
      // Always kick — including while invincible. Boost vacuum can still absorb separately.
      if (mine.applyPlayerPush(this.player.x, this.player.y)) {
        playHitSfx();
      }
      return;
    }

    // Gray / red / purple: still detonate while invincible, but never damage the player.
    if (this.player.isInvincible()) {
      this.triggerMineDetonation(mine, { skipPlayerDamage: true });
      return;
    }

    if (this.player.isBoosting()) {
      // Full detonation (explosion SFX, no hit SFX); boost score for the contact mine.
      this.triggerMineDetonation(mine, { skipPlayerDamage: true, useBoostScore: true });
      return;
    }

    this.triggerMineDetonation(mine, { contactFullDamage: true });
  }

  private onArmedKickMineHitHazard(
    mineObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    _hazardObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    if (this.isGameOver || this.isPaused) return;
    const mine = mineObj as Mine;
    if (!mine.active || !mine.canDetonateFromContact) return;
    this.triggerMineDetonation(mine);
  }

  private onArmedKickMineHitPlanet(
    mineObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    planetObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    if (this.isGameOver || this.isPaused) return;
    const mine = mineObj as Mine;
    const planet = planetObj as Planet;
    if (!mine.active || !planet.active || !mine.canDetonateFromContact) return;

    if (mine.isBlue) return;

    const damage = blastDamageForRadius(mine.blastRadius);
    const { x, y, points, coinReward } = planet;
    if (planet.takeDamage(damage)) {
      this.finalizeCelestialRewards(x, y, points, coinReward, 14);
    }
    this.triggerMineDetonation(mine);
  }

  private resolveCelestialPenetration(): void {
    const playerRadius = approximatePlayerRadius(this.player);

    if (shouldPlayerSolidCollideCelestial(this.player)) {
      this.planets.children.each((child) => {
        const planet = child as Planet;
        if (!planet.active) return true;
        resolveCirclePenetration(
          this.player,
          planet.x,
          planet.y,
          PLANET_BODY_RADIUS,
          playerRadius,
        );
        return true;
      });

      this.moons.children.each((child) => {
        const moon = child as Moon;
        if (!moon.active) return true;
        resolveCirclePenetration(
          this.player,
          moon.x,
          moon.y,
          MOON_BODY_RADIUS,
          playerRadius,
        );
        return true;
      });
    }

    this.mines.children.each((child) => {
      const mine = child as Mine;
      if (!mine.active || !shouldBlueMineSolidCollidePlanet(mine)) return true;
      this.planets.children.each((planetChild) => {
        const planet = planetChild as Planet;
        if (!planet.active) return true;
        resolveCirclePenetration(
          mine,
          planet.x,
          planet.y,
          PLANET_BODY_RADIUS,
          approximateMineRadius(mine),
        );
        return true;
      });
      return true;
    });
  }

  private onPlayerHitPlanet(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    planetObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    if (this.isGameOver || this.isPaused) return;
    if (this.player.isGhostMode()) return;

    const planet = planetObj as Planet;
    if (!planet.active) return;

    if (this.player.isInvincible() || this.player.isBoosting()) {
      const { x, y, points, coinReward } = planet;
      planet.destroy();
      if (this.player.isBoosting()) this.addBoostScore(points);
      else this.addScore(points);
      if (coinReward > 0) this.awardCoins(coinReward, x, y);
      playRockBreakSfx();
      this.spawnExplosion(x, y, 14);
    }
  }

  private onPlayerHitMoon(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    moonObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    if (this.isGameOver || this.isPaused) return;
    if (this.player.isGhostMode()) return;

    const moon = moonObj as Moon;
    if (!moon.active) return;

    if (this.player.isInvincible() || this.player.isBoosting()) {
      const { x, y, points, coinReward } = moon;
      moon.destroy();
      if (this.player.isBoosting()) this.addBoostScore(points);
      else this.addScore(points);
      if (coinReward > 0) this.awardCoins(coinReward, x, y);
      playRockBreakSfx();
      this.spawnExplosion(x, y, 8);
    }
  }

  private onPlayerHitBlackHole(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    _blackHoleObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    if (this.isGameOver || this.isPaused || this.isPlayerDying) return;
    if (this.player.isGhostMode()) return;
    if (this.player.isInvincible() || this.player.isBoosting()) return;
    this.triggerPlayerDeath();
  }

  private onMineHitMine(
    aObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    bObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    if (this.isGameOver || this.isPaused) return;
    const a = aObj as Mine;
    const b = bObj as Mine;
    if (!a.active || !b.active || a === b) return;

    // Kick-mine ↔ kick-mine: never explode. Unarmed pairs ignore each other; otherwise knock/arm.
    if (a.isKickMine && b.isKickMine) {
      if (a.isDormantBlue && b.isDormantBlue) return;

      let knocked = false;
      if (a.applyKnockFrom(b.x, b.y)) knocked = true;
      if (b.applyKnockFrom(a.x, a.y)) knocked = true;
      if (knocked) playHitSfx();
      return;
    }

    // Armed kick-mine detonates on non-kick mines; dormant kick-mines stay inert.
    if (a.canDetonateFromContact) {
      this.triggerMineDetonation(a);
      return;
    }
    if (b.canDetonateFromContact) {
      this.triggerMineDetonation(b);
    }
  }

  private onBulletHitMineCarrier(
    bulletObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    carrierObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    const bullet = bulletObj as Phaser.Physics.Arcade.Sprite;
    const carrier = carrierObj as MineCarrier;
    const damage = (bullet.getData('damage') as number) ?? 1;
    const { x, y, points } = carrier;
    if (carrier.takeDamage(damage)) {
      this.addScore(points);
      this.spawnExplosion(x, y, 8);
      this.tryAwardEnemyCoins(x, y);
      this.spawnBlueMineAt(x, y);
    }
    this.consumeBulletHit(bullet);
  }

  private onPlayerHitMineCarrier(
    _playerObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
    carrierObj: Phaser.Types.Physics.Arcade.GameObjectWithBody | Phaser.Tilemaps.Tile,
  ): void {
    if (this.isGameOver || this.isPaused || this.isChoosingWeapon) return;
    if (this.player.isGhostMode()) return;

    const carrier = carrierObj as MineCarrier;
    if (!carrier.active) return;

    const { x, y, points } = carrier;

    if (this.player.isInvincible() || this.player.isBoosting()) {
      carrier.destroy();
      if (this.player.isBoosting()) this.addBoostScore(points);
      else this.addScore(points);
      playExplosionSfx();
      this.spawnExplosion(x, y, 8);
      this.tryAwardEnemyCoins(x, y);
      this.spawnBlueMineAt(x, y);
      return;
    }

    const source: MineBlastSource = {
      x: carrier.x,
      y: carrier.y,
      blastRadius: carrier.blastRadius,
      playerDamage: carrier.playerDamage,
      damagesPlayer: carrier.damagesPlayer,
      canChainCarriers: carrier.canChainCarriers,
      points: carrier.points,
    };
    carrier.destroy();
    this.addScore(points);
    this.tryAwardEnemyCoins(x, y);
    this.runMineBlast(source, { contactFullDamage: true });
  }

  private spawnBlueMineAt(x: number, y: number): void {
    if (this.isGameOver) return;
    const mine = Mine.spawnAt(this, 'blue', x, y);
    this.mines.add(mine);
  }

  private triggerMineDetonation(
    mine: Mine,
    options?: {
      skipPlayerDamage?: boolean;
      contactFullDamage?: boolean;
      useBoostScore?: boolean;
    },
  ): void {
    if (!mine.active) return;
    const source: MineBlastSource = {
      x: mine.x,
      y: mine.y,
      blastRadius: mine.blastRadius,
      playerDamage: mine.playerDamage,
      damagesPlayer: mine.damagesPlayer,
      canChainCarriers: mine.canChainCarriers,
      points: mine.points,
    };
    const points = mine.points;
    mine.destroy();
    if (options?.useBoostScore) this.addBoostScore(points);
    else this.addScore(points);
    this.runMineBlast(source, options);
  }

  private spawnBlastRing(x: number, y: number, radius: number): void {
    const ring = this.add.graphics().setDepth(95);
    ring.lineStyle(3, 0xff6644, 0.95);
    ring.strokeCircle(x, y, 8);
    ring.lineStyle(2, 0xffaa66, 0.7);
    ring.strokeCircle(x, y, radius * 0.55);
    ring.lineStyle(1, 0xffcc88, 0.45);
    ring.strokeCircle(x, y, radius);
    this.tweens.add({
      targets: ring,
      alpha: 0,
      duration: 450,
      onComplete: () => ring.destroy(),
    });
  }

  private getMineBlastGroups() {
    return {
      asteroids: this.asteroids,
      comets: this.comets,
      planets: this.planets,
      moons: this.moons,
      mines: this.mines,
      mineCarriers: this.mineCarriers,
      spiderShips: this.spiderShips,
      seekerDrones: this.seekerDrones,
      kamikazeWasps: this.kamikazeWasps,
      plasmaTurrets: this.plasmaTurrets,
      flamethrowerShips: this.flamethrowerShips,
      storyEnemies: this.storyEnemies,
      bossShips: this.bossShips,
    };
  }

  private runMineBlast(
    source: MineBlastSource,
    options?: { skipPlayerDamage?: boolean; contactFullDamage?: boolean },
  ): void {
    detonateMineBlast(
      source,
      this.getMineBlastGroups(),
      {
        onPlayExplosionSfx: () => playExplosionSfx(),
        onSpawnBlastRing: (bx, by, radius) => this.spawnBlastRing(bx, by, radius),
        onSpawnExplosion: (ex, ey, count) => {
          // Visual-only; SFX handled by onPlayExplosionSfx (randomized explosion1–4).
          const emitter = this.add.particles(ex, ey, 'particle', {
            speed: { min: 60, max: 220 },
            scale: { start: 1.2, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 550,
            tint: [0xff6b35, 0xffcc00, 0xff4466, 0xffffff],
            quantity: count,
            emitting: false,
          });
          emitter.explode(count);
          this.time.delayedCall(650, () => emitter.destroy());
        },
        onDamagePlayer: (damage, meta) => {
          if (this.isGameOver || this.isPlayerDying) return;
          if (this.player.isGhostMode()) return;

          if (meta?.fromContact) {
            // Direct ram into mine/carrier: shield breaks; other immunities absorb.
            if (this.player.absorbHit()) return;
            this.takeDamage(damage);
            return;
          }

          // Blast radius (including chains): shield blocks without breaking.
          if (this.player.isDamageImmune()) return;
          if (this.player.absorbHit()) return;
          this.takeDamage(damage);
        },
        onAsteroidDestroyed: (ax, ay, points, coinReward, explosionCount) => {
          this.finalizeAsteroidRewards(ax, ay, points, coinReward, explosionCount);
        },
        onPlanetDestroyed: (px, py, points, coinReward, explosionCount) => {
          this.finalizeCelestialRewards(px, py, points, coinReward, explosionCount);
        },
        onMoonDestroyed: (mx, my, points, coinReward, explosionCount) => {
          this.finalizeCelestialRewards(mx, my, points, coinReward, explosionCount);
        },
        onEnemyDestroyed: (ex, ey, points, explosionCount) => {
          this.addScore(points);
          this.spawnExplosion(ex, ey, explosionCount);
          this.tryAwardEnemyCoins(ex, ey);
        },
        onBossDamaged: (bx, by, _damage, result) => {
          this.applyBossBlastDamage(bx, by, result);
        },
        onMineDestroyed: (_mx, _my, points) => {
          this.addScore(points);
        },
        onCarrierChained: (cx, cy, points) => {
          this.addScore(points);
          this.tryAwardEnemyCoins(cx, cy);
        },
      },
      {
        skipPlayerDamage: options?.skipPlayerDamage,
        contactFullDamage: options?.contactFullDamage,
        playerX: this.player.x,
        playerY: this.player.y,
      },
    );
  }

  /** Sync boss HUD / defeat when a mine, carrier, or death-bomb blast hits. */
  private applyBossBlastDamage(
    x: number,
    y: number,
    result: { killed: boolean; points: number; healthRemaining: number },
  ): void {
    if (result.killed) {
      this.bossHealthBar.hide();
      this.layoutTopCenterHud();
      this.addScore(result.points);
      this.spawnBigExplosion(x, y);
      this.lastDefeatedBossX = x;
      this.lastDefeatedBossY = y;
      this.onBossDefeated();
      return;
    }

    playHitSfx();
    this.spawnExplosion(x, y, 4);
    this.bossHealthRemaining = result.healthRemaining;
    this.bossHealthBar.setHp(result.healthRemaining);
  }

  private checkLootMilestones(): void {
    if (this.gameMode === 'editor' && this.editorArea && !this.editorArea.objects.lootBoxes.enabled) {
      return;
    }
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
    // Physics groups reset body defaults on add — re-apply drift after.
    box.setVelocity(
      Phaser.Math.Between(-18, 18),
      Phaser.Math.Between(20, 45),
    );
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
    this.syncPauseButtonInteractive();

    const choices = rollWeaponChoices(this.player.getOwnedWeaponIds(), 3);
    if (choices.length === 0) {
      this.closeWeaponSelect();
      return;
    }

    pauseMusic();

    const panel = createWeaponSelectPanel(this, 260, {
      weapons: choices,
      onSelect: (weaponId) => {
        this.player.addWeapon(weaponId);
        this.updateWeaponHud();
        this.closeWeaponSelect();
        this.cameras.main.flash(150, 0, 212, 255, false);
      },
    });
    this.weaponSelectPanel = panel.root;
  }

  private closeWeaponSelect(): void {
    this.isChoosingWeapon = false;
    this.weaponSelectPanel?.destroy();
    this.weaponSelectPanel = undefined;

    // Pause menu owns the frozen clock; otherwise always unstick scene time.
    // (Previously death/victory cleared isChoosingWeapon without unpausing time,
    // which softlocked the ship and left asteroids stuck on their red hit tint.)
    if (this.isPaused) {
      this.syncPauseButtonInteractive();
      return;
    }

    this.time.paused = false;
    if (!this.isGameOver && !this.isPlayerDying) {
      this.tweens.resumeAll();
      this.physics.resume();
      resumeMusic();
      this.trySpawnLootBox();
    }
    this.syncPauseButtonInteractive();
  }

  /** Tear down weapon UI and ensure scene timers can run (death / victory / softlock recovery). */
  private abortWeaponSelectForGameEnd(): void {
    this.isChoosingWeapon = false;
    this.weaponSelectPanel?.destroy();
    this.weaponSelectPanel = undefined;
    this.time.paused = false;
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
    this.applyPlayerDamage(amount, { mode: 'laser', fromX, fromY });
  }

  /** Continuous fire DoT — laser-style feedback, no teleport. Cadence gated by lastFireDamageAt. */
  private takeFireDamage(amount: number): void {
    if (this.isGameOver || this.isPaused || this.isChoosingWeapon) return;
    if (this.player.isGhostMode()) return;
    this.applyPlayerDamage(amount, { mode: 'fire' });
  }

  private playerOverlapsFire(): boolean {
    let inFire = false;
    this.firePlumes.children.each((child) => {
      const plume = child as FirePlume;
      if (plume.active && this.physics.overlap(this.player, plume)) {
        inFire = true;
      }
      return true;
    });
    return inFire;
  }

  private tickFireDamage(time: number): void {
    if (!this.playerOverlapsFire()) return;
    if (time < this.lastFireDamageAt + FIRE_TICK_MS) return;
    this.lastFireDamageAt = time;
    this.takeFireDamage(FIRE_DAMAGE);
  }

  private summonFirePlume(x: number, y: number, angle: number): void {
    FirePlume.spawnFrom(this, this.firePlumes, x, y, angle);
  }

  private takeDamage(amount: number): void {
    this.applyPlayerDamage(amount, { mode: 'collision' });
  }

  private applyPlayerDamage(
    amount: number,
    options: { mode: 'laser' | 'fire' | 'collision'; fromX?: number; fromY?: number },
  ): void {
    if (this.player.absorbHit()) return;

    const hpBefore = this.hp;
    const hadArmor = this.armor > 0;
    let remaining = amount;

    if (this.armor > 0) {
      const absorbed = Math.min(this.armor, remaining);
      this.armor -= absorbed;
      remaining -= absorbed;
    }

    if (remaining > 0) {
      this.hp = Math.max(0, this.hp - remaining);
    }

    this.syncVitalityHud();

    if (options.mode === 'laser') {
      this.cameras.main.shake(200, 0.005);
      this.cameras.main.flash(100, 255, 80, 80);
    } else if (options.mode === 'fire') {
      this.cameras.main.shake(160, 0.004);
      this.cameras.main.flash(80, 255, 120, 40);
    } else {
      this.cameras.main.shake(200, 0.01);
      this.cameras.main.flash(150, 255, 50, 50);
    }

    if (this.hp <= 0) {
      this.armor = 0;
      this.syncVitalityHud();
      this.triggerPlayerDeath();
      return;
    }

    playHitSfx();

    if (hpBefore > LOW_HP_ALARM_THRESHOLD && this.hp <= LOW_HP_ALARM_THRESHOLD) {
      playLowHpAlarmSfx();
    }

    if (hadArmor) return;

    if (options.mode === 'laser' && options.fromX !== undefined && options.fromY !== undefined) {
      const angle = Phaser.Math.Angle.Between(options.fromX, options.fromY, this.player.x, this.player.y);
      this.player.setVelocity(Math.cos(angle) * 120, Math.sin(angle) * 120);
      this.player.stopMove();
      this.isHitStunned = true;
      this.time.delayedCall(500, () => {
        if (this.isGameOver || this.isPlayerDying) return;
        this.isHitStunned = false;
        this.player.setVelocity(0, 0);
      });
      return;
    }

    if (options.mode === 'collision') {
      this.spawnExplosion(this.player.x, this.player.y, 20);
      this.player.setPosition(GAME_WIDTH / 2, GAME_HEIGHT - 120);
      this.player.setVelocity(0, 0);
      this.player.setAlpha(0.35);
      this.physics.pause();

      this.time.delayedCall(1000, () => {
        if (this.isGameOver || this.isPlayerDying) return;
        this.tweens.killTweensOf(this.player);
        this.player.setAlpha(1);
        if (this.isChoosingWeapon || this.isPaused) return;
        this.physics.resume();
      });
    }
  }

  private triggerPlayerDeath(): void {
    if (this.isPlayerDying) return;
    this.armor = 0;
    this.syncVitalityHud();
    this.isPlayerDying = true;
    this.isGameOver = true;
    this.isPaused = false;
    this.isHitStunned = false;
    this.abortWeaponSelectForGameEnd();
    this.pauseMenu?.destroy();
    this.pauseMenu = undefined;
    this.syncPauseButtonInteractive();

    const deathX = this.player.x;
    const deathY = this.player.y;

    if (this.deathBombArmed && getInventoryCount('deathBomb') > 0) {
      if (consumeInventoryItem('deathBomb')) {
        this.detonateDeathBombAt(deathX, deathY);
      }
      this.deathBombArmed = false;
    }

    this.physics.pause();
    const { explosionX, explosionY } = this.player.playFailSeparation();
    stopRocketEngineSfx();
    this.spawnBigExplosion(explosionX, explosionY);
    this.cameras.main.shake(400, 0.025);
    this.cameras.main.flash(250, 255, 120, 60);

    this.time.delayedCall(1200, () => this.triggerGameOver());
  }

  private triggerGameOver(): void {
    if (this.gameOverScreenShown) return;
    this.gameOverScreenShown = true;
    this.isGameOver = true;
    this.isPaused = false;
    this.abortWeaponSelectForGameEnd();
    this.pauseMenu?.destroy();
    this.pauseMenu = undefined;
    this.syncPauseButtonInteractive();
    pauseMusic();

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
        color: 0xffcc00,
        onClick: () => {
          this.bankRunCoins();
          restartGame(
            this,
            this.score,
            this.gameMode,
            this.storyLevel,
            this.worldId,
            this.secretId,
            this.customSlotIndex,
            this.customSubAreaId,
          );
        },
      },
    ];

    if (this.gameMode === 'editor') {
      buttons.push({
        label: 'EDITOR',
        y: 0,
        color: 0xff4466,
        onClick: () => goToEditorHub(this, this.customSlotIndex),
      });
    } else {
      if (this.gameMode === 'story') {
        buttons.push({
          label: 'LEVEL SELECT',
          y: 0,
          color: 0x8899bb,
          onClick: () => {
            this.bankRunCoins();
            goToLevelSelect(this, this.worldId);
          },
        });
      }

      buttons.push({
        label: 'QUIT',
        y: 0,
        color: 0xff4466,
        onClick: () => {
          this.bankRunCoins();
          goToTitleScreen(this);
        },
      });
    }

    const gameOverButtonY = this.gameMode === 'story'
      ? GAME_HEIGHT / 2 + 10
      : GAME_HEIGHT / 2 + 40;
    createMenuOverlay(this, 'GAME OVER', buttons, 200, gameOverButtonY);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 85, `Score: ${this.score}`, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '18px',
      color: '#8899bb',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);

    if (this.gameMode === 'editor') {
      // No coin banking in editor.
    } else if (bankedCoins > 0) {
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
      this.layoutTopCenterHud();
      this.triggerVictory();
      return;
    }

    if (this.gameMode === 'editor') {
      this.onEditorBossDefeated();
      return;
    }

    this.onSurvivalBossDefeated();
  }

  private onEditorBossDefeated(): void {
    this.bossActive = false;
    this.activeBossDefinition = null;
    this.bossChargeRing?.destroy();
    this.bossChargeRing = undefined;
    this.bossSkillText?.destroy();
    this.bossSkillText = undefined;
    this.bossHealthBar.hide();
    this.layoutTopCenterHud();

    this.awardCoins(this.lastBossCoinReward, this.lastDefeatedBossX, this.lastDefeatedBossY);
    this.editorBossesDefeated += 1;
    this.editorBossTimer = 0;

    const bossCount = this.editorArea?.enemies.bossCount ?? 0;
    if (bossCount > 0 && this.editorBossesDefeated >= bossCount) {
      this.triggerVictory(true);
    }
  }

  private onSurvivalBossDefeated(): void {
    this.bossActive = false;
    this.activeBossDefinition = null;
    this.bossChargeRing?.destroy();
    this.bossChargeRing = undefined;
    this.bossSkillText?.destroy();
    this.bossSkillText = undefined;
    this.bossHealthBar.hide();
    this.layoutTopCenterHud();

    this.awardCoins(this.lastBossCoinReward, this.lastDefeatedBossX, this.lastDefeatedBossY);
    this.survivalBossesDefeated += 1;
    this.survivalBossCooldownTimer = 0;
  }

  private triggerVictory(isSecretClear = false): void {
    this.isGameOver = true;
    this.isPaused = false;
    this.isHitStunned = false;
    this.abortWeaponSelectForGameEnd();
    this.pauseMenu?.destroy();
    this.pauseMenu = undefined;
    this.syncPauseButtonInteractive();
    pauseMusic();
    this.physics.pause();
    this.player.stopMove();

    if (this.gameMode === 'editor') {
      this.showEditorVictory();
      return;
    }

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
    } else if (isSecretClear && this.secretId === 'galilean') {
      victoryTitle = 'GALILEAN MOONS CLEAR!';
    } else if (isSecretClear && this.secretId === 'wise0855') {
      victoryTitle = 'WISE 0855-0714 CLEAR!';
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

    const victoryButtons: Array<{
      label: string;
      color?: number;
      onClick: () => void;
    }> = [];

    if (nextLevel !== null && nextLevel <= getMaxLevelSlots() && isLevelUnlocked(nextLevel)) {
      victoryButtons.push({
        label: `CONTINUE TO LEVEL ${nextLevel}`,
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
    }

    victoryButtons.push(
      {
        label: 'RESTART',
        color: 0xffcc00,
        onClick: () => {
          this.bankRunCoins();
          restartGame(this, this.score, this.gameMode, this.storyLevel, this.worldId, this.secretId);
        },
      },
      {
        label: 'LEVEL SELECT',
        color: 0x8899bb,
        onClick: () => {
          this.bankRunCoins();
          goToLevelSelect(this, this.worldId);
        },
      },
      {
        label: 'QUIT',
        color: 0xff4466,
        onClick: () => {
          this.bankRunCoins();
          goToTitleScreen(this);
        },
      },
    );

    let buttonY = victoryButtons.length >= 4
      ? GAME_HEIGHT / 2 - 40
      : GAME_HEIGHT / 2 - 10;
    for (const btn of victoryButtons) {
      const { container } = createMenuButton(this, {
        label: btn.label,
        y: buttonY,
        color: btn.color,
        onClick: btn.onClick,
      });
      container.setX(GAME_WIDTH / 2);
      root.add(container);
      buttonY += 58;
    }
  }

  private showEditorVictory(): void {
    this.cameras.main.flash(300, 255, 204, 0, false);

    const root = this.add.container(0, 0).setDepth(270).setScrollFactor(0);
    this.victoryMenu = root;
    root.add(this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8));

    const title = (this.editorLevel?.name ?? 'LEVEL').toUpperCase() + ' CLEAR!';
    root.add(this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, title, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '28px',
      fontStyle: '900',
      color: '#44ff88',
    }).setOrigin(0.5));

    root.add(this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 55, `Score: ${this.score}`, {
      fontFamily: 'Orbitron, sans-serif',
      fontSize: '16px',
      color: '#8899bb',
    }).setOrigin(0.5));

    let buttonY = GAME_HEIGHT / 2 + 10;
    for (const btn of [
      {
        label: 'RESTART',
        color: 0xffcc00,
        onClick: () => {
          restartGame(
            this,
            this.score,
            'editor',
            this.storyLevel,
            this.worldId,
            undefined,
            this.customSlotIndex,
            this.customSubAreaId,
          );
        },
      },
      {
        label: 'EDITOR',
        color: 0xff4466,
        onClick: () => goToEditorHub(this, this.customSlotIndex),
      },
    ]) {
      const { container } = createMenuButton(this, {
        label: btn.label,
        y: buttonY,
        color: btn.color,
        onClick: btn.onClick,
      });
      container.setX(GAME_WIDTH / 2);
      root.add(container);
      buttonY += 58;
    }
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
    this.layoutTopCenterHud();
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

    playBossAppearAlarmSfx();
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

    playBossAppearAlarmSfx();
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
      applyChillScaleToVelocity(boss, time);
      boss.updateSpecial(time);
      boss.tryFire(time, this.player.x, this.player.y);
      this.updateBossChargeRing(boss);
      return true;
    });
  }

  private updateStoryTimer(delta: number): void {
    if (this.gameMode === 'editor') {
      this.levelTimer += delta;
      return;
    }
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
    if (this.gameMode === 'editor' && !this.editorArea?.obstacles.asteroids.enabled) return;
    const config = Asteroid.randomConfig(forcedSize);

    const goldBonus = this.gameMode === 'survival' && hasSurvivalGoldSpawnBonus();

    if (
      this.countGoldAsteroidsOnScreen() < MAX_GOLD_ASTEROIDS_ON_SCREEN &&
      Math.random() < getGoldAsteroidSpawnChance(goldBonus)
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
    const label = this.gameMode === 'editor' ? `+${amount} BONUS` : `+${amount} COINS`;
    const text = this.add.text(x, y, label, {
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
    if (this.gameMode === 'editor') {
      // Coins convert to bonus score points — never banked as wallet coins.
      this.editorBonusPoints += amount;
      this.addScore(amount);
      this.updateCoinHud(true);
      if (x !== undefined && y !== undefined) {
        this.showCoinPickup(x, y, amount);
      }
      return;
    }
    this.runCoins += amount;
    this.updateCoinHud(true);
    if (x !== undefined && y !== undefined) {
      this.showCoinPickup(x, y, amount);
    }
  }

  private updateCoinHud(animate = false): void {
    if (this.gameMode === 'editor') {
      this.coinText.setText(`BONUS ${this.editorBonusPoints}`);
    } else {
      this.coinText.setText(formatRunCoinsLabel(this.runCoins));
    }
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
    if (this.gameMode === 'editor') {
      this.runCoins = 0;
      return 0;
    }
    const amount = this.runCoins;
    if (amount > 0) {
      addCoins(amount);
    }
    this.runCoins = 0;
    this.updateCoinHud();
    return amount;
  }

  private finalizeCelestialRewards(
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
    playRockBreakSfx();
    this.spawnExplosion(x, y, explosionCount);
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
    playRockBreakSfx();
    this.spawnExplosion(x, y, explosionCount);
  }

  private tryAwardEnemyCoins(x: number, y: number): void {
    const reward = rollEnemyCoinDrop();
    if (reward !== null) {
      this.awardCoins(reward, x, y);
    }
  }

  private countHealthPickupsOnScreen(): number {
    return this.hearts.countActive(true) + this.spaceDebris.countActive(true);
  }

  private spawnHeart(): void {
    if (this.isGameOver || this.isPaused) return;
    if (this.countHealthPickupsOnScreen() >= this.maxHeartsOnScreen) return;

    const { x, y } = Heart.randomSpawnPosition();
    const velocity = {
      x: Phaser.Math.Between(-18, 18),
      y: Phaser.Math.Between(20, 45),
    };

    if (rollSpaceDebrisInsteadOfHeart(this.difficultyTier)) {
      const debris = new SpaceDebris(this, x, y);
      this.spaceDebris.add(debris);
      debris.setVelocity(velocity.x, velocity.y);
      return;
    }

    const heart = new Heart(this, x, y);
    this.hearts.add(heart);
    heart.setVelocity(velocity.x, velocity.y);
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
    // Physics groups reset body defaults on add — re-apply drift after.
    pickup.setVelocity(
      Phaser.Math.Between(-18, 18),
      Phaser.Math.Between(20, 45),
    );
  }

  private spawnInvisibilityPickup(): void {
    if (this.isGameOver || this.isPaused || !isPowerUpOwned('invisibility')) return;
    if (this.invisibilityPickups.countActive(true) >= 1) return;

    const { x, y } = InvisibilityPickup.randomSpawnPosition();
    const pickup = new InvisibilityPickup(this, x, y);
    this.invisibilityPickups.add(pickup);
    pickup.setVelocity(
      Phaser.Math.Between(-18, 18),
      Phaser.Math.Between(20, 45),
    );
  }

  private spawnFuelTankPickup(): void {
    if (this.isGameOver || this.isPaused) return;
    if (this.gameMode !== 'survival' && this.gameMode !== 'editor') return;
    if (!isPowerUpOwned('fuelTank')) return;
    if (this.fuelTankPickups.countActive(true) >= 1) return;

    const { x, y } = FuelTankPickup.randomSpawnPosition();
    const pickup = new FuelTankPickup(this, x, y);
    this.fuelTankPickups.add(pickup);
    pickup.setVelocity(
      Phaser.Math.Between(-18, 18),
      Phaser.Math.Between(20, 45),
    );
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
    if (this.isGameOver || this.isPaused) return;
    if (this.gameMode !== 'survival' && this.gameMode !== 'editor') return;
    (pickupObj as FuelTankPickup).destroy();
    const level = getPowerUpLevel('fuelTank');
    const bonus = getFuelTankScoreCap(level);

    // Mid-boost pickup: add Fuel Tank cap to the denominator; keep current numerator.
    if (this.player.isBoosting() && this.player.extendBoostScoreCap(bonus)) {
      this.boostPointMeter.update(
        this.player.getBoostPointsEarned(),
        this.player.getBoostScoreCap(),
      );
      this.cameras.main.flash(100, 255, 204, 0, false);
      return;
    }

    this.startScoreBoost(bonus);
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
        planets: this.planets,
        moons: this.moons,
        mines: this.mines,
        mineCarriers: this.mineCarriers,
        spiderShips: this.spiderShips,
        seekerDrones: this.seekerDrones,
        kamikazeWasps: this.kamikazeWasps,
        plasmaTurrets: this.plasmaTurrets,
        flamethrowerShips: this.flamethrowerShips,
        storyEnemies: this.storyEnemies,
        bossShips: this.bossShips,
      },
      {
        onAsteroidDestroyed: (ax, ay, points, coinReward, explosionCount) => {
          this.finalizeAsteroidRewards(ax, ay, points, coinReward, explosionCount);
        },
        onPlanetDestroyed: (px, py, points, coinReward, explosionCount) => {
          this.finalizeCelestialRewards(px, py, points, coinReward, explosionCount);
        },
        onMoonDestroyed: (mx, my, points, coinReward, explosionCount) => {
          this.finalizeCelestialRewards(mx, my, points, coinReward, explosionCount);
        },
        onEnemyDestroyed: (ex, ey, points, explosionCount) => {
          this.addScore(points);
          this.spawnExplosion(ex, ey, explosionCount);
          this.tryAwardEnemyCoins(ex, ey);
        },
        onBossDamaged: (bx, by, _damage, result) => {
          this.applyBossBlastDamage(bx, by, result);
        },
        spawnBlastRing: (bx, by, radius) => {
          this.spawnBlastRing(bx, by, radius);
        },
        onMineTriggered: (mine) => {
          this.triggerMineDetonation(mine, { skipPlayerDamage: true });
        },
        onMineCarrierDefeated: (cx, cy, points) => {
          this.addScore(points);
          this.spawnExplosion(cx, cy, 8);
          this.tryAwardEnemyCoins(cx, cy);
          this.spawnBlueMineAt(cx, cy);
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

    // WISE is survival-enemies only (no story probes / bosses).
    if (this.secretId === 'wise0855') return;

    if (this.secretId === 'galilean') {
      const definition = pickGalileanSecretEnemy(this.getStoryEnemyCounts());
      if (!definition) return;
      this.addStoryEnemy(definition);
      return;
    }

    if (this.worldId === 'world3' && hasWorld3Variants(this.storyLevel)) {
      const definition = pickWorld3StoryEnemyVariant(this.storyLevel, this.getStoryEnemyCounts());
      if (!definition) return;
      this.addStoryEnemy(definition);
      return;
    }

    const definition = getStoryEnemyDefinition(this.worldId, this.storyLevel);
    const activeCount = this.storyEnemies.countActive(true);
    if (!canSpawnStoryEnemy(this.storyLevel, activeCount)) return;

    this.addStoryEnemy(definition);
  }

  private spawnSurvivalStoryEnemy(level: number): void {
    if (this.isGameOver || this.isPaused || this.isChoosingWeapon) return;

    const base = isGalileanMoonLevel(level)
      ? getGalileanMoonEnemyDefinition(level)
      : isWorld3VariantLevel(level)
        ? getWorld3VariantDefinition(level)
        : getStoryEnemyDefinition(this.worldId, level);
    const scaled = scaleStoryEnemyDefinition(base, this.score);
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
      mineCarrier: this.mineCarriers.countActive(true),
      flamethrower: this.flamethrowerShips.countActive(true),
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
      case 'mineCarrier': {
        const config = MineCarrier.randomConfig();
        const carrier = new MineCarrier(this, config);
        this.mineCarriers.add(carrier);
        carrier.setVelocity(config.velocityX, config.velocityY);
        break;
      }
      case 'flamethrower': {
        const config = FlamethrowerShip.randomConfig();
        const ship = new FlamethrowerShip(this, config, (px, py, angle) => {
          this.summonFirePlume(px, py, angle);
        });
        this.flamethrowerShips.add(ship);
        ship.setVelocity(config.velocityX, config.velocityY);
        break;
      }
    }
  }

  private updateEnemies(time: number, delta: number): void {
    const px = this.player.x;
    const py = this.player.y;

    this.storyEnemies.children.each((child) => {
      const enemy = child as StoryEnemy;
      enemy.updateEnemy(time, px, py, delta);
      applyChillScaleToVelocity(enemy, time);
      return true;
    });

    this.spiderShips.children.each((child) => {
      const spider = child as SpiderShip;
      spider.tryFire(time, px, py);
      applyChillDriftVelocity(spider, time);
      return true;
    });

    this.seekerDrones.children.each((child) => {
      const seeker = child as SeekerDrone;
      seeker.updateSeeker(px, py, delta);
      applyChillScaleToVelocity(seeker, time);
      return true;
    });

    this.kamikazeWasps.children.each((child) => {
      const wasp = child as KamikazeWasp;
      wasp.updateWasp(time, delta);
      // Wasp refreshes X zigzag each frame; Y is drift-only.
      applyChillAfterAi(wasp, time, { x: true, y: false });
      return true;
    });

    this.plasmaTurrets.children.each((child) => {
      const turret = child as PlasmaTurret;
      turret.tryFire(time, px, py);
      applyChillDriftVelocity(turret, time);
      return true;
    });

    this.flamethrowerShips.children.each((child) => {
      const ship = child as FlamethrowerShip;
      ship.tryFire(time, px, py);
      applyChillDriftVelocity(ship, time);
      return true;
    });

    this.firePlumes.children.each((child) => {
      (child as FirePlume).updatePlume(time, delta);
      return true;
    });

    this.mineCarriers.children.each((child) => {
      const carrier = child as MineCarrier;
      carrier.updateCarrier(px, py, delta);
      applyChillScaleToVelocity(carrier, time);
      return true;
    });

    this.mines.children.each((child) => {
      (child as Mine).updateMine(time, delta);
      return true;
    });
  }

  /** Visual burst only — no SFX (asteroids, comets, normal enemies). */
  private spawnExplosion(x: number, y: number, count: number): void {
    this.darknessOverlay?.addExplosionLight(x, y, LIGHT_RADIUS.explosion, 600);
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
    this.darknessOverlay?.addExplosionLight(x, y, LIGHT_RADIUS.bigExplosion, 1000);
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
    // Auto-fire pauses during Fuel Tank / Engine / Hyperdrive boost; resume when it ends.
    const shouldFire =
      (this.autoFire && !this.player.isBoosting())
      || this.spaceKey?.isDown
      || this.manualFireHeld;
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
      bullet.setData('chill', spawn.chill === true);
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

    this.spaceDebris.children.each((child) => {
      const debris = child as SpaceDebris;
      if (debris.isOffScreen()) debris.destroy();
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

    this.mineCarriers.children.each((child) => {
      const carrier = child as MineCarrier;
      if (carrier.isOffScreen()) carrier.destroy();
      return true;
    });

    this.flamethrowerShips.children.each((child) => {
      const ship = child as FlamethrowerShip;
      if (ship.isOffScreen()) ship.destroy();
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

    this.mines.children.each((child) => {
      const mine = child as Mine;
      if (mine.isOffScreen()) mine.destroy();
      return true;
    });

    this.planets.children.each((child) => {
      const planet = child as Planet;
      if (planet.isOffScreen()) planet.destroy();
      return true;
    });

    this.moons.children.each((child) => {
      const moon = child as Moon;
      if (moon.isOffScreen()) moon.destroy();
      return true;
    });

    this.blackHoles.children.each((child) => {
      const hole = child as BlackHole;
      if (hole.isOffScreen()) hole.destroy();
      return true;
    });

    this.gravityFields.children.each((child) => {
      const field = child as GravityField;
      if (!field.active || field.isOffScreen()) field.destroy();
      return true;
    });
  }

  private shouldSpawnPlanetsAndMoons(): boolean {
    if (this.gameMode === 'editor') {
      const o = this.editorArea?.obstacles;
      if (!o) return false;
      return o.planets.enabled || o.moons.enabled;
    }
    if (this.secretId === 'galilean' || this.secretId === 'wise0855') return true;
    if (this.secretId) return false;
    if (this.gameMode === 'survival') {
      return this.worldId === 'world2' || this.worldId === 'world3';
    }
    return false;
  }

  private shouldSpawnCelestialContent(): boolean {
    return this.shouldSpawnPlanetsAndMoons();
  }

  private shouldSpawnBrownMines(): boolean {
    if (this.gameMode === 'editor') {
      return this.editorArea?.obstacles.brownMines.enabled === true;
    }
    if (this.secretId === 'galilean' || this.secretId === 'wise0855') return true;
    if (this.secretId) return false;
    if (this.gameMode === 'survival') {
      return this.worldId === 'world2' || this.worldId === 'world3';
    }
    return false;
  }

  private countPlanetsOnScreen(): number {
    return this.planets.countActive(true);
  }

  private countMoonsOnScreen(): number {
    return this.moons.countActive(true);
  }

  private countBlackHolesOnScreen(): number {
    return this.blackHoles.countActive(true);
  }

  private spawnPlanet(): void {
    if (this.isGameOver || this.isPaused) return;
    if (this.gameMode === 'editor' && !this.editorArea?.obstacles.planets.enabled) return;
    if (this.gameMode !== 'editor' && !this.shouldSpawnCelestialContent()) return;
    if (this.countPlanetsOnScreen() >= MAX_PLANETS_ON_SCREEN) return;

    const config = Planet.randomConfig();
    const goldBonus = this.gameMode === 'survival' && hasSurvivalGoldSpawnBonus();
    if (Math.random() < getGoldPlanetSpawnChance(goldBonus)) {
      config.variant = 'gold';
    }

    const planet = new Planet(this, config);
    this.planets.add(planet);
    planet.setVelocity(config.velocityX, config.velocityY);
  }

  private spawnMoon(): void {
    if (this.isGameOver || this.isPaused) return;
    if (this.gameMode === 'editor' && !this.editorArea?.obstacles.moons.enabled) return;
    if (this.gameMode !== 'editor' && !this.shouldSpawnCelestialContent()) return;
    if (this.countMoonsOnScreen() >= MAX_MOONS_ON_SCREEN) return;

    const config = Moon.randomConfig();
    const goldBonus = this.gameMode === 'survival' && hasSurvivalGoldSpawnBonus();
    if (Math.random() < getGoldMoonSpawnChance(goldBonus)) {
      config.variant = 'gold';
    }

    const moon = new Moon(this, config);
    this.moons.add(moon);
    moon.setVelocity(config.velocityX, config.velocityY);
  }

  private spawnBlackHole(): void {
    if (this.isGameOver || this.isPaused) return;
    if (this.gameMode !== 'editor' || !this.editorArea?.obstacles.blackHoles.enabled) return;
    if (this.countBlackHolesOnScreen() >= MAX_BLACK_HOLES_ON_SCREEN) return;

    const config = BlackHole.randomConfig();
    const hole = new BlackHole(this, config);
    this.blackHoles.add(hole);
  }

  private countGravityFieldsOfSize(size: GravityFieldSize): number {
    let count = 0;
    this.gravityFields.children.each((child) => {
      if ((child as GravityField).active && (child as GravityField).size === size) count += 1;
      return true;
    });
    return count;
  }

  private spawnGravityField(size: GravityFieldSize): void {
    if (this.isGameOver || this.isPaused || this.gameMode !== 'editor') return;
    const rule = size === 'small'
      ? this.editorArea?.obstacles.smallGravityFields
      : this.editorArea?.obstacles.largeGravityFields;
    if (!rule?.enabled) return;

    const maxOnScreen = size === 'small' ? 4 : 3;
    if (this.countGravityFieldsOfSize(size) >= maxOnScreen) return;

    const field = new GravityField(this, GravityField.randomConfig(size));
    this.gravityFields.add(field);
  }

  private collectGravitySources(): GravitySource[] {
    const sources: GravitySource[] = [];
    this.planets.children.each((child) => {
      const planet = child as Planet;
      if (planet.active) sources.push(planet);
      return true;
    });
    this.moons.children.each((child) => {
      const moon = child as Moon;
      if (moon.active) sources.push(moon);
      return true;
    });
    this.blackHoles.children.each((child) => {
      const hole = child as BlackHole;
      if (hole.active) sources.push(hole);
      return true;
    });
    this.gravityFields.children.each((child) => {
      const field = child as GravityField;
      if (field.active) sources.push(field);
      return true;
    });
    return sources;
  }

  private shouldSpawnComets(): boolean {
    if (this.gameMode === 'editor') {
      return (this.editorArea?.obstacles.comets.enabled === true) && canUseComets();
    }
    // WISE (World 3) has comets; ISS / Dawn / Galilean do not.
    if (this.secretId === 'wise0855') return true;
    if (this.secretId) return false;
    if (getWorldNumber(this.worldId) >= 3) return true;
    if (this.gameMode === 'story') {
      // Saturn (L12), Titan, Uranus, Neptune, then Kuiper Belt+ (L16+).
      return this.storyLevel >= 12;
    }
    return this.worldId === 'world2';
  }

  /** Kuiper Belt+ story levels and World 3+ get denser comet traffic. */
  private hasFrequentComets(): boolean {
    // WISE is World 3 → frequent; other secrets stay comet-free via shouldSpawnComets.
    if (this.secretId === 'wise0855') return true;
    if (this.secretId) return false;
    if (getWorldNumber(this.worldId) >= 3) return true;
    if (this.gameMode === 'story') return this.storyLevel >= 16;
    return false;
  }

  private countCometsOnScreen(): number {
    return this.comets.countActive(true);
  }

  private spawnComet(): void {
    if (this.isGameOver || this.isPaused || !this.shouldSpawnComets()) return;
    if (this.countCometsOnScreen() >= MAX_COMETS_ON_SCREEN) return;

    let variant: 'normal' | 'gold' = 'normal';
    if (this.gameMode === 'editor') {
      variant = Math.random() < 0.15 ? 'gold' : 'normal';
    } else {
      const goldBonus = this.gameMode === 'survival' && hasSurvivalGoldSpawnBonus();
      const frequent = this.hasFrequentComets();
      if (Math.random() < getGoldCometSpawnChance(goldBonus, frequent)) {
        variant = 'gold';
      } else if (Math.random() < getCometSpawnChance(frequent)) {
        variant = 'normal';
      } else {
        return;
      }
    }

    const config = Comet.randomConfig(variant);
    const comet = new Comet(this, config);
    this.comets.add(comet);
    comet.setVelocity(config.velocityX, config.velocityY);
  }

  private shouldSpawnMines(): boolean {
    if (this.gameMode === 'editor') {
      const o = this.editorArea?.obstacles;
      if (!o) return false;
      return o.blueMines.enabled
        || o.brownMines.enabled
        || o.grayMines.enabled
        || (o.redMines.enabled && canUseRedMines())
        || (o.purpleMines.enabled && canUsePurpleMines());
    }
    // Gray/Blue also appear in ISS / Dawn / Galilean / WISE secrets and W1–W2 Survival.
    if (
      this.secretId === 'iss'
      || this.secretId === 'dawn'
      || this.secretId === 'galilean'
      || this.secretId === 'wise0855'
    ) {
      return true;
    }
    if (this.secretId) return false;

    if (this.gameMode === 'survival') {
      return this.worldId === 'world1'
        || this.worldId === 'world2'
        || this.worldId === 'world3';
    }

    // Story: World 3 L21+ (gray/blue). Red/purple stay Survival W3-only.
    return this.worldId === 'world3' && this.storyLevel >= 21;
  }

  private pickMineVariant(): MineVariant | null {
    if (!this.shouldSpawnMines()) return null;

    // WISE: blue / gray / red / brown from the start (no purple).
    if (this.secretId === 'wise0855') {
      const variants: MineVariant[] = ['gray', 'blue', 'brown', 'red'];
      return variants[Phaser.Math.Between(0, variants.length - 1)];
    }

    if (this.secretId === 'galilean') {
      const variants: MineVariant[] = ['gray', 'blue', 'brown'];
      return variants[Phaser.Math.Between(0, variants.length - 1)];
    }

    const canSpawnAdvanced =
      this.gameMode === 'survival'
      && this.worldId === 'world3'
      && !this.secretId;

    if (canSpawnAdvanced) {
      const variants: MineVariant[] = ['gray', 'blue'];
      if (this.shouldSpawnBrownMines()) variants.push('brown');
      if (this.score >= 6000) variants.push('red');
      if (this.score >= 9000) variants.push('purple');
      return variants[Phaser.Math.Between(0, variants.length - 1)];
    }

    if (this.gameMode === 'survival' && this.worldId === 'world2' && !this.secretId) {
      const variants: MineVariant[] = ['gray', 'blue', 'brown'];
      return variants[Phaser.Math.Between(0, variants.length - 1)];
    }

    return Math.random() < 0.5 ? 'gray' : 'blue';
  }

  /** Story L27+ gate for mine carriers; WISE secret bypasses the level gate. */
  private getEnemyStoryLevelGate(): number | undefined {
    return this.secretId === 'wise0855' ? undefined : this.storyLevel;
  }

  /** Gray / red / purple only — kick-mines do not count toward the mine limit. */
  private countLimitedMinesOnScreen(): number {
    let count = 0;
    this.mines.children.each((child) => {
      const mine = child as Mine;
      if (mine.active && !mine.isKickMine) count += 1;
      return true;
    });
    return count;
  }

  private countMinesOfVariant(variant: MineVariant): number {
    let count = 0;
    this.mines.children.each((child) => {
      const mine = child as Mine;
      if (mine.active && mine.variant === variant) count += 1;
      return true;
    });
    return count;
  }

  /** Editor play: scale total cap by enabled limited (non-blue) mine colors. */
  private getEditorMineCap(): number {
    const o = this.editorArea?.obstacles;
    if (!o) return MAX_MINES_ON_SCREEN;
    let enabled = 0;
    if (o.grayMines.enabled) enabled += 1;
    if (o.redMines.enabled && canUseRedMines()) enabled += 1;
    if (o.purpleMines.enabled && canUsePurpleMines()) enabled += 1;
    if (enabled === 0) return MAX_MINES_ON_SCREEN;
    return Math.max(MAX_MINES_ON_SCREEN, enabled * MAX_MINES_PER_VARIANT_EDITOR);
  }

  private spawnMine(): void {
    if (this.isGameOver || this.isPaused || !this.shouldSpawnMines()) return;
    if (Math.random() >= MINE_SPAWN_CHANCE) return;

    const variant = this.pickMineVariant();
    if (!variant) return;
    this.spawnMineOfVariant(variant);
  }

  /** @returns true if a mine was spawned. */
  private spawnMineOfVariant(variant: MineVariant): boolean {
    if (this.isGameOver || this.isPaused) return false;
    if (variant === 'red' && !canUseRedMines()) return false;
    if (variant === 'purple' && !canUsePurpleMines()) return false;

    // Kick-mines ignore the on-screen mine limit entirely.
    if (variant !== 'blue' && variant !== 'brown') {
      if (this.gameMode === 'editor') {
        if (this.countMinesOfVariant(variant) >= MAX_MINES_PER_VARIANT_EDITOR) return false;
        if (this.countLimitedMinesOnScreen() >= this.getEditorMineCap()) return false;
      } else if (this.countLimitedMinesOnScreen() >= MAX_MINES_ON_SCREEN) {
        return false;
      }
    }

    const config = Mine.randomConfig(variant);
    const mine = new Mine(this, config);
    this.mines.add(mine);
    mine.setVelocity(config.velocityX, config.velocityY);
    return true;
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

  private collectDarknessLights(): { circles: CircleLight[]; beams: BeamLight[] } {
    const circles: CircleLight[] = [];
    const beams: BeamLight[] = [];

    circles.push({
      x: this.player.x,
      y: this.player.y,
      radius: LIGHT_RADIUS.playerSpotlight,
      intensity: 1,
    });
    const beamRotation = this.player.rotation - Math.PI / 2;
    beams.push({
      x: this.player.x,
      y: this.player.y,
      rotation: beamRotation,
      length: beamLengthToScreenEdge(this.player.x, this.player.y, beamRotation),
      halfWidth: LIGHT_RADIUS.playerBeamHalfWidth,
      intensity: 0.9,
    });

    // Trail glow: sampled thruster particles (capped) so obstruction stays cheap.
    for (const light of this.player.collectTrailDarknessLights(LIGHT_RADIUS.trail)) {
      circles.push(light);
    }

    const pushActive = (
      group: Phaser.Physics.Arcade.Group,
      radius: number,
      intensity = 0.7,
      filter?: (sprite: Phaser.Physics.Arcade.Sprite) => boolean,
    ): void => {
      group.children.each((child) => {
        const sprite = child as Phaser.Physics.Arcade.Sprite;
        if (!sprite.active) return true;
        if (filter && !filter(sprite)) return true;
        circles.push({ x: sprite.x, y: sprite.y, radius, intensity });
        return true;
      });
    };

    const pushEnemyShipLights = (
      group: Phaser.Physics.Arcade.Group,
      spotlightRadius: number,
      spotlightIntensity: number,
      beamHalfWidth: number,
      beamIntensity: number,
    ): void => {
      group.children.each((child) => {
        const sprite = child as Phaser.Physics.Arcade.Sprite;
        if (!sprite.active) return true;

        circles.push({
          x: sprite.x,
          y: sprite.y,
          radius: spotlightRadius,
          intensity: spotlightIntensity,
        });

        const body = sprite.body as Phaser.Physics.Arcade.Body | null;
        const vx = body?.velocity.x ?? 0;
        const vy = body?.velocity.y ?? 0;
        const beamRotation = (vx * vx + vy * vy) > 16
          ? Math.atan2(vy, vx)
          : Math.atan2(this.player.y - sprite.y, this.player.x - sprite.x);

        beams.push({
          x: sprite.x,
          y: sprite.y,
          rotation: beamRotation,
          length: beamLengthToScreenEdge(sprite.x, sprite.y, beamRotation),
          halfWidth: beamHalfWidth,
          intensity: beamIntensity,
        });
        return true;
      });
    };

    pushActive(this.warpPanels, LIGHT_RADIUS.panel, 1);
    pushEnemyShipLights(
      this.bossShips,
      LIGHT_RADIUS.boss,
      1,
      LIGHT_RADIUS.bossBeamHalfWidth,
      0.75,
    );
    pushEnemyShipLights(
      this.spiderShips,
      LIGHT_RADIUS.enemySpotlight,
      0.65,
      LIGHT_RADIUS.enemyBeamHalfWidth,
      0.5,
    );
    pushEnemyShipLights(
      this.seekerDrones,
      LIGHT_RADIUS.enemySpotlight,
      0.65,
      LIGHT_RADIUS.enemyBeamHalfWidth,
      0.5,
    );
    pushEnemyShipLights(
      this.kamikazeWasps,
      LIGHT_RADIUS.enemySpotlight,
      0.65,
      LIGHT_RADIUS.enemyBeamHalfWidth,
      0.5,
    );
    pushEnemyShipLights(
      this.plasmaTurrets,
      LIGHT_RADIUS.enemySpotlight,
      0.65,
      LIGHT_RADIUS.enemyBeamHalfWidth,
      0.5,
    );
    pushEnemyShipLights(
      this.mineCarriers,
      LIGHT_RADIUS.enemySpotlight,
      0.65,
      LIGHT_RADIUS.enemyBeamHalfWidth,
      0.5,
    );
    pushEnemyShipLights(
      this.flamethrowerShips,
      LIGHT_RADIUS.enemySpotlight,
      0.65,
      LIGHT_RADIUS.enemyBeamHalfWidth,
      0.5,
    );
    pushEnemyShipLights(
      this.storyEnemies,
      LIGHT_RADIUS.enemySpotlight,
      0.65,
      LIGHT_RADIUS.enemyBeamHalfWidth,
      0.5,
    );
    pushActive(this.firePlumes, LIGHT_RADIUS.firePlume, 0.9);
    pushActive(this.mines, LIGHT_RADIUS.mine, 0.65);
    pushActive(this.comets, LIGHT_RADIUS.faint, 0.7);
    pushActive(this.hearts, LIGHT_RADIUS.faint, 0.7);
    pushActive(this.spaceDebris, LIGHT_RADIUS.faint, 0.7);
    pushActive(this.powerStars, LIGHT_RADIUS.faint, 0.75);
    pushActive(this.lootBoxes, LIGHT_RADIUS.faint, 0.7);
    pushActive(this.shieldPickups, LIGHT_RADIUS.faint, 0.7);
    pushActive(this.invisibilityPickups, LIGHT_RADIUS.faint, 0.7);
    pushActive(this.fuelTankPickups, LIGHT_RADIUS.faint, 0.7);
    pushActive(this.asteroids, LIGHT_RADIUS.faint, 0.7, (sprite) => (sprite as Asteroid).isGold);
    pushActive(this.planets, LIGHT_RADIUS.faint, 0.55, (sprite) => !(sprite as Planet).isGold);
    pushActive(this.planets, LIGHT_RADIUS.enemySpotlight, 0.8, (sprite) => (sprite as Planet).isGold);
    pushActive(this.moons, LIGHT_RADIUS.faint, 0.55, (sprite) => !(sprite as Moon).isGold);
    pushActive(this.moons, LIGHT_RADIUS.enemySpotlight, 0.8, (sprite) => (sprite as Moon).isGold);
    pushActive(this.blackHoles, LIGHT_RADIUS.mine, 0.7);

    this.bullets.children.each((child) => {
      const bullet = child as Phaser.Physics.Arcade.Sprite;
      if (!bullet.active) return true;
      circles.push({
        x: bullet.x,
        y: bullet.y,
        radius: LIGHT_RADIUS.laser,
        intensity: 0.45,
      });
      return true;
    });

    this.enemyLasers.children.each((child) => {
      const laser = child as Phaser.Physics.Arcade.Sprite;
      if (!laser.active) return true;
      circles.push({
        x: laser.x,
        y: laser.y,
        radius: LIGHT_RADIUS.laser,
        intensity: 0.4,
      });
      return true;
    });

    return { circles, beams };
  }

  private updateDarknessOverlay(): void {
    if (!this.darknessOverlay) return;

    const fullLight = this.player.isInvincible() || this.player.isBoosting();
    this.darknessOverlay.setFullIlluminate(fullLight);
    if (fullLight) {
      this.darknessOverlay.redraw([], []);
      return;
    }

    const { circles, beams } = this.collectDarknessLights();
    this.darknessOverlay.redraw(circles, beams);
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
          planets: this.planets,
          moons: this.moons,
          mines: this.mines,
          mineCarriers: this.mineCarriers,
          spiderShips: this.spiderShips,
          seekerDrones: this.seekerDrones,
          kamikazeWasps: this.kamikazeWasps,
          plasmaTurrets: this.plasmaTurrets,
          flamethrowerShips: this.flamethrowerShips,
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
      applyGravitySources(this.player, this.collectGravitySources(), delta);
      this.resolveCelestialPenetration();
    } else {
      stopRocketEngineSfx();
    }

    this.syncRocketEngineSound();
    this.player.updateThruster(time, delta);
    if (!this.isHitStunned) {
      this.player.clampToBounds();
    }
    this.updateDarknessOverlay();
    this.updateEnemies(time, delta);
    this.gravityFields.children.each((child) => {
      (child as GravityField).updateField(delta);
      return true;
    });
    this.tickFireDamage(time);
    if (this.bossActive) {
      this.updateBoss(time);
    }
    this.updateStoryTimer(delta);
    this.updateSurvivalBossSpawn(delta);
    this.cleanupOffscreen();

    if (this.gameMode === 'editor') {
      this.updateEditorSpawns(delta);
      return;
    }

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
      if (this.shouldSpawnMines()) {
        this.spawnMine();
      }
    }

    this.cometSpawnTimer += delta;
    if (this.shouldSpawnComets() && this.cometSpawnTimer >= getCometSpawnIntervalMs(this.hasFrequentComets())) {
      this.cometSpawnTimer = 0;
      this.spawnComet();
    }

    this.mineSpawnTimer += delta;
    if (this.shouldSpawnMines() && this.mineSpawnTimer >= 4000) {
      this.mineSpawnTimer = 0;
      this.spawnMine();
    }

    if (this.shouldSpawnCelestialContent()) {
      this.planetSpawnTimer += delta;
      if (this.planetSpawnTimer >= PLANET_SPAWN_INTERVAL_MS) {
        this.planetSpawnTimer = 0;
        if (Math.random() < PLANET_SPAWN_CHANCE) this.spawnPlanet();
      }

      this.moonSpawnTimer += delta;
      if (this.moonSpawnTimer >= MOON_SPAWN_INTERVAL_MS) {
        this.moonSpawnTimer = 0;
        if (Math.random() < MOON_SPAWN_CHANCE) this.spawnMoon();
      }
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
    if (this.gameMode === 'survival') {
      // Slower spawns while Fuel Tank / Engine / Hyperdrive boost is active.
      const fuelInterval = this.player.isBoosting()
        ? FUEL_TANK_SPAWN_INTERVAL_BOOST_MS
        : FUEL_TANK_SPAWN_INTERVAL_MS;
      if (this.fuelTankSpawnTimer >= fuelInterval) {
        this.fuelTankSpawnTimer = 0;
        this.spawnFuelTankPickup();
      }
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
      const enemyLevelGate = this.getEnemyStoryLevelGate();
      this.enemySpawnTimer += delta;
      if (!this.bossActive) {
        const enemyInterval = getEnemySpawnInterval(this.score, this.worldId, enemyLevelGate);
        if (this.enemySpawnTimer >= enemyInterval) {
          this.enemySpawnTimer = 0;
          const kind = pickEnemyToSpawn(
            this.score,
            this.getEnemyCounts(),
            false,
            this.worldId,
            enemyLevelGate,
          );
          if (kind) this.spawnEnemy(kind);
        }
      }
    } else {
      this.enemySpawnTimer += delta;
      if (!this.bossActive) {
        const enemyInterval = getEnemySpawnInterval(this.score, this.worldId);
        if (this.enemySpawnTimer >= enemyInterval) {
          this.enemySpawnTimer = 0;
          const kind = pickEnemyToSpawn(this.score, this.getEnemyCounts(), true, this.worldId);
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

  private updateEditorSpawns(delta: number): void {
    const area = this.editorArea;
    if (!area) return;

    const elapsed = this.levelTimer;

    // Asteroids
    const rock = area.obstacles.asteroids;
    if (rock.enabled) {
      this.spawnTimer += delta;
      const interval = getEffectiveIntervalMs(rock, this.score, elapsed);
      if (this.spawnTimer >= interval) {
        this.spawnTimer = 0;
        this.spawnCount += 1;
        this.spawnAsteroid(this.spawnCount % 4 === 0 ? 'lg' : undefined);
      }
    }

    // Comets
    const cometRule = area.obstacles.comets;
    if (cometRule.enabled && canUseComets()) {
      this.cometSpawnTimer += delta;
      const interval = getEffectiveIntervalMs(cometRule, this.score, elapsed);
      if (this.cometSpawnTimer >= interval) {
        this.cometSpawnTimer = 0;
        if (Math.random() < cometRule.chance) this.spawnComet();
      }
    }

    // Mines — each color has its own spawn rule / budget so groups don't starve each other.
    const tickMineRule = (
      rule: typeof area.obstacles.blueMines,
      variant: MineVariant,
      allowed: boolean,
    ) => {
      if (!rule.enabled || !allowed) return;
      const key = variant;
      this.editorMineTimers[key] = (this.editorMineTimers[key] ?? 0) + delta;
      const interval = getEffectiveIntervalMs(rule, this.score, elapsed);

      // Cap-blocked: chance already accepted — retry without re-rolling.
      if (this.editorMinePending[key]) {
        if (this.spawnMineOfVariant(variant)) {
          this.editorMinePending[key] = false;
          this.editorMineTimers[key] = 0;
        }
        return;
      }

      if (this.editorMineTimers[key] < interval) return;

      // Chance miss: wait a full interval. Cap miss: pending until a slot frees up.
      if (Math.random() >= rule.chance) {
        this.editorMineTimers[key] = 0;
        return;
      }
      if (this.spawnMineOfVariant(variant)) {
        this.editorMineTimers[key] = 0;
      } else {
        this.editorMinePending[key] = true;
      }
    };
    tickMineRule(area.obstacles.blueMines, 'blue', true);
    tickMineRule(area.obstacles.brownMines, 'brown', true);
    tickMineRule(area.obstacles.grayMines, 'gray', true);
    tickMineRule(area.obstacles.redMines, 'red', canUseRedMines());
    tickMineRule(area.obstacles.purpleMines, 'purple', canUsePurpleMines());

    const tickCelestialRule = (
      rule: typeof area.obstacles.planets,
      spawn: () => void,
      timerKey: 'planetSpawnTimer' | 'moonSpawnTimer',
    ) => {
      if (!rule.enabled) return;
      this[timerKey] += delta;
      const interval = getEffectiveIntervalMs(rule, this.score, elapsed);
      if (this[timerKey] >= interval) {
        this[timerKey] = 0;
        if (Math.random() < rule.chance) spawn();
      }
    };

    tickCelestialRule(area.obstacles.planets, () => this.spawnPlanet(), 'planetSpawnTimer');
    tickCelestialRule(area.obstacles.moons, () => this.spawnMoon(), 'moonSpawnTimer');

    const blackHoleRule = area.obstacles.blackHoles;
    if (blackHoleRule.enabled) {
      this.editorBlackHoleTimer = (this.editorBlackHoleTimer ?? 0) + delta;
      const interval = getEffectiveIntervalMs(blackHoleRule, this.score, elapsed);
      if (this.editorBlackHoleTimer >= interval) {
        this.editorBlackHoleTimer = 0;
        if (Math.random() < blackHoleRule.chance) this.spawnBlackHole();
      }
    }

    const tickGravityFieldRule = (
      rule: typeof area.obstacles.smallGravityFields,
      size: GravityFieldSize,
      timerKey: 'editorSmallGravityTimer' | 'editorLargeGravityTimer',
    ) => {
      if (!rule.enabled) return;
      this[timerKey] += delta;
      const interval = getEffectiveIntervalMs(rule, this.score, elapsed);
      if (this[timerKey] >= interval) {
        this[timerKey] = 0;
        if (Math.random() < rule.chance) this.spawnGravityField(size);
      }
    };

    tickGravityFieldRule(area.obstacles.smallGravityFields, 'small', 'editorSmallGravityTimer');
    tickGravityFieldRule(area.obstacles.largeGravityFields, 'large', 'editorLargeGravityTimer');

    // Hearts / power-ups
    const tickPickup = (
      rule: typeof area.objects.hearts,
      timerKey: 'heartSpawnTimer' | 'powerStarSpawnTimer' | 'shieldSpawnTimer' | 'invisibilitySpawnTimer' | 'fuelTankSpawnTimer',
      spawn: () => void,
    ) => {
      if (!rule.enabled) return;
      this[timerKey] += delta;
      const interval = getEffectiveIntervalMs(rule, this.score, elapsed);
      if (this[timerKey] >= interval) {
        this[timerKey] = 0;
        spawn();
      }
    };

    tickPickup(area.objects.hearts, 'heartSpawnTimer', () => this.spawnHeart());
    tickPickup(area.objects.powerStar, 'powerStarSpawnTimer', () => this.spawnPowerStar());
    if (isPowerUpOwned('shield')) {
      tickPickup(area.objects.shield, 'shieldSpawnTimer', () => this.spawnShieldPickup());
    }
    if (isPowerUpOwned('invisibility')) {
      tickPickup(area.objects.invisibility, 'invisibilitySpawnTimer', () => this.spawnInvisibilityPickup());
    }
    if (isPowerUpOwned('fuelTank') && area.enemies.bossCount === 0) {
      tickPickup(area.objects.fuelTank, 'fuelTankSpawnTimer', () => this.spawnFuelTankPickup());
    }

    // Survival enemies
    if (!this.bossActive) {
      for (const rule of area.enemies.survival) {
        if (!rule.enabled) continue;
        if (rule.id === 'mineCarrier' && !canUseMineCarriers()) continue;
        if (rule.id === 'flamethrower' && !canUseFlamethrowers()) continue;
        const id = String(rule.id);
        this.editorSurvivalTimers[id] = (this.editorSurvivalTimers[id] ?? 0) + delta;
        const interval = getEffectiveIntervalMs(rule, this.score, elapsed);
        if (this.editorSurvivalTimers[id] >= interval) {
          this.editorSurvivalTimers[id] = 0;
          const kind = rule.id as EnemyKind;
          const counts = this.getEnemyCounts();
          const onScreen = counts[kind] ?? 0;
          if (onScreen < rule.maxOnScreen) {
            this.spawnEnemy(kind);
          }
        }
      }

      for (const rule of area.enemies.story) {
        if (!rule.enabled || !isStoryEnemyIdUnlocked(rule.id)) continue;
        const parsed = parseEditorStoryId(rule.id);
        if (!parsed) continue;
        const id = String(rule.id);
        this.editorStoryTimers[id] = (this.editorStoryTimers[id] ?? 0) + delta;
        const interval = getEffectiveIntervalMs(rule, this.score, elapsed);
        if (this.editorStoryTimers[id] >= interval) {
          this.editorStoryTimers[id] = 0;
          const counts = this.getStoryEnemyCounts();
          if ((counts[parsed.level] ?? 0) >= rule.maxOnScreen) continue;
          if (parsed.galilean || isGalileanMoonLevel(parsed.level)) {
            const definition = getGalileanMoonEnemyDefinition(parsed.level);
            this.addStoryEnemy(definition);
          } else if (parsed.world3Variant || isWorld3VariantLevel(parsed.level)) {
            const definition = getWorld3VariantDefinition(parsed.level);
            this.addStoryEnemy(definition);
          } else {
            // Temporarily use target world for definition lookup.
            const prevWorld = this.worldId;
            this.worldId = parsed.worldId;
            this.spawnSurvivalStoryEnemy(parsed.level);
            this.worldId = prevWorld;
          }
        }
      }

      const enabledBosses = area.enemies.bosses.filter((r) => r.enabled && isBossIdUnlocked(r.id));
      if (enabledBosses.length > 0) {
        const bossCount = area.enemies.bossCount;
        const canSpawnMore = bossCount === 0 || this.editorBossesDefeated < bossCount;
        if (canSpawnMore && this.bossShips.countActive(true) === 0) {
          // Use the shortest interval among enabled bosses; pick one when ready.
          for (const bossRule of enabledBosses) {
            const key = String(bossRule.id);
            this.editorSurvivalTimers[`boss:${key}`] = (this.editorSurvivalTimers[`boss:${key}`] ?? 0) + delta;
          }
          this.editorBossTimer += delta;
          const minInterval = Math.min(
            ...enabledBosses.map((r) => getEffectiveIntervalMs(r, this.score, elapsed)),
          );
          if (this.editorBossTimer >= minInterval) {
            this.editorBossTimer = 0;
            const pick = Phaser.Utils.Array.GetRandom(enabledBosses);
            this.spawnEditorBoss(pick.id);
          }
        }
      }
    }
  }

  private spawnEditorBoss(bossId: string): void {
    if (this.bossActive || this.bossShips.countActive(true) > 0) return;
    const parsed = parseEditorBossId(bossId);
    if (!parsed || !isBossIdUnlocked(parsed.id)) return;

    const levelConfig = getBossConfigForLevel(parsed.level);
    const definition = getBossDefinition(parsed.worldId, parsed.level);
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

    playBossAppearAlarmSfx();
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
}
