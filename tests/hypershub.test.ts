import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HypersHub } from '../src/hypershub.js'
import { Chat } from '../src/resources/chat/index.js'
import { Messages } from '../src/resources/messages.js'
import { Gemini } from '../src/resources/gemini.js'
import { Responses } from '../src/resources/responses.js'
import { Models } from '../src/resources/models.js'

describe('HypersHub constructor', () => {
  it('throws when no apiKey is provided and env var is unset', () => {
    const original = process.env['HYPERSHUB_API_KEY']
    delete process.env['HYPERSHUB_API_KEY']
    expect(() => new HypersHub()).toThrow('HypersHub API key is required')
    if (original !== undefined) process.env['HYPERSHUB_API_KEY'] = original
  })

  it('reads apiKey from environment variable', () => {
    process.env['HYPERSHUB_API_KEY'] = 'sk-hy-env-key'
    const client = new HypersHub()
    expect(client).toBeDefined()
    delete process.env['HYPERSHUB_API_KEY']
  })

  it('accepts apiKey via options', () => {
    expect(() => new HypersHub({ apiKey: 'sk-hy-test' })).not.toThrow()
  })

  it('exposes chat, responses, messages, gemini, and models resources', () => {
    const client = new HypersHub({ apiKey: 'sk-hy-test' })
    expect(client.chat).toBeInstanceOf(Chat)
    expect(client.responses).toBeInstanceOf(Responses)
    expect(client.messages).toBeInstanceOf(Messages)
    expect(client.gemini).toBeInstanceOf(Gemini)
    expect(client.models).toBeInstanceOf(Models)
  })

  it('strips trailing slash from baseURL', () => {
    // _baseURL is private; verify indirectly by checking _request builds correct URL
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'chatcmpl-1' }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const client = new HypersHub({ apiKey: 'sk-hy-test', baseURL: 'https://example.com/' })
    client._request({ method: 'POST', path: '/v1/chat/completions', body: {} })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/v1/chat/completions',
      expect.any(Object),
    )
    vi.unstubAllGlobals()
  })

  it('passes timeout to _request', () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const client = new HypersHub({
      apiKey: 'sk-hy-test',
      baseURL: 'https://example.com',
      timeout: 10000,
    })
    client._request({ method: 'GET', path: '/v1/models' })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.signal).toBeInstanceOf(AbortSignal)
    vi.unstubAllGlobals()
  })

  it('includes default headers in every request', () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const client = new HypersHub({
      apiKey: 'sk-hy-test',
      defaultHeaders: { 'X-Custom': 'value' },
    })
    client._request({ method: 'POST', path: '/v1/test', body: {} })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect((init.headers as Record<string, string>)['X-Custom']).toBe('value')
    vi.unstubAllGlobals()
  })
})

describe('Resource paths', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls /v1/responses for responses.create()', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'resp_1', object: 'response', status: 'completed', model: 'gpt-5.4', output: [] }), { status: 200 }),
    )

    const client = new HypersHub({ apiKey: 'sk-hy-test', baseURL: 'https://example.com' })
    await client.responses.create({ model: 'gpt-5.4', input: 'Hello' })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/v1/responses',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('calls /v1/models for models.list()', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ object: 'list', data: [] }), { status: 200 }),
    )

    const client = new HypersHub({ apiKey: 'sk-hy-test', baseURL: 'https://example.com' })
    await client.models.list()

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/v1/models',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('calls /v1/models/{model} for models.retrieve()', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'claude-sonnet-4-6', object: 'model' }), { status: 200 }),
    )

    const client = new HypersHub({ apiKey: 'sk-hy-test', baseURL: 'https://example.com' })
    await client.models.retrieve('claude-sonnet-4-6')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/v1/models/claude-sonnet-4-6',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('calls streamGenerateContent endpoint for gemini.streamGenerateContent()', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('data: {"candidates":[]}\n\n', {
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
      }),
    )

    const client = new HypersHub({ apiKey: 'sk-hy-test', baseURL: 'https://example.com' })
    await client.gemini.streamGenerateContent({
      model: 'gemini-3.1-pro-preview',
      contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/v1beta/models/gemini-3.1-pro-preview:streamGenerateContent',
      expect.objectContaining({ method: 'POST' }),
    )
  })
})

