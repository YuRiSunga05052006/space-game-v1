export interface SecretLevelDefinition {
  id: string;
  name: string;
  location: string;
  themeId: string;
  hasBoss: boolean;
}

export const SECRET_LEVELS: Record<string, SecretLevelDefinition> = {
  iss: {
    id: 'iss',
    name: 'International Space Station',
    location: 'International Space Station',
    themeId: 'iss',
    hasBoss: false,
  },
};

export function getSecretLevel(id: string): SecretLevelDefinition | undefined {
  return SECRET_LEVELS[id];
}
