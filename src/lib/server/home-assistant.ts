import { env } from '$env/dynamic/private';

const HA_TIMEOUT = 5000;

interface HAState {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

interface HAHistoryEntry {
  entity_id: string;
  state: string;
  last_changed: string;
  attributes: Record<string, unknown>;
}

function getConfig() {
  const baseUrl = env.HA_BASE_URL || 'http://ai.local:8123';
  const token = env.HA_TOKEN || '';
  return { baseUrl: baseUrl.replace(/\/$/, ''), token };
}

async function haFetch<T>(path: string): Promise<T> {
  const { baseUrl, token } = getConfig();
  if (!token) throw new Error('HA_TOKEN not configured');

  const res = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(HA_TIMEOUT)
  });

  if (!res.ok) {
    throw new Error(`HA API ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function getState(entityId: string): Promise<HAState> {
  return haFetch<HAState>(`/api/states/${entityId}`);
}

export async function getStates(entityIds: string[]): Promise<Map<string, HAState>> {
  const results = await Promise.allSettled(entityIds.map((id) => getState(id)));
  const map = new Map<string, HAState>();
  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      map.set(entityIds[i], result.value);
    }
  });
  return map;
}

export async function getHistory(
  entityId: string,
  startTime: Date,
  endTime?: Date
): Promise<HAHistoryEntry[]> {
  const start = startTime.toISOString();
  let path = `/api/history/period/${start}?filter_entity_id=${entityId}&minimal_response&no_attributes`;
  if (endTime) {
    path += `&end_time=${endTime.toISOString()}`;
  }

  const data = await haFetch<HAHistoryEntry[][]>(path);
  return data[0] ?? [];
}

export async function isAvailable(): Promise<boolean> {
  try {
    await haFetch('/api/');
    return true;
  } catch {
    return false;
  }
}

// Entity IDs we care about
export const ENTITIES = {
  indoorTemp: 'sensor.living_room_thermostat_temperature',
  humidity: 'sensor.living_room_thermostat_humidity',
  hvacMode: 'climate.living_room_thermostat',
  outdoorTemp: 'sensor.blink_backyard_temperature',
  livingRoomTV: 'media_player.goobytv_2',
  bedroomTV: 'media_player.bedroom_tv',
  xbox: 'media_player.bedroom_xbox',
  gamerscore: 'sensor.faberali_gamerscore',
  nowPlaying: 'sensor.faberali_now_playing',
  downloadSpeed: 'sensor.exos_router_download_speed',
  uploadSpeed: 'sensor.exos_router_upload_speed',
  alarm: 'alarm_control_panel.blink_faber_home',
  weather: 'weather.forecast_home',
  sun: 'sun.sun',
  sunrise: 'sensor.sun_next_rising',
  sunset: 'sensor.sun_next_setting'
} as const;

export type EntityKey = keyof typeof ENTITIES;
