import { createError } from '../error.js'

export interface RequestOptions {
  method: 'GET' | 'POST'
  path: string
  body?: unknown
  headers?: Record<string, string>
  signal?: AbortSignal
}

export async function doRequest(
  baseURL: string,
  apiKey: string,
  options: RequestOptions,
  defaultHeaders?: Record<string, string>,
  timeoutMs?: number,
): Promise<Response> {
  const url = `${baseURL}${options.path}`
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    ...defaultHeaders,
    ...options.headers,
  }
  const signal = options.signal ?? (timeoutMs ? AbortSignal.timeout(timeoutMs) : undefined)
  const res = await fetch(url, {
    method: options.method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal,
  })
  if (!res.ok) {
    let body: unknown
    try {
      body = await res.json()
    } catch {
      body = await res.text().catch(() => res.statusText)
    }
    throw createError(res.status, res.statusText, body)
  }
  return res
}
