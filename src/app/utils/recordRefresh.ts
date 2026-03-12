import { clearCacheByPrefix, getCache, setCache } from './cache';
import { getPlantIdentityCandidates, isSamePlantIdentity } from './plantIdentity';

export const RECORD_REFRESH_EVENT = 'heartplant:record-created';

type RecordType = 'mood' | 'journal';

type RecordRefreshPayload = {
  type: RecordType;
  plantId?: string | null;
  originalId?: string | null;
  createdAt: number;
  rawRecord: any;
  interactionRecord: any;
};

function buildTimestamp(input?: string) {
  const date = input ? new Date(input) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function buildDisplayDate(timestamp: string) {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function patchTimelineCache(cacheKey: string, interactionRecord: any) {
  const cached = getCache<{ items?: any[]; hasMore?: boolean }>(cacheKey, Number.MAX_SAFE_INTEGER);
  if (!cached) return;

  const currentItems = Array.isArray(cached.items) ? cached.items : [];
  const nextItems = [interactionRecord, ...currentItems.filter((item) => item?.id !== interactionRecord.id)].slice(0, 10);
  setCache(cacheKey, {
    ...cached,
    items: nextItems,
  });
}

function patchPlantTimelineCache(plantIds: string[], interactionRecord: any) {
  plantIds.forEach((id) => {
    patchTimelineCache(`timeline-${id}-p1`, interactionRecord);
  });
}

export function emitRecordCreated(payload: Omit<RecordRefreshPayload, 'createdAt'>) {
  if (typeof window === 'undefined') return;

  const detail: RecordRefreshPayload = {
    ...payload,
    createdAt: Date.now(),
  };

  window.dispatchEvent(new CustomEvent(RECORD_REFRESH_EVENT, { detail }));
}

export function subscribeRecordCreated(handler: (event: CustomEvent<RecordRefreshPayload>) => void) {
  if (typeof window === 'undefined') return () => {};
  const wrapped = (event: Event) => handler(event as CustomEvent<RecordRefreshPayload>);
  window.addEventListener(RECORD_REFRESH_EVENT, wrapped);
  return () => window.removeEventListener(RECORD_REFRESH_EVENT, wrapped);
}

export function hydrateMoodSubmission(options: {
  plantId?: string | null;
  originalId?: string | null;
  mood: string;
  content: string;
  tags?: string[];
  imageUrl?: string | null;
}) {
  const timestamp = buildTimestamp();
  const id = `local-mood-${Date.now()}`;
  const plantIds = getPlantIdentityCandidates({ id: options.plantId, originalId: options.originalId });

  const rawRecord = {
    id,
    type: 'mood',
    plantId: options.plantId,
    originalId: options.originalId,
    mood: options.mood,
    content: options.content,
    tags: options.tags || [],
    imageUrl: options.imageUrl || undefined,
    timestamp,
    __optimistic: true,
  };

  const interactionRecord = {
    id,
    originalId: id,
    type: 'mood',
    date: buildDisplayDate(timestamp),
    content: `心情打卡：${options.mood} - ${options.content}`,
    icon: undefined,
    color: 'text-orange-500',
    mood: options.mood,
    timestamp,
    __optimistic: true,
  };

  patchPlantTimelineCache(plantIds, interactionRecord);
  emitRecordCreated({
    type: 'mood',
    plantId: options.plantId,
    originalId: options.originalId,
    rawRecord,
    interactionRecord,
  });
}

export function hydrateJournalSubmission(options: {
  plantId?: string | null;
  originalId?: string | null;
  title: string;
  style?: string;
  entries: any[];
}) {
  const timestamp = buildTimestamp();
  const id = `local-journal-${Date.now()}`;
  const plantIds = getPlantIdentityCandidates({ id: options.plantId, originalId: options.originalId });
  const firstEntry = Array.isArray(options.entries) ? options.entries.find((entry) => entry?.content || entry?.imageUrl) : null;

  const rawRecord = {
    id,
    type: 'journal',
    plantId: options.plantId,
    originalId: options.originalId,
    title: options.title,
    style: options.style,
    entries: options.entries,
    content: firstEntry?.content || '',
    imageUrl: firstEntry?.imageUrl || undefined,
    timestamp,
    __optimistic: true,
  };

  const interactionRecord = {
    id,
    originalId: id,
    type: 'journal',
    date: buildDisplayDate(timestamp),
    content: `合写日记：《${options.title}》`,
    title: options.title,
    timestamp,
    color: 'text-purple-500',
    __optimistic: true,
  };

  patchPlantTimelineCache(plantIds, interactionRecord);
  emitRecordCreated({
    type: 'journal',
    plantId: options.plantId,
    originalId: options.originalId,
    rawRecord,
    interactionRecord,
  });
}

export function prependInteractionRecord(list: any[], incoming?: any, icons?: { mood?: any; journal?: any }) {
  if (!incoming) return list;

  const nextRecord = {
    ...incoming,
    icon: incoming.icon || (incoming.type === 'mood' ? icons?.mood : icons?.journal),
  };

  return [nextRecord, ...(list || []).filter((item) => item?.id !== incoming.id)];
}

export function prependPlantTimelineRecord(list: any[], incoming?: any, currentPlantId?: string | null) {
  if (!incoming) return list;

  const matchesPlant = !currentPlantId || isSamePlantIdentity({ id: currentPlantId }, incoming);
  if (!matchesPlant) return list;

  return [incoming, ...(list || []).filter((item) => item?.id !== incoming.id)];
}

export function invalidatePlantTimelineCaches(plantId?: string | null, originalId?: string | null) {
  const ids = getPlantIdentityCandidates({ id: plantId, originalId });
  ids.forEach((id) => clearCacheByPrefix(`timeline-${id}-`));
}
