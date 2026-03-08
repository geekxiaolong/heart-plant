/**
 * 统一的 API 请求工具
 * 确保所有请求都携带正确的认证头
 */
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { supabase } from './supabaseClient';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-4b732228`;

export function apiUrl(endpoint: string): string {
  const normalized = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${normalized}`;
}

/**
 * 获取当前用户的 session token
 */
async function getSessionToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('Failed to get session token:', error);
    return null;
  }
}

/**
 * 构建标准请求头
 */
export async function buildApiHeaders(includeContentType: boolean = false): Promise<Record<string, string>> {
  const token = await getSessionToken();

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${publicAnonKey}`,
    'apikey': publicAnonKey,
  };

  if (token && token !== 'undefined' && token !== 'null') {
    headers['X-User-JWT'] = token;
  }

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
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
