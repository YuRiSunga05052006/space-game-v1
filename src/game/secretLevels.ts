import {
  SECRET_LEVELS as WORLD1_SECRET_LEVELS,
  type SecretLevelDefinition,
} from './world1/secretLevels';
import { WORLD2_SECRET_LEVELS } from './world2/secretLevels';
import { WORLD3_SECRET_LEVELS } from './world3/secretLevels';

export type { SecretLevelDefinition };

export const SECRET_LEVELS: Record<string, SecretLevelDefinition> = {
  ...WORLD1_SECRET_LEVELS,
  ...WORLD2_SECRET_LEVELS,
  ...WORLD3_SECRET_LEVELS,
};

export function getSecretLevel(id: string): SecretLevelDefinition | undefined {
  return SECRET_LEVELS[id];
}

export function getSecretsForWorld(worldId: string): SecretLevelDefinition[] {
  return Object.values(SECRET_LEVELS).filter(
    (secret) => (secret.worldId ?? 'world1') === worldId,
  );
}

export function getSecretWorldId(secretId: string): string {
  return getSecretLevel(secretId)?.worldId ?? 'world1';
}
