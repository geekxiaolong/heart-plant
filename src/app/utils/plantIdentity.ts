export type PlantIdentityLike = {
  id?: string | null;
  originalId?: string | null;
  plantId?: string | null;
  adoptedPlantId?: string | null;
  adoptedOriginalId?: string | null;
  [key: string]: any;
};

export function getPlantIdentityCandidates(source?: PlantIdentityLike | string | null): string[] {
  if (!source) return [];

  const values = typeof source === 'string'
    ? [source]
    : [
        source.id,
        source.plantId,
        source.originalId,
        source.adoptedPlantId,
        source.adoptedOriginalId,
      ];

  return Array.from(new Set(values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)));
}

export function getPrimaryPlantId(source?: PlantIdentityLike | string | null): string | null {
  const candidates = getPlantIdentityCandidates(source);
  return candidates[0] || null;
}

export function isSamePlantIdentity(a?: PlantIdentityLike | string | null, b?: PlantIdentityLike | string | null) {
  const aIds = getPlantIdentityCandidates(a);
  const bIds = getPlantIdentityCandidates(b);
  return aIds.some((id) => bIds.includes(id));
}

export function findPlantByAnyId<T extends PlantIdentityLike>(plants: T[] | null | undefined, source?: PlantIdentityLike | string | null): T | null {
  if (!Array.isArray(plants) || plants.length === 0) return null;
  return plants.find((plant) => isSamePlantIdentity(plant, source)) || null;
}

export function normalizePlantIdentity<T extends PlantIdentityLike>(plant: T | null | undefined): T | null {
  if (!plant) return null;
  return {
    ...plant,
    id: plant.id || plant.plantId || plant.adoptedPlantId || plant.originalId || plant.adoptedOriginalId || undefined,
    originalId: plant.originalId || plant.adoptedOriginalId || undefined,
  };
}

/** PlantAvatar 支持的 type，与品种映射一致 */
export type PlantAvatarType = 'succulent' | 'cactus' | 'pothos' | 'sunflower' | 'monstera' | 'snakeplant' | 'fern';

/** 品种 → 默认卡通图（与 default-cartoons 下中文文件名一致）+ 形象类型 */
const DEFAULT_CARTOON_BASE = '/default-cartoons/';
const VARIETY_MAP: { keywords: string[]; file: string; avatarType: PlantAvatarType }[] = [
  { keywords: ['向日葵', '菊'], file: '向日葵.png', avatarType: 'sunflower' },
  { keywords: ['绿萝', '花叶', '藤', '蕨', 'fern'], file: '绿萝.png', avatarType: 'pothos' },
  { keywords: ['银皇后', '广东万年青', '万年青', '粗肋草'], file: '银皇后.png', avatarType: 'monstera' },
  { keywords: ['虎皮兰', '蛇皮兰', '千岁兰', '剑叶'], file: '虎皮兰.png', avatarType: 'snakeplant' },
  { keywords: ['琴叶榕', '琴叶'], file: '琴叶榕.png', avatarType: 'monstera' },
  { keywords: ['龟背竹', '蓬莱蕉', '裂叶'], file: '龟背竹.png', avatarType: 'monstera' },
  { keywords: ['薰衣草'], file: '薰衣草.png', avatarType: 'sunflower' },
  { keywords: ['佛珠', '珍珠吊兰', '绿之铃', '弦月', '吊兰'], file: '珍珠吊兰.png', avatarType: 'pothos' },
  { keywords: ['仙人掌', '球', 'cactus'], file: '静夜多肉.png', avatarType: 'cactus' },
  { keywords: ['多肉', '芦荟', '景天', '拟石莲', '玉露', '生石花', '静夜'], file: '静夜多肉.png', avatarType: 'succulent' },
];

function getVarietyMatch(plant: Record<string, unknown> | null | undefined): { file: string; avatarType: PlantAvatarType } | null {
  if (!plant || typeof plant !== 'object') return null;
  const species = String(plant.species ?? plant.name ?? plant.plantName ?? '').trim();
  const type = String(plant.type ?? plant.plantType ?? '').trim();
  const text = `${species} ${type}`.toLowerCase();
  if (!text) return { file: '静夜多肉.png', avatarType: 'succulent' };
  for (const { keywords, file, avatarType } of VARIETY_MAP) {
    if (keywords.some((k) => text.includes(k.toLowerCase()))) return { file, avatarType };
  }
  return { file: '静夜多肉.png', avatarType: 'succulent' };
}

function getDefaultCartoonKey(plant: Record<string, unknown> | null | undefined): string | null {
  const match = getVarietyMatch(plant);
  return match?.file ?? null;
}

/** 按植物品种返回 PlantAvatar 的 type，与默认卡通图一致 */
export function getAvatarTypeForPlant(plant: Record<string, unknown> | null | undefined): PlantAvatarType {
  const match = getVarietyMatch(plant);
  return match?.avatarType ?? 'succulent';
}

/** 品种：创建植物时在目录中固定，不可变更。仅用 species（来自植物库），不用用户填的名称 */
export function getDisplayVariety(plant: Record<string, unknown> | null | undefined): string {
  if (!plant || typeof plant !== 'object') return '—';
  const s = (plant.species ?? plant.plantName ?? '').toString().trim();
  return s || '—';
}

/** 名称：认领后用户给该棵植物起的名字（昵称）。空则用库名/品种回退显示 */
export function getDisplayName(plant: Record<string, unknown> | null | undefined): string {
  if (!plant || typeof plant !== 'object') return '—';
  const raw = (plant.name ?? plant.plantName ?? plant.species ?? '').toString().trim();
  return raw || '—';
}

/** 无认领生成图时使用的默认卡通图 URL（按植物名称/类型匹配） */
export function getDefaultCartoonUrl(plant: Record<string, unknown> | null | undefined): string {
  const key = getDefaultCartoonKey(plant);
  return key ? `${DEFAULT_CARTOON_BASE}${key}` : '';
}

/** 优先按当前品种用默认卡通图，保证形象与品种一致；否则用认领时生成的图或原图（主页、互动页展示用） */
export function getPlantDisplayImage(plant: Record<string, unknown> | null | undefined): string {
  if (!plant || typeof plant !== 'object') return '';
  const defaultCartoon = getDefaultCartoonUrl(plant);
  if (defaultCartoon) return defaultCartoon;
  const cartoon =
    (plant.cartoonImageUrl as string) || (plant.cartoon_image_url as string);
  if (typeof cartoon === 'string' && cartoon.trim()) return cartoon.trim();
  const url = (plant.imageUrl as string) || (plant.image as string) || '';
  return typeof url === 'string' ? url.trim() : '';
}

/** 是否有可用于展示的卡通图（含默认卡通，便于条件渲染） */
export function hasCartoonImage(plant: Record<string, unknown> | null | undefined): boolean {
  if (!plant || typeof plant !== 'object') return false;
  const u = (plant.cartoonImageUrl as string) || (plant.cartoon_image_url as string);
  if (typeof u === 'string' && u.trim().length > 0) return true;
  return getDefaultCartoonUrl(plant).length > 0;
}
