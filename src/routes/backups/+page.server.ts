import { readBackupManifest } from '$lib/server/backups';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const manifest = await readBackupManifest();
  return { manifest };
};
