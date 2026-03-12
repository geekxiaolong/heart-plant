/**
 * 统一的 API 请求工具
 * 确保所有请求都携带正确的认证头
 */
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { supabase } from './supabaseClient';

const STORAGE_BUCKET = 'make-4b732228-plants';

// 本地/局域网开发：localhost、127.0.0.1、192.168.x.x、10.x.x.x 均走本地 API，避免打到旧版 Edge（会返回 DUPLICATE_ADOPTION）
const isLocalDev =
  typeof window !== 'undefined' &&
  (window.location.hostname === '127.0.0.1' ||
    window.location.hostname === 'localhost' ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(window.location.hostname) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(window.location.hostname));
const explicitApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const API_BASE_URL = explicitApiBaseUrl
  || (isLocalDev ? `http://${typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1'}:8000` : `https://${projectId}.supabase.co/functions/v1/make-server-4b732228`);

/** Supabase Edge 只接受标准 JWT anon key，与 heart-plant-api 使用同一项目的 key；可用 VITE_SUPABASE_ANON_KEY 覆盖 */
const EDGE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrc3ppZ3JhbGplcHRwZWlpbXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MjkyMDEsImV4cCI6MjA4ODAwNTIwMX0.piPkMGZDQ6O4l-YhZwPIU-Fp5Q-UUwt5fwvYlKVu6x0';

export function apiUrl(endpoint: string): string {
  const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${normalized}`;
}

export function getStoragePublicUrl(path?: string | null): string {
  if (!path) return '';
  if (!path.startsWith('storage:')) return path;

  const normalizedPath = path.replace(/^storage:/, '').replace(/^\/+/, '');
  return `https://${projectId}.supabase.co/storage/v1/object/public/${STORAGE_BUCKET}/${normalizedPath}`;
}

/**
 * 获取当前用户的 session token
 * 先用 getSession 取当前会话（与 AuthContext 一致），若无再尝试 refreshSession，避免漏带 X-User-JWT 导致 401
 */
async function getSessionToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) return session.access_token;
    const { data: { session: refreshed }, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Failed to refresh session:', error);
      return null;
    }
    return refreshed?.access_token || null;
  } catch (error) {
    console.error('Failed to get session token:', error);
    return null;
  }
}

/**
 * 构建标准请求头
 * 始终携带 Authorization: Bearer <anon_key>，否则 Supabase Edge 会返回 "Missing authorization header"；
 * 若有登录态则同时携带 X-User-JWT 供后端识别用户。
 */
export async function buildApiHeaders(includeContentType: boolean = false): Promise<Record<string, string>> {
  const token = await getSessionToken();

  const headers: Record<string, string> = {
    'apikey': EDGE_ANON_KEY,
    'Authorization': `Bearer ${EDGE_ANON_KEY}`,
  };

  if (token && token !== 'undefined' && token !== 'null') {
    headers['X-User-JWT'] = token;
  }

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

async function parseResponseBody(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      return null;
    }
  }

  try {
    const text = await response.text();
    return text || null;
  } catch (error) {
    console.error('Failed to read response text:', error);
    return null;
  }
}

export interface ApiRequestOptions extends Omit<RequestInit, 'headers' | 'body'> {
  includeContentType?: boolean;
  body?: any;
  headers?: Record<string, string>;
}

/**
 * 底层请求方法：统一认证头、JSON body、错误处理
 */
export async function apiRequest(endpoint: string, options: ApiRequestOptions = {}): Promise<Response> {
  const {
    includeContentType = false,
    body,
    headers: customHeaders,
    ...rest
  } = options;

  const shouldIncludeContentType = includeContentType || (body !== undefined && !(body instanceof FormData));
  const headers = {
    ...(await buildApiHeaders(shouldIncludeContentType)),
    ...(customHeaders || {}),
  };

  const requestBody = body === undefined || body instanceof FormData || typeof body === 'string'
    ? body
    : JSON.stringify(body);

  return fetch(apiUrl(endpoint), {
    ...rest,
    headers,
    body: requestBody,
  });
}

/**
 * JSON 请求：支持候选端点回退，适配后端路由差异
 */
export async function apiRequestJson<T>(endpoints: string | string[], options: ApiRequestOptions = {}): Promise<T> {
  const candidates = Array.isArray(endpoints) ? endpoints : [endpoints];
  let lastError: Error | null = null;

  for (const endpoint of candidates) {
    try {
      const response = await apiRequest(endpoint, options);
      const payload = await parseResponseBody(response);

      if (!response.ok) {
        const message = (payload && typeof payload === 'object' && ((payload as any).error || (payload as any).message))
          || `API Error: ${response.status} ${response.statusText}`;
        throw new Error(String(message));
      }

      return payload as T;
    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[API Request Error] ${endpoint}:`, error);
    }
  }

  throw lastError || new Error('API request failed');
}

/**
 * 处理 API 响应
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;

    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
      console.error('API Error Details:', errorData);
    } catch (e) {
      console.error('API Error (non-JSON):', errorMessage);
    }

    throw new Error(errorMessage);
  }

  try {
    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error('Failed to parse JSON response:', error);
    throw new Error('Invalid JSON response from server');
  }
}

/**
 * GET 请求
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  const url = apiUrl(endpoint);
  const headers = await buildApiHeaders();

  console.log(`[API GET] ${url}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers
    });
    return await handleResponse<T>(response);
  } catch (error) {
    console.error(`[API GET Error] ${url}:`, error);
    throw error;
  }
}

/**
 * POST 请求
 */
export async function apiPost<T>(endpoint: string, body?: any): Promise<T> {
  const url = apiUrl(endpoint);
  const headers = await buildApiHeaders(true);

  console.log(`[API POST] ${url}`, body);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    return await handleResponse<T>(response);
  } catch (error) {
    console.error(`[API POST Error] ${url}:`, error);
    throw error;
  }
}

/**
 * DELETE 请求
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  const url = apiUrl(endpoint);
  const headers = await buildApiHeaders();

  console.log(`[API DELETE] ${url}`);

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers
    });
    return await handleResponse<T>(response);
  } catch (error) {
    console.error(`[API DELETE Error] ${url}:`, error);
    throw error;
  }
}

/**
 * PUT 请求
 */
export async function apiPut<T>(endpoint: string, body?: any): Promise<T> {
  const url = apiUrl(endpoint);
  const headers = await buildApiHeaders(true);

  console.log(`[API PUT] ${url}`, body);

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    return await handleResponse<T>(response);
  } catch (error) {
    console.error(`[API PUT Error] ${url}:`, error);
    throw error;
  }
}
