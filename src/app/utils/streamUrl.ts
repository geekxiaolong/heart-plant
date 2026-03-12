/**
 * 直播流 WHEP 地址：开发时走同源代理避免 CORS，生产可用环境变量指定
 */
const STREAM_PROXY_PATH = '/stream-proxy';
const DEFAULT_STREAM_ORIGIN = 'http://192.168.92.162:8889';

const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV === true;
const envBase = (import.meta.env?.VITE_STREAM_BASE_URL as string)?.trim();

/** 获取 WHEP 接口的 base URL：开发且未配置时用同源代理路径，否则用配置或默认 IP */
function getStreamBase(): string {
  if (envBase) return envBase.replace(/\/$/, '');
  if (isDev && typeof window !== 'undefined') return ''; // 相对路径，走 Vite 代理
  return DEFAULT_STREAM_ORIGIN;
}

/** 根据品种/流路径得到 WHEP URL，走代理时同源无 CORS */
export function getStreamWhepUrl(streamPath?: string | null): string {
  const path = (streamPath && String(streamPath).trim()) || 'heartplant';
  const base = getStreamBase();
  if (base) return `${base}/${path}/whep`;
  return `${STREAM_PROXY_PATH}/${path}/whep`;
}
