import { describe, it, expect, vi, afterEach } from 'vitest'
import { Models } from '../../src/resources/models.js'
import type { HypersHubClient } from '../../src/hypershub.js'
import type { Model, ModelList } from '../../src/types/models.js'

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

const model: Model = {
  id: 'claude-sonnet-4-6',
  object: 'model',
  created: 1_714_000_000,
  owned_by: 'anthropic',
}

const modelList: ModelList = {
  object: 'list',
  data: [model, { id: 'gemini-3.1-pro-preview', object: 'model', owned_by: 'google' }],
}

describe('Models.list', () => {
  it('GETs /v1/models and returns parsed model list', async () => {
    const client = makeClient(modelList)
    const models = new Models(client)

    const result = await models.list()

    expect(client._request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/v1/models' }),
    )
    expect(result).toEqual(modelList)
  })

  it('passes AbortSignal', async () => {
    const client = makeClient(modelList)
    const models = new Models(client)
    const controller = new AbortController()

    await models.list(controller.signal)

    expect(client._request).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal }),
    )
  })
})

describe('Models.retrieve', () => {
  it('GETs /v1/models/{model} and returns parsed model', async () => {
    const client = makeClient(model)
    const models = new Models(client)

    const result = await models.retrieve('claude-sonnet-4-6')

    expect(client._request).toHaveBeenCalledWith(
      expect.objectContaining({ method: 'GET', path: '/v1/models/claude-sonnet-4-6' }),
    )
    expect(result).toEqual(model)
  })

  it('URL-encodes the model path parameter', async () => {
    const client = makeClient(model)
    const models = new Models(client)

    await models.retrieve('provider/model name')

    expect(client._request).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/v1/models/provider%2Fmodel%20name' }),
    )
  })

  it('passes AbortSignal', async () => {
    const client = makeClient(model)
    const models = new Models(client)
    const controller = new AbortController()

    await models.retrieve('claude-sonnet-4-6', controller.signal)

    expect(client._request).toHaveBeenCalledWith(
      expect.objectContaining({ signal: controller.signal }),
    )
  })
})
