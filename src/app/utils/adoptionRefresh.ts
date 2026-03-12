import { clearCache, getCache, setCache } from './cache';
import { normalizePlantIdentity } from './plantIdentity';

export const ADOPTION_REFRESH_EVENT = 'heartplant:adoption-completed';

export type AdoptedPlantPayload = {
  id: string;
  originalId?: string;
  name?: string;
  type?: string;
  image?: string;
  imageUrl?: string;
  /** 认领时 fal.ai 生成的卡通形象图 URL，主页/互动页优先展示 */
  cartoonImageUrl?: string;
  health?: number;
  humidity?: number;
  temp?: number;
  days?: number;
  ownerEmails?: string[];
  ownerIds?: string[];
  created_at?: string;
  [key: string]: any;
};

export function hydrateAdoptionCaches(options: {
  userId?: string | null;
  adoptedPlant?: AdoptedPlantPayload | null;
  originalId?: string | null;
}) {
  const { userId, adoptedPlant, originalId } = options;

  clearCache('my-plant-ids');

  if (adoptedPlant) {
    const normalizePlant = normalizePlantIdentity({
      health: 100,
      humidity: 60,
      temp: 24,
      days: 1,
      image: adoptedPlant.image || adoptedPlant.imageUrl,
      imageUrl: adoptedPlant.imageUrl || adoptedPlant.image,
      ...adoptedPlant,
      originalId: adoptedPlant.originalId || originalId || undefined,
    });

    const mergePlantList = (key: string) => {
      const current = getCache<any[]>(key, Number.MAX_SAFE_INTEGER) || [];
      const next = [normalizePlant, ...current.filter((item) => item?.id !== normalizePlant.id)];
      setCache(key, next);
    };

    mergePlantList('plants-current');
    if (userId) {
      mergePlantList(`plants-${userId}`);
    }
  } else {
    clearCache('plants-current');
    if (userId) {
      clearCache(`plants-${userId}`);
    }
  }

  const adoptedOriginalId = originalId || adoptedPlant?.originalId || null;
  if (adoptedOriginalId) {
    const currentIds = getCache<string[]>('my-plant-ids', Number.MAX_SAFE_INTEGER) || [];
    if (!currentIds.includes(adoptedOriginalId)) {
      setCache('my-plant-ids', [adoptedOriginalId, ...currentIds]);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(ADOPTION_REFRESH_EVENT, {
      detail: {
        plant: adoptedPlant || null,
        originalId: adoptedOriginalId,
        userId: userId || null,
        at: Date.now(),
      }
    }));
  }
}
