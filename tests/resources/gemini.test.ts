import { describe, it, expect, vi, afterEach } from 'vitest'
import { Gemini } from '../../src/resources/gemini.js'
import type { HypersHubClient } from '../../src/hypershub.js'
import type { GenerateContentResponse } from '../../src/types/gemini.js'

afterEach(() => vi.restoreAllMocks())

function makeClient(responseBody: unknown): HypersHubClient {
  return {
    _request: vi.fn().mockResolvedValue(
      new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  }
}

function makeSSEClient(lines: string[]): HypersHubClient {
  const body = lines.join('\n') + '\n'
  return { _request: vi.fn().mockResolvedValue(new Response(body)) }
}

const baseResponse: GenerateContentResponse = {
  candidates: [
    {
      content: { role: 'model', parts: [{ text: 'Hello!' }] },
      finishReason: 'STOP',
      index: 0,
    },
  ],
  usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 3, totalTokenCount: 8 },
}

describe('Gemini.generateContent', () => {
  it('POSTs to the correct model path', async () => {
    const client = makeClient(baseResponse)
    const gemini = new Gemini(client)
    const result = await gemini.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
    })
    expect(client._request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: '/v1beta/models/gemini-2.5-flash:generateContent',
      }),
    )
    expect(result).toEqual(baseResponse)
  })

  it('URL-encodes the model name', async () => {
    const client = makeClient(baseResponse)
    const gemini = new Gemini(client)
    await gemini.generateContent({
      model: 'models/gemini-2.5-flash',
      contents: [],
    })
    expect(client._request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/v1beta/models/models%2Fgemini-2.5-flash:generateContent',
      }),
    )
  })

  it('strips model from request body', async () => {
    const client = makeClient(baseResponse)
    const gemini = new Gemini(client)
    await gemini.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
    })
    const call = (client._request as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(call.body).not.toHaveProperty('model')
  })

  it('passes AbortSignal', async () => {
    const client = makeClient(baseResponse)
    const gemini = new Gemini(client)
    const controller = new AbortController()
    await gemini.generateContent({ model: 'gemini-2.5-flash', contents: [] }, controller.signal)
    expect(client._request).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal }),
    )
  })
})

describe('Gemini.generateContent (stream: true)', () => {
  it('POSTs to the streaming endpoint and returns chunks', async () => {
    const client = makeSSEClient([
      `data: ${JSON.stringify(baseResponse)}`,
      'data: [DONE]',
    ])
    const gemini = new Gemini(client)
    const gen = await gemini.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
      stream: true,
    })

    expect(client._request).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/v1beta/models/gemini-2.5-flash:streamGenerateContent',
      }),
    )

    const results: GenerateContentResponse[] = []
    for await (const chunk of gen) results.push(chunk)
    expect(results).toHaveLength(1)
    expect(results[0]).toEqual(baseResponse)
  })

  it('does not include stream field in request body', async () => {
    const client = makeSSEClient([`data: ${JSON.stringify(baseResponse)}`, 'data: [DONE]'])
    const gemini = new Gemini(client)
    await gemini.generateContent({
      model: 'gemini-2.5-flash',
      contents: [],
      stream: true,
    })
    const call = (client._request as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(call.body).not.toHaveProperty('stream')
  })
})

describe('Gemini.streamGenerateContent', () => {
  it('POSTs to the explicit streaming endpoint and returns chunks', async () => {
    const client = makeSSEClient([
      `data: ${JSON.stringify(baseResponse)}`,
      'data: [DONE]',
    ])
    const gemini = new Gemini(client)

    const gen = await gemini.streamGenerateContent({
      model: 'gemini-3.1-pro-preview',
      contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
      generationConfig: { maxOutputTokens: 128 },
    })

    expect(client._request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        path: '/v1beta/models/gemini-3.1-pro-preview:streamGenerateContent',
      }),
    )

    const results: GenerateContentResponse[] = []
    for await (const chunk of gen) results.push(chunk)
    expect(results).toEqual([baseResponse])
  })

  it('URL-encodes model and strips model from request body', async () => {
    const client = makeSSEClient([`data: ${JSON.stringify(baseResponse)}`, 'data: [DONE]'])
    const gemini = new Gemini(client)

    await gemini.streamGenerateContent({
      model: 'models/gemini-3.1-pro-preview',
      contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
    })

    const call = (client._request as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(call.path).toBe('/v1beta/models/models%2Fgemini-3.1-pro-preview:streamGenerateContent')
    expect(call.body).toEqual({ contents: [{ role: 'user', parts: [{ text: 'Hi' }] }] })
    expect(call.body).not.toHaveProperty('model')
  })

  it('passes AbortSignal', async () => {
    const client = makeSSEClient([`data: ${JSON.stringify(baseResponse)}`, 'data: [DONE]'])
    const gemini = new Gemini(client)
    const controller = new AbortController()

    await gemini.streamGenerateContent(
      { model: 'gemini-3.1-pro-preview', contents: [] },
      controller.signal,
    )

    expect(client._request).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal }),
    )
  })
})
