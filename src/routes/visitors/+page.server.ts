import { getVisitorLocationStats } from '$lib/server/visitors';

export async function load() {
  return {
    stats: await getVisitorLocationStats()
  };
}
