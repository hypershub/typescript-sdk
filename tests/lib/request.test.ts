import { describe, it, expect, vi, afterEach } from 'vitest'
import { doRequest } from '../../src/lib/request.js'
import {
  HypersHubAuthError,
  HypersHubRateLimitError,
  HypersHubInsufficientBalanceError,
  HypersHubError,
} from '../../src/error.js'

afterEach(() => {
  vi.unstubAllGlobals()
})

function makeResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('doRequest', () => {
  it('sets Authorization and Content-Type headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeResponse(200, { ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    await doRequest('https://api.example.com', 'sk-hy-test', {
      method: 'POST',
      path: '/v1/chat/completions',
      body: { model: 'gpt-4o' },
    })

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const headers = init.headers as Record<string, string>
    expect(url).toBe('https://api.example.com/v1/chat/completions')
    expect(headers['Authorization']).toBe('Bearer sk-hy-test')
    expect(headers['Content-Type']).toBe('application/json')
  })

  it('merges defaultHeaders and per-request headers', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeResponse(200, {}))
    vi.stubGlobal('fetch', fetchMock)

    await doRequest(
      'https://api.example.com',
      'sk-hy-test',
      { method: 'POST', path: '/v1/messages', body: {}, headers: { 'X-Request': 'req' } },
      { 'X-Default': 'default' },
    )

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    const headers = init.headers as Record<string, string>
    expect(headers['X-Default']).toBe('default')
    expect(headers['X-Request']).toBe('req')
  })

  it('per-request headers override defaultHeaders', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeResponse(200, {}))
    vi.stubGlobal('fetch', fetchMock)

    await doRequest(
      'https://api.example.com',
      'sk-hy-test',
      { method: 'POST', path: '/v1/test', body: {}, headers: { 'X-H': 'override' } },
      { 'X-H': 'default' },
    )

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((init.headers as Record<string, string>)['X-H']).toBe('override')
  })

  it('returns the Response on success', async () => {
    const mockRes = makeResponse(200, { id: 'chatcmpl-1' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockRes))

    const res = await doRequest('https://api.example.com', 'sk-hy-test', {
      method: 'POST',
      path: '/v1/test',
      body: {},
    })
    expect(res).toBe(mockRes)
  })

  it('throws HypersHubAuthError on 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(401, { error: { message: 'Unauthorized' } })))
    await expect(
      doRequest('https://api.example.com', 'bad-key', { method: 'POST', path: '/v1/test' }),
    ).rejects.toBeInstanceOf(HypersHubAuthError)
  })

  it('throws HypersHubRateLimitError on 429', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(429, {})))
    await expect(
      doRequest('https://api.example.com', 'sk-hy-test', { method: 'POST', path: '/v1/test' }),
    ).rejects.toBeInstanceOf(HypersHubRateLimitError)
  })

  it('throws HypersHubInsufficientBalanceError on 402', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(402, {})))
    await expect(
      doRequest('https://api.example.com', 'sk-hy-test', { method: 'POST', path: '/v1/test' }),
    ).rejects.toBeInstanceOf(HypersHubInsufficientBalanceError)
  })

  it('throws HypersHubError on 500', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(500, {})))
    await expect(
      doRequest('https://api.example.com', 'sk-hy-test', { method: 'POST', path: '/v1/test' }),
    ).rejects.toBeInstanceOf(HypersHubError)
  })

  it('sends no body when body is undefined', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeResponse(200, {}))
    vi.stubGlobal('fetch', fetchMock)

    await doRequest('https://api.example.com', 'sk-hy-test', {
      method: 'GET',
      path: '/v1/models',
    })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.body).toBeUndefined()
  })

  it('passes AbortSignal to fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeResponse(200, {}))
    vi.stubGlobal('fetch', fetchMock)

    const controller = new AbortController()
    await doRequest('https://api.example.com', 'sk-hy-test', {
      method: 'POST',
      path: '/v1/test',
      body: {},
      signal: controller.signal,
    })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.signal).toBe(controller.signal)
  })

  it('creates AbortSignal.timeout when timeoutMs is set and no signal provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeResponse(200, {}))
    vi.stubGlobal('fetch', fetchMock)

    await doRequest(
      'https://api.example.com',
      'sk-hy-test',
      { method: 'POST', path: '/v1/test', body: {} },
      undefined,
      5000,
    )

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.signal).toBeInstanceOf(AbortSignal)
    expect(init.signal?.aborted).toBe(false)
  })

  it('uses user-provided signal over timeoutMs', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeResponse(200, {}))
    vi.stubGlobal('fetch', fetchMock)

    const controller = new AbortController()
    await doRequest(
      'https://api.example.com',
      'sk-hy-test',
      { method: 'POST', path: '/v1/test', body: {}, signal: controller.signal },
      undefined,
      5000,
    )

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.signal).toBe(controller.signal)
  })

  it('does not set signal when neither timeoutMs nor signal provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeResponse(200, {}))
    vi.stubGlobal('fetch', fetchMock)

    await doRequest('https://api.example.com', 'sk-hy-test', {
      method: 'GET',
      path: '/v1/models',
    })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.signal).toBeUndefined()
  })
})
