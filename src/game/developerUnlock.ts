import { getCurrentUser, isDeveloperAccount } from './cloud/auth';
import { flushProgressToCloud } from './cloud/progressSync';
import { maxAllPowerUpLevels } from './playerPowerUps';
import { unlockAllShapes } from './playerShapes';
import { unlockAllSkins } from './playerSkins';
import { unlockAllStoryLevels } from './storyProgress';
import { unlockAllWorldsAndSecrets } from './worldProgress';

export async function unlockAllForDeveloper(): Promise<string | null> {
  const user = await getCurrentUser();
  if (!isDeveloperAccount(user)) return 'Unlock All is only available on developer accounts.';

  unlockAllWorldsAndSecrets();
  unlockAllStoryLevels();
  unlockAllSkins();
  unlockAllShapes();
  maxAllPowerUpLevels();
  await flushProgressToCloud();
  return null;
}
